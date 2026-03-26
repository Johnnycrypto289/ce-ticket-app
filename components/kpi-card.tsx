export function KpiCard({ label, value, tone }: { label: string; value: string | number; tone?: 'red' | 'green' | 'amber' }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div className="kpi">{value}</div>
      {tone ? <div className={`badge ${tone}`} style={{ marginTop: 12 }}>{tone.toUpperCase()}</div> : null}
    </div>
  );
}
