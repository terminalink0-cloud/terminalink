import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { useAuth } from "../auth/AuthContext";

type Role = "ADMIN" | "DISPATCHER" | "DRIVER";

type SidebarLink = {
  name: string;
  path: string;
  roles: Role[];
};

const links: SidebarLink[] = [
  // ======================
  // ADMIN
  // ======================
  { name: "Dashboard", path: "/", roles: ["ADMIN"] },
  { name: "Trips", path: "/trips", roles: ["ADMIN"] },
  { name: "Drivers", path: "/drivers", roles: ["ADMIN"] },
  { name: "Vehicles", path: "/vehicles", roles: ["ADMIN"] },
  { name: "Dispatchers", path: "/dispatchers", roles: ["ADMIN"] },
  { name: "Reports", path: "/reports", roles: ["ADMIN"] },

  // ======================
  // DISPATCHER
  // ======================
  { name: "Dispatcher Console", path: "/dispatcher", roles: ["DISPATCHER"] },

  // ======================
  // DRIVER (future)
  // ======================
  { name: "Driver Dashboard", path: "/driver", roles: ["DRIVER"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // BUG FIX: the previous logic was `user?.role as Role ?? "ADMIN"`, which
  // silently granted ADMIN-level navigation to anyone with a missing or
  // unrecognized role (e.g. a user object that hasn't loaded yet). Instead,
  // treat an unknown role as "no role" and show no privileged links.
  const role = user?.role as Role | undefined;
  const visibleLinks = role
    ? links.filter((link) => link.roles.includes(role))
    : [];

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on Escape, and lock background scroll while the drawer is open.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Terminalink
        </h1>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col border-r bg-white p-6",
          "transition-transform duration-200 ease-in-out",
          "dark:border-slate-800 dark:bg-slate-900",
          "lg:static lg:h-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Terminalink
          </h1>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-8 shrink-0 text-sm text-gray-500 dark:text-slate-400">
          {role ?? "No role assigned"}
        </p>

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-6">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                [
                  "block rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800",
                ].join(" ")
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
