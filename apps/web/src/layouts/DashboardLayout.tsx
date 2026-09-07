// apps/web/src/layouts/DashboardLayout.tsx

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings2,
  Handshake,
  FileText,
  LogOut,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const menu = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Admin Fleet",
      path: "/admin/fleet",
      icon: Settings2,
    },
    {
      label: "Dispatchers",
      path: "/dispatchers",
      icon: Users,
    },
    {
      label: "Cooperatives",
      path: "/cooperatives",
      icon: Handshake,
    },
    {
      label: "Reports",
      path: "/reports",
      icon: FileText,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-950">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Logo */}
        <div className="border-b p-6 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terminalink</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Transport Admin</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  ].join(" ")
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Theme Toggle + Logout */}
        <div className="space-y-1 border-t p-4 dark:border-slate-800">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
            Terminalink Dashboard
          </h2>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            Admin Panel
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}