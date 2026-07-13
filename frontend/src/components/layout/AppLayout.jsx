import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/leads", label: "Leads" },
  { to: "/followups", label: "Follow-ups" },
  { to: "/projects", label: "Projects" },
  { to: "/clients", label: "Clients" },
  { to: "/bookings", label: "Bookings" },
  { to: "/agents", label: "Agents", agencyOnly: true },
];

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const visibleNavItems = navItems.filter((item) => !item.agencyOnly || user?.role === "agency");

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-60 bg-navy-900 flex flex-col shrink-0">
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/10">
          <span className="font-display text-lg text-white tracking-wide">Estately</span>
          <NotificationBell />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-sm text-white font-medium truncate">{user?.name}</p>
          <p className="text-xs text-gold-300 uppercase tracking-wide mb-3">{user?.role}</p>
          <button
            onClick={logout}
            className="text-xs text-white/60 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
};

export default AppLayout;