
import { NavLink } from "react-router-dom";

const links = [
  {
    name: "Dispatcher Console",
    path: "/dispatcher",
  },
  {
    name: "Trips",
    path: "/trips",
  },
  {
    name: "Vehicles",
    path: "/vehicles",
  },
];

export default function DispatcherSidebar() {
  return (
    <aside
      className="
        w-64
        min-h-screen
        shrink-0
        border-r
        bg-white
        p-6
      "
    >
      <h1
        className="
          mb-8
          text-2xl
          font-bold
          text-gray-900
        "
      >
        Terminalink
      </h1>

      <nav
        className="
          space-y-2
        "
      >
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/dispatcher"}
            className={({ isActive }) =>
              [
                "block",
                "rounded-lg",
                "px-4",
                "py-3",
                "font-medium",
                "transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100",
              ].join(" ")
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
