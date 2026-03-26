import { PrismaClient } from '@prisma/client';
import { addInternalNote, createInvoice, createQuote, refreshAiSummary, runSlaEscalationSweep, transitionTicketStatus } from '../lib/server/ticket-service';

async function main() {
  const prisma = new PrismaClient();
  const ticket = await prisma.ticket.findFirst({ where: { ticketNumber: 'MT-3763' } });
  const user = await prisma.user.findFirst({ where: { email: 'dispatch@contractorengage.com' } });
  if (!ticket || !user) throw new Error('Seed data missing');

  await addInternalNote(ticket.id, user.id, 'Smoke note');
  await transitionTicketStatus(ticket.id, 'IN_PROGRESS', user.id, 'Smoke transition');
  await createQuote(ticket.id, user.id, 'Smoke quote', 100, 150);
  await createInvoice(ticket.id, 200, 120);
  const summary = await refreshAiSummary(ticket.id);
  const escalations = await runSlaEscalationSweep();

  console.log(JSON.stringify({
    ok: true,
    summary,
    escalations,
  }, null, 2));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
