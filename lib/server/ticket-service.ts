import { prisma } from '@/lib/server/prisma';
import { summarizeTicket } from '@/lib/server/openai';

export async function getDashboardMetrics() {
  const [openTickets, inProgress, accountingReady, blocked] = await Promise.all([
    prisma.ticket.count({ where: { status: { not: 'CLOSED' } } }),
    prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { status: 'READY_FOR_ACCOUNTING' } }),
    prisma.ticket.count({ where: { status: 'BLOCKED' } }),
  ]);
  return { openTickets, inProgress, accountingReady, blocked };
}

export async function listTickets() {
  return prisma.ticket.findMany({ orderBy: { updatedAt: 'desc' }, include: { client: true, location: true, assignedContractor: true } });
}

export async function getTicket(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      client: true,
      location: true,
      assignedInternalUser: true,
      assignedContractor: { include: { documents: true } },
      messages: { orderBy: { createdAt: 'asc' } },
      internalNotes: { include: { author: true }, orderBy: { createdAt: 'desc' } },
      attachments: true,
      quotes: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      statusHistory: { orderBy: { changedAt: 'desc' } },
    },
  });
}

export async function addInternalNote(ticketId: string, authorUserId: string, noteText: string, noteType = 'ops') {
  return prisma.ticketInternalNote.create({ data: { ticketId, authorUserId, noteText, noteType } });
}

export async function transitionTicketStatus(ticketId: string, toStatus: any, changedByUserId: string, reason?: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found');
  await prisma.ticket.update({ where: { id: ticketId }, data: { status: toStatus } });
  return prisma.ticketStatusHistory.create({ data: { ticketId, fromStatus: ticket.status, toStatus, changedByUserId, reason } });
}

export async function createQuote(ticketId: string, createdByUserId: string, scopeSummary: string, costAmount: number, sellAmount: number) {
  const count = await prisma.ticketQuote.count({ where: { ticketId } });
  return prisma.ticketQuote.create({
    data: {
      ticketId,
      createdByUserId,
      quoteNumber: `Q-${ticketId.slice(0, 6).toUpperCase()}-${count + 1}`,
      scopeSummary,
      costAmount,
      sellAmount,
      marginAmount: sellAmount - costAmount,
    },
  });
}

export async function createInvoice(ticketId: string, clientAmount: number, contractorCost: number) {
  const count = await prisma.ticketInvoice.count({ where: { ticketId } });
  return prisma.ticketInvoice.create({
    data: {
      ticketId,
      invoiceNumber: `INV-${ticketId.slice(0, 6).toUpperCase()}-${count + 1}`,
      clientAmount,
      contractorCost,
      marginAmount: clientAmount - contractorCost,
      status: 'READY',
    },
  });
}

export async function refreshAiSummary(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { messages: true, assignedContractor: true } });
  if (!ticket) throw new Error('Ticket not found');
  const timeline = ticket.messages.map((msg) => `[${msg.direction}] ${msg.subject} :: ${msg.bodyText}`).join('\\n');
  const result = await summarizeTicket({ subject: ticket.subject, timeline, status: ticket.status, contractor: ticket.assignedContractor?.companyName });
  await prisma.ticket.update({ where: { id: ticketId }, data: { latestAiSummary: result.summary, latestRecommendationSummary: result.recommendation } });
  await prisma.aiSummary.create({ data: { ticketId, kind: 'summary', content: `${result.summary}\\n\\nRecommendation: ${result.recommendation}`, modelName: result.model } });
  return result;
}

export async function runSlaEscalationSweep() {
  const now = Date.now();
  const tickets = await prisma.ticket.findMany({ where: { status: { notIn: ['CLOSED', 'INVOICED'] } }, include: { slaPolicy: true } });
  const escalations = [] as Array<{ ticketNumber: string; reason: string }>;
  for (const ticket of tickets) {
    const ageHours = Math.floor((now - new Date(ticket.firstSeenAt).getTime()) / 36e5);
    if (ticket.status === 'BLOCKED' && ageHours > 24) escalations.push({ ticketNumber: ticket.ticketNumber, reason: 'Blocked > 24h' });
    if (ticket.status === 'AWAITING_COMPLETION_DOCS' && ageHours > 48) escalations.push({ ticketNumber: ticket.ticketNumber, reason: 'Awaiting completion docs > 48h' });
  }
  return escalations;
}
