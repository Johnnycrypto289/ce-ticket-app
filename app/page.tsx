import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getDashboardMetrics, listTickets } from '@/lib/server/ticket-service';
import { StatusBadge } from '@/components/status-badge';
import { syncInboxAction } from '@/app/actions';

export default async function HomePage() {
  await requireRole(['owner', 'dispatch', 'ledger', 'admin', 'read_only']);
  const [metrics, tickets] = await Promise.all([getDashboardMetrics(), listTickets()]);

  return (
    <main className="page stack">
      <div className="header">
        <div>
          <h1>CE Ticket App</h1>
          <div className="muted">Ticket operations dashboard for TCC / JM workflow</div>
        </div>
        <form action={syncInboxAction}>
          <button className="button primary" type="submit">Sync Gmail Inbox</button>
        </form>
      </div>

      <section className="grid grid-4">
        <div className="card">
          <div className="muted">Open Tickets</div>
          <div className="kpi">{metrics.openTickets}</div>
        </div>
        <div className="card">
          <div className="muted">In Progress</div>
          <div className="kpi">{metrics.inProgress}</div>
        </div>
        <div className="card">
          <div className="muted">Ready for Accounting</div>
          <div className="kpi">{metrics.accountingReady}</div>
        </div>
        <div className="card">
          <div className="muted">Blocked</div>
          <div className="kpi">{metrics.blocked}</div>
        </div>
      </section>

      <section className="card stack">
        <div className="section-title">Active Queue</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Client</th>
                <th>Store</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link href={`/tickets/${ticket.id}`} className="ticket-link">
                      <div><strong>{ticket.ticketNumber}</strong></div>
                      <div className="muted">{ticket.subject}</div>
                    </Link>
                  </td>
                  <td>{ticket.client.name}</td>
                  <td>{ticket.location?.storeName || 'Unknown'}</td>
                  <td>
                    <StatusBadge label={ticket.status.replaceAll('_', ' ')} />
                  </td>
                  <td>
                    <div className={`badge ${ticket.priority === 'URGENT' ? 'red' : ticket.priority === 'HIGH' ? 'amber' : 'green'}`}>
                      {ticket.priority}
                    </div>
                  </td>
                  <td>{ticket.assignedInternalUser?.name || 'Unassigned'}</td>
                  <td className="muted">{new Date(ticket.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">No tickets found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
