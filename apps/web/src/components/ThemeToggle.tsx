// apps/web/src/components/ThemeToggle.tsx

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-4
        py-3
        text-sm
        font-medium
        text-gray-600
        transition-colors
        hover:bg-gray-100
        dark:text-slate-300
        dark:hover:bg-slate-800
      "
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}