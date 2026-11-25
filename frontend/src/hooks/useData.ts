import { useCallback, useEffect, useState } from "react";
import { distractionsApi, sessionsApi } from "../services/api";
import type { Distraction, Session } from "../types";
// Loads sessions + distractions once; call reload() after a change.
export function useData() {
  const [sessions, setS] = useState<Session[]>([]);
  const [distractions, setD] = useState<Distraction[]>([]);
  const reload = useCallback(async () => { setS(await sessionsApi.list()); setD(await distractionsApi.list()); }, []);
  useEffect(() => { reload(); }, [reload]);
  return { sessions, distractions, reload };
}
