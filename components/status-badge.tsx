const toneMap: Record<string, 'red' | 'green' | 'amber'> = {
  Blocked: 'red',
  Closed: 'green',
  Scheduled: 'amber',
  'Awaiting Completion Docs': 'amber',
  'Ready for Accounting': 'green',
};

export function StatusBadge({ label }: { label: string }) {
  const tone = toneMap[label] ?? 'amber';
  return <span className={`badge ${tone}`}>{label}</span>;
}
