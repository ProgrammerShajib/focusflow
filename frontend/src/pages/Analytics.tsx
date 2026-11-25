import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatCard from "../components/common/StatCard";
import { useData } from "../hooks/useData";
import { byKind, fmt, last7Days } from "../utils/stats";
const COLORS = ["#0E7C7B", "#C9822B", "#4A6FA5", "#8A6BB1", "#5E8C61", "#9AA5B1"];
// FR-06: totals, weekly trend and distraction categories. Charts come from Recharts.
export default function Analytics() {
  const { sessions, distractions } = useData();
  const week = last7Days(sessions, distractions); const kinds = byKind(distractions);
  const total = Math.round(sessions.reduce((a, s) => a + s.focusSeconds, 0) / 60);
  const done = distractions.filter(d => d.recoverySeconds !== undefined);
  const avg = done.length ? Math.round(done.reduce((a, d) => a + d.recoverySeconds!, 0) / done.length) : 0;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total focus" value={`${total} min`} /><StatCard label="Distractions noticed" value={distractions.length} />
        <StatCard label="Returns" value={done.length} /><StatCard label="Avg return time" value={fmt(avg)} />
      </div>
      <section className="card"><h2 className="font-extrabold mb-3">Focus minutes, last 7 days</h2>
        <div className="h-56"><ResponsiveContainer><BarChart data={week}>
          <CartesianGrid stroke="#D5DCE4" vertical={false} /><XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip />
          <Bar dataKey="minutes" fill="#0E7C7B" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="card"><h2 className="font-extrabold mb-3">What pulls you away</h2>
        {kinds.length ? <div className="h-56"><ResponsiveContainer><PieChart>
          <Pie data={kinds} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85}>{kinds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
          <Tooltip /></PieChart></ResponsiveContainer></div>
          : <p className="text-sm text-ink/60">No distractions recorded yet. Patterns show up after a few sessions.</p>}
        <ul className="text-sm mt-2 space-y-1">{kinds.map((k, i) => <li key={k.name}><span style={{ color: COLORS[i % COLORS.length] }}>●</span> {k.name}: {k.value}</li>)}</ul>
      </section>
    </div>
  );
}
