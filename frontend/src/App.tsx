import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import { authApi } from "./services/api";
import Layout from "./components/common/Layout";
import Dashboard from "./pages/Dashboard";
import FocusRoom from "./pages/FocusRoom";
import Analytics from "./pages/Analytics";
import Reflection from "./pages/Reflection";
// Route table: each URL maps to one page. Layout wraps all pages (sidebar + content).
// Guard: no token -> go to /login. Real security is on the server; this only improves the UX.
function RequireAuth() { return authApi.isLoggedIn() ? <Layout /> : <Navigate to="/login" replace />; }

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/focus" element={<FocusRoom />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reflection" element={<Reflection />} />
      </Route>
    </Routes>
  );
}
