import { useEffect, useState } from "react";
import { reflectionsApi } from "../services/api";
import type { Reflection as R } from "../types";
const QUESTIONS: [keyof Omit<R, "id" | "date">, string][] = [
  ["distracted", "What distracted me today?"], ["helped", "What helped me return?"],
  ["achieved", "What did I accomplish?"], ["improve", "What will I improve tomorrow?"]];
// FR-07: four-question daily journal, newest entries listed below the form.
export default function Reflection() {
  const blank = { distracted: "", helped: "", achieved: "", improve: "" };
  const [form, setForm] = useState(blank); const [items, setItems] = useState<R[]>([]);
  const load = async () => setItems(await reflectionsApi.list());
  useEffect(() => { load(); }, []);
  async function save() { await reflectionsApi.create({ ...form, date: new Date().toLocaleDateString("en-CA") }); setForm(blank); load(); }
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-extrabold">Daily reflection</h1>
      <div className="card space-y-4">
        {QUESTIONS.map(([k, q]) => (<label key={k} className="block text-sm font-bold">{q}
          <textarea className="input mt-1 font-normal" rows={2} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></label>))}
        <button className="btn-primary" onClick={save} disabled={!Object.values(form).some(Boolean)}>Save reflection</button>
      </div>
      {items.map(r => (<div key={r.id} className="card text-sm space-y-1"><div className="font-extrabold">{r.date}</div>
        {QUESTIONS.map(([k, q]) => r[k] && <p key={k}><b>{q}</b> {r[k]}</p>)}</div>))}
    </div>
  );
}
