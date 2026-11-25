import type { Session } from "../../types";
// Last few sessions. Empty state tells the user what to do next.
export default function RecentActivity({ sessions }: { sessions: Session[] }) {
  if (!sessions.length) return <p className="text-sm text-ink/60">No sessions yet. Start one in the Focus Room.</p>;
  return (
    <ul className="divide-y divide-line">
      {sessions.slice(0, 5).map(s => (
        <li key={s.id} className="py-3 flex justify-between text-sm">
          <span><b>{s.taskTitle}</b> <span className="text-ink/55">{s.category}</span></span>
          <span className="tabular-nums text-ink/70">{Math.round(s.focusSeconds / 60)} min</span>
        </li>
      ))}
    </ul>
  );
}
