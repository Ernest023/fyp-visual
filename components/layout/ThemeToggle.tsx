"use client";

import { useSyncExternalStore } from "react";

type ColourTheme = "light" | "dark";

function currentTheme(): ColourTheme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export default function ThemeToggle() {
  const colourTheme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("signal-studio-theme-change", onStoreChange);
      return () => window.removeEventListener("signal-studio-theme-change", onStoreChange);
    },
    currentTheme,
    () => "dark",
  );

  function toggleTheme() {
    const nextTheme: ColourTheme = colourTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem("signal-studio-theme-v2", nextTheme);
    window.dispatchEvent(new Event("signal-studio-theme-change"));
  }

  const nextTheme = colourTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span aria-hidden="true">{colourTheme === "dark" ? "☀" : "☾"}</span>
      <span className="theme-toggle-label">{nextTheme === "light" ? "Light" : "Dark"}</span>
    </button>
  );
}
