// Domain types. They mirror the database tables in the SRS,
// so later the FastAPI/Pydantic schemas will match these 1:1.
export type Category = "Coding" | "English" | "Reading" | "Study" | "Other";
export type DistractionKind = "News & social media" | "Imaginary conversations" | "Future thoughts" | "Past memories" | "Random thoughts" | "Other";
export type Intensity = "Easy" | "Medium" | "Hard";

export interface Session {
  id: string; taskTitle: string; category: Category;
  plannedMinutes: number; focusSeconds: number;   // actual focused time
  startedAt: string; endedAt: string;             // ISO timestamps
  status: "completed" | "ended-early";
}
export interface Distraction {
  id: string; sessionId: string; kind: DistractionKind; intensity: Intensity;
  note: string; occurredAt: string;
  returnedAt?: string; recoverySeconds?: number;  // the "return event" (1 distraction : 1 return)
}
export interface Reflection {
  id: string; date: string; distracted: string; helped: string; achieved: string; improve: string;
}
