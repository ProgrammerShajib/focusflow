import { useState } from "react";
import TimerRing from "../components/focus/TimerRing";
import { distractionsApi, sessionsApi } from "../services/api";
import { useTimer } from "../hooks/useTimer";
import type { Category, Distraction, DistractionKind, Intensity } from "../types";

const CATEGORIES: Category[] = ["Coding", "English", "Reading", "Study", "Other"];
const DURATIONS = [15, 25, 35, 45];
const KINDS: DistractionKind[] = ["News & social media", "Imaginary conversations", "Future thoughts", "Past memories", "Random thoughts", "Other"];
const INTENSITIES: Intensity[] = ["Easy", "Medium", "Hard"];

/**
 * Focus Room is a small state machine (FR-02, FR-03, FR-04):
 *   setup -> focusing <-> (noticing -> returning) -> finished
 * One `phase` variable decides which panel is on screen, which keeps the logic easy to follow.
 */
type Phase = "setup" | "focusing" | "noticing" | "returning" | "finished";

export default function FocusRoom() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [title, setTitle] = useState(""); const [category, setCategory] = useState<Category>("Coding");
  const [minutes, setMinutes] = useState(25);
  const [sessionId, setSessionId] = useState(""); const [error, setError] = useState("");
  const [kind, setKind] = useState<DistractionKind>("Random thoughts"); const [intensity, setIntensity] = useState<Intensity>("Easy"); const [note, setNote] = useState("");
  const [current, setCurrent] = useState<Distraction | null>(null);
  const [count, setCount] = useState(0);

  const timer = useTimer(minutes * 60, () => safe(() => finish(true)));

  // The server now owns the session lifecycle: start -> (distractions) -> finish.
  async function finish(completed: boolean) {
    timer.pause();
    await sessionsApi.finish(sessionId, timer.elapsedSeconds, completed);
    setPhase("finished");
  }
  async function begin() {
    const s = await sessionsApi.start({ taskTitle: title, category, plannedMinutes: minutes }); // create first, so a server failure never starts the clock
    setSessionId(s.id); setCount(0);
    timer.reset(); timer.start(); setPhase("focusing");
  }
  // Every network action goes through safe(): one place that turns failures into a visible message.
  async function safe(fn: () => Promise<void>) {
    try { setError(""); await fn(); }
    catch { setError("Could not reach the server. Check that the backend is running."); }
  }
  // Recording a distraction pauses the clock: it is not "wasted" time, it is the practice.
  async function saveDistraction() {
    const d = await distractionsApi.create({ sessionId, kind, intensity, note });
    setCurrent(d); setCount(c => c + 1); setNote(""); setPhase("returning");
  }
  async function confirmReturn() {
    if (current) await distractionsApi.markReturned(current.id);
    timer.start(); setPhase("focusing");
  }
  const reset = () => { timer.reset(); setTitle(""); setPhase("setup"); };

  if (phase === "setup") return (
    <div className="max-w-md space-y-5">
      <h1 className="text-2xl font-extrabold">Focus Room</h1>
      <input className="input" placeholder="What will you work on?" value={title} onChange={e => setTitle(e.target.value)} />
      <Choice label="Category" options={CATEGORIES} value={category} onPick={setCategory} />
      <Choice label="Duration" options={DURATIONS} value={minutes} onPick={setMinutes} fmt={m => `${m} min`} />
      <button className="btn-primary w-full disabled:opacity-40" disabled={!title.trim()} onClick={() => safe(begin)}>Start session</button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );

  if (phase === "finished") return (
    <div className="card max-w-md text-center space-y-3">
      <h1 className="text-2xl font-extrabold">Session saved</h1>
      <p className="text-ink/70 text-sm">{Math.round(timer.elapsedSeconds / 60)} min on “{title}”. You noticed {count} distraction{count === 1 ? "" : "s"} and came back each time.</p>
      <button className="btn-primary" onClick={reset}>New session</button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-6">
      <TimerRing remaining={timer.remaining} progress={timer.progress} label={title} />
      {error && <p className="text-sm text-red-700 text-center">{error}</p>}
      {phase === "focusing" && (
        <div className="flex gap-2 justify-center flex-wrap">
          <button className="btn-ghost" onClick={timer.running ? timer.pause : timer.start}>{timer.running ? "Pause" : "Resume"}</button>
          <button className="btn bg-driftsoft text-drift hover:bg-amber-100" onClick={() => { timer.pause(); setPhase("noticing"); }}>I got distracted</button>
          <button className="btn-ghost" onClick={() => safe(() => finish(false))}>Finish</button>
        </div>
      )}
      {phase === "noticing" && (
        <div className="card space-y-4">
          <h2 className="font-extrabold">Good catch. What pulled you away?</h2>
          <Choice label="Type" options={KINDS} value={kind} onPick={setKind} />
          <Choice label="How strong was the pull?" options={INTENSITIES} value={intensity} onPick={setIntensity} />
          <input className="input" placeholder="Short note (optional)" value={note} onChange={e => setNote(e.target.value)} />
          <button className="btn-primary w-full" onClick={() => safe(saveDistraction)}>Save and continue</button>
        </div>
      )}
      {phase === "returning" && (
        <div className="card space-y-3 text-center">
          <p className="text-sm text-ink/60">Your task</p>
          <h2 className="text-xl font-extrabold">{title}</h2>
          <p className="text-sm">Next small step: write one line, or read one paragraph.</p>
          <button className="btn-primary w-full" onClick={() => safe(confirmReturn)}>I'm back</button>
        </div>
      )}
    </div>
  );
}

// Generic chip selector, reused for every "pick one" input above.
function Choice<T extends string | number>({ label, options, value, onPick, fmt = String }:
  { label: string; options: T[]; value: T; onPick: (v: T) => void; fmt?: (v: T) => string }) {
  return (
    <div><div className="text-sm font-bold mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">{options.map(o => (
        <button key={String(o)} onClick={() => onPick(o)} aria-pressed={o === value}
          className={`btn border ${o === value ? "bg-calm text-white border-calm" : "bg-white border-line hover:bg-mist"}`}>{fmt(o)}</button>))}
      </div></div>
  );
}
