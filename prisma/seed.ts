import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.aiSummary.deleteMany();
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticketInvoice.deleteMany();
  await prisma.ticketQuote.deleteMany();
  await prisma.ticketAssignment.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticketInternalNote.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.contractorDocument.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.location.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.slaPolicy.deleteMany();

  const owner = await prisma.user.create({ data: { name: 'Johnathan', email: 'owner@contractorengage.com', role: 'owner' } });
  const dispatch = await prisma.user.create({ data: { name: 'Dispatch', email: 'dispatch@contractorengage.com', role: 'dispatch' } });
  const ledger = await prisma.user.create({ data: { name: 'Ledger', email: 'ledger@contractorengage.com', role: 'ledger' } });
  const admin = await prisma.user.create({ data: { name: 'Admin', email: 'admin@contractorengage.com', role: 'admin' } });
  const atlas = await prisma.user.create({ data: { name: 'Atlas', email: 'atlas@contractorengage.com', role: 'admin' } });

  const policy = await prisma.slaPolicy.create({
    data: {
      name: 'Default TCC/JM',
      firstResponseMinutes: 20,
      updateDueMinutes: 1440,
      completionTargetHours: 48,
      escalationRulesJson: JSON.stringify({ notify: ['dispatch', 'owner', 'ledger'] }),
    },
  });

  const jm = await prisma.client.create({ data: { name: 'JM Wireless', code: 'JMW', emailDomains: 'jmmwireless.com' } });
  const tcc = await prisma.client.create({ data: { name: 'TCC Wireless', code: 'TCC', emailDomains: 'tccmobile.com' } });

  const loc1 = await prisma.location.create({ data: { clientId: jm.id, externalLocationCode: 'JM70852561', storeName: 'Douglas Blvd & Yale', address1: '6842 Douglas Blvd, Suite E', city: 'Douglasville', state: 'GA', zip: '30135', phone: '770-942-7592' } });
  const loc2 = await prisma.location.create({ data: { clientId: tcc.id, externalLocationCode: '1JSQ', storeName: 'Tempe Marketplace', address1: '2000 E Rio Salado Pkwy', city: 'Tempe', state: 'AZ', zip: '85288' } });

  const contractor = await prisma.contractor.create({ data: { companyName: 'Comfort Systems', primaryContact: 'Ops Desk', email: 'ops@comfortsystems.example', coverageStates: 'GA,AZ', trades: 'HVAC,General Repair', paymentTerms: 'Net 15' } });
  await prisma.contractorDocument.createMany({ data: [
    { contractorId: contractor.id, documentType: 'W9', status: 'APPROVED', storagePath: 'storage/docs/w9.pdf' },
    { contractorId: contractor.id, documentType: 'COI', status: 'EXPIRED', storagePath: 'storage/docs/coi.pdf' },
  ] });

  const blocked = await prisma.ticket.create({ data: {
    ticketNumber: 'MT-3763', clientId: jm.id, locationId: loc1.id, externalWorkOrder: 'MT-3763', sapNumber: 'JM70852561', subject: 'JM70852561-GA Douglas Blvd & Yale heater out', issueSummary: 'Store reports heater is out and needs to be checked and resolved.', issueType: 'HVAC', priority: 'URGENT', status: 'BLOCKED', sourceChannel: 'gmail', gmailThreadId: 'thread-demo-3763', gmailMessageIdFirst: 'message-demo-3763-1', openedAt: new Date('2026-02-18T01:12:00Z'), dueAt: new Date('2026-02-20T01:12:00Z'), slaPolicyId: policy.id, assignedInternalUserId: dispatch.id, assignedContractorId: contractor.id, blockedReason: 'Pending contractor authorization', latestAiSummary: 'Long-aging HVAC outage ticket requiring contractor authorization and immediate scheduling.', latestRecommendationSummary: 'Approve contractor or assign alternate HVAC vendor by next business cycle.', invoiceStatus: 'DRAFT', quoteStatus: 'DRAFT', agingHours: 936 } });

  const scheduled = await prisma.ticket.create({ data: {
    ticketNumber: 'MT-23446', clientId: tcc.id, locationId: loc2.id, externalWorkOrder: 'MT-23446', subject: 'Tempe Marketplace laminate follow-up', issueSummary: 'Laminate has been ordered and scheduling needs confirmation.', issueType: 'Flooring', priority: 'HIGH', status: 'SCHEDULED', sourceChannel: 'gmail', gmailThreadId: 'thread-demo-23446', gmailMessageIdFirst: 'message-demo-23446-1', openedAt: new Date('2026-03-18T21:53:00Z'), slaPolicyId: policy.id, assignedInternalUserId: dispatch.id, assignedContractorId: contractor.id, latestAiSummary: 'Scheduled ticket pending field completion.', latestRecommendationSummary: 'Confirm field date and prep closeout checklist.', agingHours: 170 } });

  const inbound = await prisma.ticketMessage.create({ data: { ticketId: blocked.id, direction: 'INBOUND', gmailMessageId: 'message-demo-3763-1', gmailThreadId: 'thread-demo-3763', sender: 'Maintenance@jmmwireless.com', toRecipients: 'facilities@contractorengage.com', subject: 'JM70852561-GA Douglas Blvd & Yale [Ticket ID: MT-3763]', bodyText: 'Store reports heater is out and needs to be checked and resolved. Please share ETA and completion details.', receivedAt: new Date('2026-02-18T01:12:00Z'), parsedTicketNumber: 'MT-3763' } });
  await prisma.ticketMessage.create({ data: { ticketId: blocked.id, direction: 'OUTBOUND', gmailThreadId: 'thread-demo-3763', sender: owner.email, toRecipients: 'Maintenance@jmmwireless.com', subject: 'Re: JM70852561-GA Douglas Blvd & Yale [Ticket ID: MT-3763]', bodyText: 'We are coordinating contractor confirmation and will provide ETA shortly.', sentAt: new Date('2026-03-24T11:32:00Z'), deliveryStatus: 'DRY_RUN' } });
  await prisma.ticketMessage.create({ data: { ticketId: scheduled.id, direction: 'INBOUND', gmailMessageId: 'message-demo-23446-1', gmailThreadId: 'thread-demo-23446', sender: 'frank@tccmobile.com', toRecipients: 'facilities@contractorengage.com', subject: 'Re: 1JSQ-AZ Tempe Marketplace [Ticket ID: MT-23446]', bodyText: 'Laminate is ordered. Please confirm schedule.', receivedAt: new Date('2026-03-24T17:35:00Z'), parsedTicketNumber: 'MT-23446' } });

  await prisma.ticketAttachment.createMany({ data: [
    { ticketId: blocked.id, ticketMessageId: inbound.id, kind: 'PHOTO', subtype: 'before', filename: 'store-photo-1.jpg', mimeType: 'image/jpeg', storagePath: 'storage/tickets/MT-3763/store-photo-1.jpg', source: 'email' },
    { ticketId: blocked.id, kind: 'QUOTE', subtype: 'estimate', filename: 'vendor-quote.pdf', mimeType: 'application/pdf', storagePath: 'storage/tickets/MT-3763/vendor-quote.pdf', source: 'upload' },
  ] });

  await prisma.ticketInternalNote.createMany({ data: [
    { ticketId: blocked.id, authorUserId: atlas.id, noteText: 'Dispatch still needs contractor approval path. Escalate if no movement by morning.', noteType: 'ops', pinned: true },
    { ticketId: scheduled.id, authorUserId: dispatch.id, noteText: 'Laminate ordered. Waiting on field schedule confirmation.', noteType: 'dispatch', pinned: false },
  ] });

  await prisma.ticketAssignment.create({ data: { ticketId: blocked.id, contractorId: contractor.id, assignedByUserId: dispatch.id, assignmentStatus: 'pending_approval', scopeNotes: 'HVAC inspection and repair authorization pending' } });
  await prisma.ticketQuote.create({ data: { ticketId: blocked.id, contractorId: contractor.id, quoteNumber: 'Q-3763-1', status: 'DRAFT', scopeSummary: 'HVAC inspection and heater repair', costAmount: 1250, sellAmount: 1850, marginAmount: 600, createdByUserId: dispatch.id } });
  await prisma.ticketInvoice.create({ data: { ticketId: blocked.id, invoiceNumber: 'INV-3763-1', status: 'DRAFT', clientAmount: 0, contractorCost: 0, marginAmount: 0 } });
  await prisma.ticketStatusHistory.createMany({ data: [
    { ticketId: blocked.id, toStatus: 'BLOCKED', changedByUserId: atlas.id, reason: 'Waiting on contractor authorization' },
    { ticketId: scheduled.id, toStatus: 'SCHEDULED', changedByUserId: dispatch.id, reason: 'Laminate ordered and scheduling pending' },
  ] });
  await prisma.aiSummary.createMany({ data: [
    { ticketId: blocked.id, kind: 'summary', content: 'HVAC outage ticket for Douglasville store. Authorization is the current blocker.', modelName: 'openai/gpt-5.4' },
    { ticketId: scheduled.id, kind: 'summary', content: 'Tempe ticket is scheduled pending final field coordination.', modelName: 'openai/gpt-5.4' },
  ] });

  console.log('Seed complete', { owner: owner.email, dispatch: dispatch.email, ledger: ledger.email, admin: admin.email });
}

main().finally(async () => { await prisma.$disconnect(); });
