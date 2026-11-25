import axios from "axios";
import type { Distraction, DistractionKind, Category, Intensity, Reflection, Session } from "../types";
/**
 * Service layer, now talking to the real FastAPI backend with axios.
 * The pages did not change shape: this file translates between the API's
 * snake_case JSON and the camelCase types the UI uses. That is the payoff of the layer.
 */
export const TOKEN_KEY = "ff.token";
export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1" });

// Attach the JWT to every request automatically.
http.interceptors.request.use(cfg => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
// Expired or invalid token -> clear it and go to login.
http.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && !location.pathname.startsWith("/login")) { localStorage.removeItem(TOKEN_KEY); location.href = "/login"; }
  return Promise.reject(err);
});

// SQLite returns times without a timezone; they are UTC, so mark them (otherwise the browser reads them as local time).
const utc = (s?: string | null) => (s && !/[zZ]$|[+-]\d\d:?\d\d$/.test(s) ? s + "Z" : s ?? undefined);

/* eslint-disable @typescript-eslint/no-explicit-any */
const toSession = (s: any): Session => ({ id: String(s.id), taskTitle: s.task_title, category: s.category, plannedMinutes: s.planned_duration,
  focusSeconds: s.focus_seconds, startedAt: utc(s.started_at)!, endedAt: utc(s.ended_at)!, status: s.status });
const toDistraction = (d: any): Distraction => ({ id: String(d.id), sessionId: String(d.session_id), kind: d.category, intensity: d.intensity,
  note: d.note, occurredAt: utc(d.occurred_at)!, returnedAt: utc(d.return_event?.returned_at), recoverySeconds: d.return_event?.recovery_duration_seconds });
const toReflection = (r: any): Reflection => ({ id: String(r.id), date: r.reflection_date, distracted: r.distractions_summary,
  helped: r.successful_strategies, achieved: r.achievements, improve: r.improvements });

export const authApi = {
  register: (email: string, password: string) => http.post("/auth/register", { email, password }),
  login: async (email: string, password: string) => {
    // OAuth2 login expects form data with the fields "username" and "password".
    const r = await http.post("/auth/login", new URLSearchParams({ username: email, password }));
    localStorage.setItem(TOKEN_KEY, r.data.access_token);
  },
  logout: () => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};
export const sessionsApi = {
  // Only finished sessions are listed; an unfinished one has no end time yet.
  list: async (): Promise<Session[]> =>
    (await http.get("/sessions", { params: { limit: 200 } })).data.filter((s: any) => s.ended_at).map(toSession),
  start: async (s: { taskTitle: string; category: Category; plannedMinutes: number }) =>
    toSession((await http.post("/sessions", { task_title: s.taskTitle, category: s.category, planned_duration: s.plannedMinutes })).data),
  finish: async (id: string, focusSeconds: number, completed: boolean) =>
    toSession((await http.post(`/sessions/${id}/finish`, { focus_seconds: focusSeconds, completed })).data),
};
export const distractionsApi = {
  list: async (): Promise<Distraction[]> => (await http.get("/distractions", { params: { limit: 500 } })).data.map(toDistraction),
  create: async (d: { sessionId: string; kind: DistractionKind; intensity: Intensity; note: string }) =>
    toDistraction((await http.post(`/sessions/${d.sessionId}/distractions`, { category: d.kind, intensity: d.intensity, note: d.note })).data),
  // The server computes recovery time itself, so the client just reports "I'm back".
  markReturned: async (id: string) => { await http.post(`/distractions/${id}/return`); },
};
export const reflectionsApi = {
  list: async (): Promise<Reflection[]> => (await http.get("/reflections")).data.map(toReflection),
  create: async (r: Omit<Reflection, "id">) => { await http.post("/reflections", { reflection_date: r.date, distractions_summary: r.distracted,
    successful_strategies: r.helped, achievements: r.achieved, improvements: r.improve }); },
};
