import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
// Login and register share one form; `mode` switches between them.
export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "register") await authApi.register(email, password);
      await authApi.login(email, password);   // registering also logs you in
      nav("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(!err.response ? "Cannot reach the server. Is the backend running?"
        : typeof detail === "string" ? detail : "Enter a valid email and a password of at least 8 characters.");
    } finally { setBusy(false); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-extrabold">{mode === "login" ? "Log in" : "Create account"}</h1>
        <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password (8+ characters)" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full disabled:opacity-40" disabled={busy}>{mode === "login" ? "Log in" : "Create account"}</button>
        <button type="button" className="text-sm text-calm font-bold" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}</button>
      </form>
    </div>
  );
}
