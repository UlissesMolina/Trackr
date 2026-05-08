import { useEffect, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "trackr-theme";

function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(theme);
}

/* ── Global store so every useTheme() instance stays in sync ── */
let currentTheme: Theme = getTheme();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return currentTheme;
}

function setThemeGlobal(next: Theme) {
  if (next === currentTheme) return;
  currentTheme = next;
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((cb) => cb());
}

// Apply on module load so there's no flash
applyTheme(currentTheme);

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light" as Theme);

  // Keep DOM class in sync on mount (SSR hydration safety)
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(next: Theme) {
    setThemeGlobal(next);
  }

  function toggleTheme() {
    setThemeGlobal(currentTheme === "dark" ? "light" : "dark");
  }

  return { theme, setTheme, toggleTheme };
}
