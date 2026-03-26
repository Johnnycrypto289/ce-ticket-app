import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getTicket } from '@/lib/server/ticket-service';
import { StatusBadge } from '@/components/status-badge';
import { addInternalNoteAction, createInvoiceAction, createQuoteAction, refreshAiSummaryAction, sendReplyAction, transitionStatusAction } from '@/app/actions';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['owner', 'dispatch', 'ledger', 'admin', 'read_only']);
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) return notFound();

  return (
    <main className="page stack">
      <div className="header">
        <div>
          <Link href="/" className="muted">← Back to queue</Link>
          <h1>{ticket.ticketNumber}</h1>
          <div className="muted">{ticket.subject}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatusBadge label={ticket.status.replaceAll('_', ' ')} />
          <div className="badge red">{ticket.priority}</div>
        </div>
      </div>

      <div className="grid-main">
        <section className="card stack">
          <h3 className="section-title">Ticket Workspace</h3>
          <div><strong>Client:</strong> {ticket.client.name}</div>
          <div><strong>Store:</strong> {ticket.location?.storeName || 'Unknown'}</div>
          <div><strong>Address:</strong> {[ticket.location?.address1, ticket.location?.city, ticket.location?.state, ticket.location?.zip].filter(Boolean).join(', ')}</div>
          <div><strong>Issue Type:</strong> {ticket.issueType || 'Unclassified'}</div>
          <div><strong>Assigned Internal:</strong> {ticket.assignedInternalUser?.name || 'Unassigned'}</div>
          <div><strong>Assigned Contractor:</strong> {ticket.assignedContractor?.companyName || 'Unassigned'}</div>
          <div className="hr" />
          <div><strong>AI Summary</strong><p className="muted">{ticket.latestAiSummary || 'No AI summary yet.'}</p></div>
          <div><strong>Recommended Next Action</strong><p className="muted">{ticket.latestRecommendationSummary || 'No recommendation yet.'}</p></div>
          <form action={refreshAiSummaryAction}><input type="hidden" name="ticketId" value={ticket.id} /><button className="button" type="submit">Refresh AI Summary</button></form>
          <div className="hr" />
          <form action={sendReplyAction} className="stack">
            <strong>Reply to Client</strong>
            <div className="muted">Sends through Gmail using the saved thread ID. Honors dry-run mode when configured.</div>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea className="textarea" name="body" placeholder="Type external reply to TCC / JM here..." />
            <button className="button primary" type="submit">Send Gmail Reply</button>
          </form>
          <form action={addInternalNoteAction} className="stack">
            <strong>Add Internal Note</strong>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea className="textarea" name="noteText" placeholder="Add internal dispatch / ops / accounting note..." />
            <button className="button" type="submit">Save Internal Note</button>
          </form>
          <form action={transitionStatusAction} className="stack">
            <strong>Change Status</strong>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <select className="textarea" name="toStatus" style={{ minHeight: 48 }} defaultValue={ticket.status}>
              {['NEW_INTAKE','AWAITING_RESPONSE','CONTRACTOR_SOURCING','SCHEDULED','IN_PROGRESS','AWAITING_COMPLETION_DOCS','READY_FOR_ACCOUNTING','INVOICED','CLOSED','BLOCKED','ON_HOLD'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <textarea className="textarea" name="reason" placeholder="Reason for status change" />
            <button className="button" type="submit">Apply Status</button>
          </form>
        </section>

        <section className="card stack">
          <h3 className="section-title">Timeline</h3>
          <div className="timeline">
            {ticket.messages.map((item) => (
              <div key={item.id} className="timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <strong>{item.subject}</strong>
                  <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <div className="muted" style={{ marginBottom: 8 }}>{item.direction} • {item.sender}</div>
                <div>{item.bodyText}</div>
              </div>
            ))}
            {ticket.internalNotes.map((item) => (
              <div key={item.id} className="timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <strong>Internal note</strong>
                  <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <div className="muted" style={{ marginBottom: 8 }}>{item.author.name}</div>
                <div>{item.noteText}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="card stack">
          <h3 className="section-title">Operations Sidebar</h3>
          <div><strong>Attachments</strong><div className="stack" style={{ marginTop: 10 }}>{ticket.attachments.map((file) => (<div key={file.id} className="ticket-link"><div>{file.filename}</div><div className="muted">{file.kind} • {file.subtype || 'general'}</div><div className="muted">{file.storagePath}</div></div>))}</div></div>
          <div><strong>Contractor Compliance</strong><div className="stack" style={{ marginTop: 10 }}>{ticket.assignedContractor?.documents?.map?.((doc: any) => (<div key={doc.id} className="ticket-link"><div>{doc.documentType}</div><div className="muted">{doc.status}</div></div>)) || <div className="muted">No contractor docs attached.</div>}</div></div>
          <form action={createQuoteAction} className="stack"><strong>Create Quote</strong><input type="hidden" name="ticketId" value={ticket.id} /><textarea className="textarea" name="scopeSummary" placeholder="Scope summary" /><input className="textarea" name="costAmount" placeholder="Cost amount" style={{ minHeight: 48 }} /><input className="textarea" name="sellAmount" placeholder="Sell amount" style={{ minHeight: 48 }} /><button className="button" type="submit">Create Quote</button></form>
          <div><strong>Quotes</strong><div className="stack" style={{ marginTop: 10 }}>{ticket.quotes.map((quote) => (<div key={quote.id} className="ticket-link"><div>{quote.quoteNumber}</div><div className="muted">{quote.status} • ${quote.sellAmount.toFixed(2)}</div></div>))}</div></div>
          <form action={createInvoiceAction} className="stack"><strong>Create Invoice</strong><input type="hidden" name="ticketId" value={ticket.id} /><input className="textarea" name="clientAmount" placeholder="Client amount" style={{ minHeight: 48 }} /><input className="textarea" name="contractorCost" placeholder="Contractor cost" style={{ minHeight: 48 }} /><button className="button" type="submit">Create Invoice</button></form>
          <div><strong>Invoices</strong><div className="stack" style={{ marginTop: 10 }}>{ticket.invoices.map((invoice) => (<div key={invoice.id} className="ticket-link"><div>{invoice.invoiceNumber}</div><div className="muted">{invoice.status} • ${invoice.clientAmount.toFixed(2)}</div></div>))}</div></div>
        </aside>
      </div>
    </main>
  );
}
