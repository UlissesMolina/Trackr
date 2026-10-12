const STALE_DAYS_KEY = "trackr.staleDays";
export const DEFAULT_STALE_DAYS = 21;

export function clampStaleDays(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_STALE_DAYS;
  return Math.min(365, Math.max(1, Math.round(n)));
}

export function getStaleDays(): number {
  try {
    const raw = localStorage.getItem(STALE_DAYS_KEY);
    return raw === null ? DEFAULT_STALE_DAYS : clampStaleDays(Number(raw));
  } catch {
    return DEFAULT_STALE_DAYS;
  }
}

export function setStaleDays(n: number): number {
  const value = clampStaleDays(n);
  try {
    localStorage.setItem(STALE_DAYS_KEY, String(value));
  } catch {
    // Storage blocked (private mode etc.) — the setting just won't persist.
  }
  return value;
}
