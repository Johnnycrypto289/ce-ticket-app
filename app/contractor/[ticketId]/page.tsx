import { notFound } from 'next/navigation';
import { getTicket } from '@/lib/server/ticket-service';

export default async function ContractorPortalPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const ticket = await getTicket(ticketId);
  if (!ticket) return notFound();

  return (
    <main className="page stack" style={{ maxWidth: 900 }}>
      <div className="card stack">
        <h1>Contractor Portal</h1>
        <div className="muted">Ticket {ticket.ticketNumber} • {ticket.location?.storeName || ticket.subject}</div>
        <div><strong>Status:</strong> {ticket.status}</div>
        <div><strong>Assigned Contractor:</strong> {ticket.assignedContractor?.companyName || 'Unassigned'}</div>
        <div><strong>Required Docs:</strong> W9 / COI / completion photos / completion note</div>
        <div className="ticket-link">
          <div>Portal path is scaffolded for v1.</div>
          <div className="muted">Next implementation step: secure tokenized contractor access, upload actions, and structured updates.</div>
        </div>
      </div>
    </main>
  );
}
