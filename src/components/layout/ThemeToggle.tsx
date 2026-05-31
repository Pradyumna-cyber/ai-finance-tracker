
import { Moon, Sun } from "lucide-react";

import { useThemeStore } from "@/store/themeStore";

export default function ThemeToggle() {
  const { darkMode, toggleTheme } =
    useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="
        rounded-2xl
        border
        border-zinc-200
        bg-white
        p-3
        text-zinc-700
        shadow-sm
        transition-all
        hover:scale-105

        dark:border-white/10
        dark:bg-white/5
        dark:text-white
      "
    >
      {darkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

