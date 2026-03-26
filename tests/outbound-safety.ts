import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { sendClientEmail } from '../lib/server/gmail';
import { sanitizeOutboundPayload, SANITIZED_TEST_EVENT } from '../lib/server/outbound-policy';

async function main() {
  process.env.TEST_MODE = 'true';
  process.env.OUTBOUND_POLICY = 'safe-template';
  process.env.SAFE_TEMPLATE_TEXT = "We'll update shortly.";
  process.env.PROTECTED_CLIENT_DOMAINS = 'tccmobile.com,pccwireless.com,pccwrs.com,pccphones.com,jmwireless.com,jmmwireless.com';
  process.env.GMAIL_DRY_RUN = 'true';
  process.env.GMAIL_SYNC_ENABLED = 'false';

  const prisma = new PrismaClient();
  const ticket = await prisma.ticket.findFirst({ where: { ticketNumber: 'MT-3763' } });
  if (!ticket) throw new Error('Missing protected ticket');

  const sanitized = sanitizeOutboundPayload({
    toRecipients: 'frank@tccmobile.com',
    ccRecipients: 'ops@contractorengage.com',
    subject: 'Re: test',
    body: 'Unsafe body should not pass',
    threadId: 'thread-demo',
    attachments: [{ filename: 'bad.pdf' }],
  });
  if (sanitized.body !== "We'll update shortly.") throw new Error('Protected recipient body was not sanitized');
  if (sanitized.attachments.length !== 0) throw new Error('Protected recipient attachments were not removed');
  if (sanitized.auditTag !== SANITIZED_TEST_EVENT) throw new Error('Missing sanitized audit tag');

  const normal = sanitizeOutboundPayload({
    toRecipients: 'vendor@example.com',
    ccRecipients: '',
    subject: 'Re: vendor test',
    body: 'Normal body',
    threadId: 'thread-normal',
    attachments: [],
  });
  if (normal.body !== 'Normal body') throw new Error('Non-protected recipient did not follow normal path');

  const msg = await sendClientEmail({ ticketId: ticket.id, body: 'Unsafe message', userEmail: 'dispatch@contractorengage.com' });
  if (msg.bodyText !== "We'll update shortly.") throw new Error('Integration send did not sanitize body');
  if (msg.gmailThreadId !== ticket.gmailThreadId) throw new Error('Integration send did not preserve threadId');
  if (msg.deliveryStatus !== 'SANITIZED_TEST_SEND') throw new Error('Integration send did not tag sanitized delivery status');

  const auditPath = path.resolve(process.cwd(), 'logs', 'outbound-audit.jsonl');
  const audit = await fs.readFile(auditPath, 'utf8');
  if (!audit.includes(SANITIZED_TEST_EVENT)) throw new Error('Audit log missing sanitized_test_send');

  console.log(JSON.stringify({ ok: true, protected: sanitized, normal, integration: { body: msg.bodyText, threadId: msg.gmailThreadId, deliveryStatus: msg.deliveryStatus } }, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
