import { Link } from "react-router-dom";
import StatCard from "../components/common/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import { useData } from "../hooks/useData";
import { fmt, summarize } from "../utils/stats";
// FR-01: today's numbers at a glance. Returns are shown BEFORE distractions on purpose:
// the product rewards coming back, not "zero distractions".
export default function Dashboard() {
  const { sessions, distractions } = useData();
  const s = summarize(sessions, distractions);
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-extrabold">Today</h1>
        <p className="text-ink/60 text-sm">Notice, then return. That is the whole practice.</p></header>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Focus time" value={`${s.todayMinutes} min`} />
        <StatCard label="Sessions finished" value={s.todaySessions} />
        <StatCard label="Returns to task" value={s.returns} hint={s.returns ? `Avg ${fmt(s.avgReturnSeconds)} to return` : undefined} />
        <StatCard label="Distractions noticed" value={s.todayDistractions} hint="Noticing counts as progress" />
        <StatCard label="Day streak" value={s.streak} />
        <Link to="/focus" className="card flex items-center justify-center bg-calm text-white font-extrabold hover:bg-teal-800">Start a session</Link>
      </div>
      <section className="card"><h2 className="font-extrabold mb-2">Recent sessions</h2><RecentActivity sessions={sessions} /></section>
    </div>
  );
}
