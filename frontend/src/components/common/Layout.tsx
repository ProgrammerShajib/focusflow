import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
const links = [["/", "Dashboard"], ["/focus", "Focus Room"], ["/analytics", "Analytics"], ["/reflection", "Reflection"]];
// App shell: sidebar on desktop, top bar on mobile. <Outlet/> renders the active page.
export default function Layout() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen md:flex">
      <nav className="md:w-56 md:min-h-screen border-b md:border-b-0 md:border-r border-line bg-white p-4 flex md:flex-col gap-1 overflow-x-auto">
        <div className="font-extrabold text-lg px-3 py-2 md:mb-4 whitespace-nowrap">FocusFlow</div>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end className={({ isActive }) =>
            `rounded-xl px-3 py-2 text-sm font-bold whitespace-nowrap ${isActive ? "bg-calmsoft text-calm" : "text-ink/70 hover:bg-mist"}`}>{label}</NavLink>
        ))}
        <button className="rounded-xl px-3 py-2 text-sm font-bold text-ink/70 hover:bg-mist text-left whitespace-nowrap md:mt-auto" onClick={() => { authApi.logout(); nav("/login"); }}>Log out</button>
        <p className="hidden md:block mt-4 px-3 text-xs text-ink/50 leading-relaxed">Success is learning to return to what matters.</p>
      </nav>
      <main className="flex-1 p-5 md:p-10 max-w-5xl"><Outlet /></main>
    </div>
  );
}
