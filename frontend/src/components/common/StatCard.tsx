// Reusable number + label tile. Used by Dashboard and Analytics.
export default function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card">
      <div className="text-3xl font-extrabold tabular-nums">{value}</div>
      <div className="text-sm font-bold mt-1">{label}</div>
      {hint && <div className="text-xs text-ink/55 mt-0.5">{hint}</div>}
    </div>
  );
}
