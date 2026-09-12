// apps/web/src/layouts/DispatcherLayout.tsx

import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Menu, X } from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const dispatcherLinks = [
  {
    name: "Dashboard",
    path: "/dispatcher",
    end: true,
  },
];

function SidebarLink({
  name,
  path,
  end,
}: {
  name: string;
  path: string;
  end: boolean;
}) {
  return (
    <NavLink
      to={path}
      end={end}
      className={({ isActive }) =>
        [
          "block",
          "rounded-lg",
          "px-4",
          "py-3",
          "text-sm",
          "font-medium",
          "transition-colors",
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800",
        ].join(" ")
      }
    >
      {name}
    </NavLink>
  );
}

export default function DispatcherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

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

      {/* MOBILE TOP BAR */}
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          bg-white
          px-4
          py-3
          dark:border-slate-800
          dark:bg-slate-900
          lg:hidden
        "
      >
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Terminalink
        </h1>

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="
            rounded-lg
            p-2
            text-gray-600
            hover:bg-gray-100
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex min-h-screen">

        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col",
            "border-r bg-white transition-transform duration-200 ease-in-out",
            "dark:border-slate-800 dark:bg-slate-900",
            "lg:static lg:h-auto lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >

          {/* HEADER */}

          <div
            className="
              flex
              shrink-0
              items-center
              justify-between
              border-b
              px-6
              py-5
              dark:border-slate-800
            "
          >
            <div>
              <h1
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                Terminalink
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                  dark:text-slate-400
                "
              >
                Dispatcher
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="
                rounded-lg
                p-2
                text-gray-500
                hover:bg-gray-100
                dark:text-slate-400
                dark:hover:bg-slate-800
                lg:hidden
              "
            >
              <X size={20} />
            </button>
          </div>


          {/* NAVIGATION */}

          <nav
            className="
              min-h-0
              flex-1
              space-y-1
              overflow-y-auto
              p-4
            "
          >
            {dispatcherLinks.map((link) => (
              <SidebarLink
                key={link.path}
                name={link.name}
                path={link.path}
                end={link.end}
              />
            ))}
          </nav>


          {/* THEME TOGGLE + LOGOUT */}

          <div
            className="
              shrink-0
              space-y-1
              border-t
              px-4
              pt-4
              dark:border-slate-800
            "
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <ThemeToggle />

            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full
                rounded-lg
                border
                border-red-200
                bg-white
                px-4
                py-3
                text-left
                text-sm
                font-medium
                text-red-600
                transition-colors
                hover:bg-red-50
                dark:border-red-900/50
                dark:bg-slate-900
                dark:hover:bg-red-950/30
              "
            >
              Logout
            </button>
          </div>

        </aside>


        {/* CONTENT */}

        <main
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className="
              min-h-screen
              p-4
              md:p-6
            "
          >
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
