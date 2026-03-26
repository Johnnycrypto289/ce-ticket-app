import path from 'path';
import { google } from 'googleapis';
import { prisma } from '@/lib/server/prisma';
import { writeBufferFile } from '@/lib/server/storage';
import { sanitizeOutboundPayload } from '@/lib/server/outbound-policy';
import { appendAuditLog } from '@/lib/server/audit-log';

function getOAuthClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function gmailEnabled() {
  return process.env.GMAIL_SYNC_ENABLED === 'true';
}

function gmailDryRun() {
  return process.env.GMAIL_DRY_RUN !== 'false';
}

export async function sendClientEmail(input: {
  ticketId: string;
  body: string;
  userEmail: string;
  attachments?: Array<{ filename: string; content: Buffer; mimeType: string }>;
}) {
  const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId }, include: { messages: true } });
  if (!ticket) throw new Error('Ticket not found');
  const latestInbound = [...ticket.messages].reverse().find((msg) => msg.direction === 'INBOUND');
  const subject = latestInbound?.subject?.startsWith('Re:') ? latestInbound.subject : `Re: ${ticket.subject}`;
  const toRecipients = latestInbound?.sender || '';
  const ccRecipients = latestInbound?.ccRecipients || '';

  const outbound = sanitizeOutboundPayload({
    toRecipients,
    ccRecipients,
    subject,
    body: input.body,
    threadId: ticket.gmailThreadId,
    attachments: input.attachments?.map((a) => ({ filename: a.filename })) || [],
  });

  await appendAuditLog({
    kind: outbound.auditTag,
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    toRecipients: outbound.toRecipients,
    ccRecipients: outbound.ccRecipients,
    subject: outbound.subject,
    threadId: outbound.threadId,
  });

  if (!gmailEnabled() || gmailDryRun()) {
    return prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        direction: 'OUTBOUND',
        gmailThreadId: outbound.threadId,
        sender: input.userEmail,
        toRecipients: outbound.toRecipients,
        ccRecipients: outbound.ccRecipients,
        subject: outbound.subject,
        bodyText: outbound.body,
        sentAt: new Date(),
        deliveryStatus: outbound.sanitized ? 'SANITIZED_TEST_SEND' : 'DRY_RUN',
      },
    });
  }

  const oauth2 = getOAuthClient();
  if (!oauth2) throw new Error('Missing Gmail OAuth credentials');
  const gmail = google.gmail({ version: 'v1', auth: oauth2 });
  const raw = Buffer.from([
    `To: ${outbound.toRecipients}`,
    outbound.ccRecipients ? `Cc: ${outbound.ccRecipients}` : '',
    `Subject: ${outbound.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    outbound.body,
  ].filter(Boolean).join('\\n')).toString('base64url');

  const sent = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId: outbound.threadId || undefined },
  });

  return prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      direction: 'OUTBOUND',
      gmailMessageId: sent.data.id || undefined,
      gmailThreadId: sent.data.threadId || ticket.gmailThreadId,
      sender: input.userEmail,
      toRecipients: outbound.toRecipients,
      ccRecipients: outbound.ccRecipients,
      subject: outbound.subject,
      bodyText: outbound.body,
      sentAt: new Date(),
      deliveryStatus: outbound.sanitized ? 'SANITIZED_TEST_SEND' : 'SENT',
    },
  });
}

function extractHeader(headers: { name?: string | null; value?: string | null }[] | undefined, name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBody(data?: string | null) {
  if (!data) return '';
  return Buffer.from(data, 'base64').toString('utf8');
}

function extractTicketNumber(subject: string) {
  const match = subject.match(/MT-\d+/i);
  return match?.[0]?.toUpperCase() || null;
}

async function upsertLocationAndClient(from: string, subject: string) {
  const isJM = /jm|jmmwireless/i.test(from + ' ' + subject);
  const code = isJM ? 'JMW' : 'TCC';
  const name = isJM ? 'JM Wireless' : 'TCC Wireless';
  const client = await prisma.client.upsert({
    where: { code },
    update: { name },
    create: { code, name, emailDomains: isJM ? 'jmmwireless.com' : 'tccmobile.com' },
  });
  return { client };
}

async function saveAttachments(ticketId: string, parts: any[] | undefined) {
  if (!parts) return;
  for (const part of parts) {
    const filename = part.filename;
    if (!filename) continue;
    const mimeType = part.mimeType || 'application/octet-stream';
    const kind = mimeType.startsWith('image/') ? 'PHOTO' : 'DOCUMENT';
    const bodyData = part.body?.data;
    if (!bodyData) continue;
    const buffer = Buffer.from(bodyData, 'base64');
    const storagePath = await writeBufferFile(`tickets/${ticketId}`, filename, buffer);
    await prisma.ticketAttachment.create({
      data: {
        ticketId,
        kind,
        filename,
        mimeType,
        storagePath: path.relative(process.cwd(), storagePath),
        source: 'email',
      },
    });
  }
}

export async function syncInbox(options?: { maxResults?: number }) {
  if (!gmailEnabled()) return { synced: 0, dryRun: gmailDryRun(), message: 'Gmail sync disabled' };
  const oauth2 = getOAuthClient();
  if (!oauth2) throw new Error('Missing Gmail OAuth credentials');
  const gmail = google.gmail({ version: 'v1', auth: oauth2 });
  const response = await gmail.users.messages.list({ userId: 'me', q: 'in:inbox', maxResults: options?.maxResults || 10 });
  let synced = 0;
  for (const item of response.data.messages || []) {
    if (!item.id) continue;
    const full = await gmail.users.messages.get({ userId: 'me', id: item.id, format: 'full' });
    const payload = full.data.payload;
    const headers = payload?.headers || [];
    const subject = extractHeader(headers, 'Subject');
    const from = extractHeader(headers, 'From');
    const ticketNumber = extractTicketNumber(subject);
    if (!ticketNumber) continue;
    const { client } = await upsertLocationAndClient(from, subject);
    let ticket = await prisma.ticket.findUnique({ where: { ticketNumber } });
    if (!ticket) {
      ticket = await prisma.ticket.create({ data: { ticketNumber, clientId: client.id, subject, issueSummary: subject, sourceChannel: 'gmail', gmailThreadId: full.data.threadId || undefined, gmailMessageIdFirst: full.data.id || undefined, status: 'NEW_INTAKE' } });
    }
    const existing = await prisma.ticketMessage.findFirst({ where: { gmailMessageId: full.data.id || undefined } });
    if (existing) continue;
    const bodyText = decodeBody(payload?.body?.data) || decodeBody(payload?.parts?.find((p: any) => p.mimeType === 'text/plain')?.body?.data) || subject;
    await prisma.ticketMessage.create({ data: { ticketId: ticket.id, direction: 'INBOUND', gmailMessageId: full.data.id || undefined, gmailThreadId: full.data.threadId || undefined, sender: from, toRecipients: extractHeader(headers, 'To'), ccRecipients: extractHeader(headers, 'Cc'), subject, bodyText, receivedAt: new Date(Number(full.data.internalDate || Date.now())), parsedTicketNumber: ticketNumber } });
    await saveAttachments(ticket.id, payload?.parts);
    synced += 1;
  }
  return { synced, dryRun: gmailDryRun() };
}
