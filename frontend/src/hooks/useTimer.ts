import { useEffect, useRef, useState } from "react";
/**
 * Reliable countdown. Browsers throttle setInterval in background tabs, so we never
 * "subtract 1 each tick". We store timestamps and compute elapsed = now - lastTick,
 * which stays correct even if ticks are delayed.
 */
export function useTimer(totalSeconds: number, onDone: () => void) {
  const [elapsedMs, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const last = useRef(0);
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    if (!running) return;
    last.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now(); const delta = now - last.current; last.current = now;
      setElapsed(e => e + delta);
    }, 250);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (running && elapsedMs >= totalSeconds * 1000) { setRunning(false); done.current(); } }, [elapsedMs, running, totalSeconds]);
  return {
    running, elapsedSeconds: Math.floor(elapsedMs / 1000),
    remaining: Math.max(0, totalSeconds - Math.floor(elapsedMs / 1000)),
    progress: Math.min(1, elapsedMs / (totalSeconds * 1000)),
    start: () => setRunning(true), pause: () => setRunning(false),
    reset: () => { setRunning(false); setElapsed(0); },
  };
}
