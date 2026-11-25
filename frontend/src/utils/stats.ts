import type { Distraction, Session } from "../types";
// Pure functions: data in, numbers out. Easy to unit-test later with Vitest.
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
export const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function summarize(sessions: Session[], ds: Distraction[]) {
  const today = dayKey(new Date().toISOString());
  const t = sessions.filter(s => dayKey(s.endedAt) === today);
  const returned = ds.filter(d => d.recoverySeconds !== undefined);
  return {
    todayMinutes: Math.round(t.reduce((a, s) => a + s.focusSeconds, 0) / 60),
    todaySessions: t.length,
    todayDistractions: ds.filter(d => dayKey(d.occurredAt) === today).length,
    returns: returned.length,
    avgReturnSeconds: returned.length ? Math.round(returned.reduce((a, d) => a + d.recoverySeconds!, 0) / returned.length) : 0,
    streak: streak(sessions),
  };
}
// Streak = consecutive days (ending today or yesterday) with at least one session.
export function streak(sessions: Session[]) {
  const days = new Set(sessions.map(s => dayKey(s.endedAt)));
  let n = 0; const d = new Date();
  if (!days.has(dayKey(d.toISOString()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.toISOString()))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function last7Days(sessions: Session[], ds: Distraction[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = dayKey(d.toISOString());
    return { day: d.toLocaleDateString("en", { weekday: "short" }),
      minutes: Math.round(sessions.filter(s => dayKey(s.endedAt) === k).reduce((a, s) => a + s.focusSeconds, 0) / 60),
      distractions: ds.filter(x => dayKey(x.occurredAt) === k).length };
  });
}
export const byKind = (ds: Distraction[]) =>
  Object.entries(ds.reduce<Record<string, number>>((a, d) => ({ ...a, [d.kind]: (a[d.kind] ?? 0) + 1 }), {})).map(([name, value]) => ({ name, value }));
