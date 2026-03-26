export const dashboardMetrics = {
  openTickets: 84,
  inProgress: 14,
  accountingReady: 11,
  blocked: 6,
};

export const ticketList = [
  {
    id: 't1',
    ticketNumber: 'MT-23446',
    client: 'TCC Wireless',
    store: 'Tempe Marketplace',
    state: 'AZ',
    priority: 'High',
    status: 'Scheduled',
    aging: '7d',
    summary: 'Laminate ordered, scheduling field completion and closeout coordination.',
  },
  {
    id: 't2',
    ticketNumber: 'MT-3763',
    client: 'JM Wireless',
    store: 'Douglas Blvd & Yale',
    state: 'GA',
    priority: 'Urgent',
    status: 'Blocked',
    aging: '39d',
    summary: 'HVAC/heater issue. Needs contractor authorization and dispatch action.',
  },
  {
    id: 't3',
    ticketNumber: 'MT-3907',
    client: 'JM Wireless',
    store: 'NY Broadway',
    state: 'NY',
    priority: 'Medium',
    status: 'Awaiting Completion Docs',
    aging: '6d',
    summary: 'Work completed but photos and completion package still missing.',
  },
];

export const ticketDetail = {
  id: 't2',
  ticketNumber: 'MT-3763',
  subject: 'JM70852561-GA Douglas Blvd & Yale heater out',
  client: 'JM Wireless',
  store: 'Metro By T-Mobile — Douglas Blvd & Yale',
  address: '6842 Douglas Blvd, Suite E, Douglasville, GA 30135',
  priority: 'Urgent',
  status: 'Blocked',
  issueType: 'HVAC',
  assignedTo: 'Dispatch',
  contractor: 'Comfort Systems (pending approval)',
  aiSummary: 'Heater outage ticket with long aging. Ticket needs explicit contractor authorization and immediate scheduling path. Completion package should require before/after photos, resolution note, and cost support.',
  recommendation: 'Approve contractor or assign alternate HVAC vendor tonight. If not assigned by morning, escalate to owner and dispatch lead.',
  timeline: [
    {
      type: 'inbound',
      at: '2026-02-18 01:12',
      from: 'Maintenance@jmmwireless.com',
      subject: 'JM70852561-GA Douglas Blvd & Yale [Ticket ID: MT-3763]',
      body: 'Store reports heater is out and needs to be checked and resolved. Please share ETA and completion details.',
    },
    {
      type: 'internal_note',
      at: '2026-03-24 09:10',
      from: 'Atlas',
      subject: 'Internal note',
      body: 'Dispatch still waiting on contractor authorization path. Aging now critical.',
    },
    {
      type: 'outbound',
      at: '2026-03-24 11:32',
      from: 'facilities@contractorengage.com',
      subject: 'Re: JM70852561-GA Douglas Blvd & Yale [Ticket ID: MT-3763]',
      body: 'We are coordinating contractor confirmation and will provide ETA shortly.',
    },
  ],
  attachments: [
    { name: 'store-photo-1.jpg', kind: 'photo', subtype: 'before' },
    { name: 'vendor-quote.pdf', kind: 'quote', subtype: 'estimate' },
  ],
  closeoutChecklist: [
    { label: 'Before photos', done: false },
    { label: 'After photos', done: false },
    { label: 'Completion note', done: false },
    { label: 'Contractor invoice', done: false },
  ],
  contractorDocs: [
    { name: 'W9', status: 'Approved' },
    { name: 'COI', status: 'Expired' },
  ],
  quotes: [
    { number: 'Q-3763-1', status: 'Draft', sell: '$1,850.00' },
  ],
  invoices: [
    { number: 'INV-3763-1', status: 'Draft', amount: '$0.00' },
  ],
};
