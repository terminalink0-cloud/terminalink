// apps/web/src/layouts/DashboardLayout.tsx

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings2,
  Handshake,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close on Escape, and lock background scroll while the drawer is open.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = sidebarOpen ? "hidden" : "";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r bg-white",
          "transition-transform duration-200 ease-in-out",
          "dark:border-slate-800 dark:bg-slate-900",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b p-6 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terminalink</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Transport Admin</p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
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
      <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 sm:text-lg">
              Terminalink Dashboard
            </h2>
          </div>

          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 sm:text-sm">
            Admin Panel
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
