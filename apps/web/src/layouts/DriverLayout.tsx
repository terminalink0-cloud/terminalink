// apps/web/src/layouts/DriverLayout.tsx

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const links = [
  {
    name: "Dashboard",
    path: "/driver",
    end: true,
  },
  {
    name: "My Trips",
    path: "/driver/trips",
    end: false,
  },
];

export default function DriverLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="
      min-h-screen
      bg-gray-100
      dark:bg-slate-950
    ">
      <div className="
        flex
        min-h-screen
      ">

        <aside className="
          flex
          w-64
          shrink-0
          flex-col
          border-r
          bg-white
          dark:border-slate-800
          dark:bg-slate-900
        ">

          <div className="
            border-b
            px-6
            py-5
            dark:border-slate-800
          ">
            <h1 className="
              text-2xl
              font-bold
              text-gray-900
              dark:text-white
            ">
              Terminalink
            </h1>

            <p className="
              mt-1
              text-sm
              text-gray-500
              dark:text-slate-400
            ">
              Driver
            </p>
          </div>


          <nav className="
            flex-1
            space-y-1
            p-4
          ">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
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
                {link.name}
              </NavLink>
            ))}
          </nav>


          <div className="
            space-y-1
            border-t
            p-4
            dark:border-slate-800
          ">
            <ThemeToggle />

            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full
                rounded-lg
                border
                border-red-200
                px-4
                py-3
                text-left
                text-sm
                font-medium
                text-red-600
                hover:bg-red-50
                dark:border-red-900/50
                dark:hover:bg-red-950/30
              "
            >
              Logout
            </button>
          </div>

        </aside>


        <main className="
          min-w-0
          flex-1
        ">
          <div className="
            min-h-screen
            p-4
            md:p-6
          ">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}