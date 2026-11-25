import { fmt } from "../../utils/stats";
// The signature element: a ring that fills as time passes. Pure SVG, no library.
export default function TimerRing({ remaining, progress, label }: { remaining: number; progress: number; label: string }) {
  const r = 110, c = 2 * Math.PI * r;
  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox="0 0 256 256" className="-rotate-90">
        <circle cx="128" cy="128" r={r} fill="none" stroke="#D5DCE4" strokeWidth="10" />
        <circle cx="128" cy="128" r={r} fill="none" stroke="#0E7C7B" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - progress)} style={{ transition: "stroke-dashoffset .3s linear" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-extrabold tabular-nums">{fmt(remaining)}</div>
        <div className="text-sm text-ink/60 mt-1 max-w-[10rem] text-center truncate">{label}</div>
      </div>
    </div>
  );
}
