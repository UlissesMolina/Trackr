import type { Theme } from "../hooks/useTheme";

type CompanyColor = { bg: string; text: string };

/* Same hue order in both palettes so a company keeps its color across themes. */
const DARK_PALETTE: CompanyColor[] = [
  { bg: "rgba(139, 92, 246, 0.12)", text: "#a78bfa" },
  { bg: "rgba(96, 165, 250, 0.12)", text: "#93b5e1" },
  { bg: "rgba(251, 191, 36, 0.12)", text: "#fbbf24" },
  { bg: "rgba(244, 114, 182, 0.12)", text: "#f472b6" },
  { bg: "rgba(74, 222, 128, 0.12)", text: "#6ee7a0" },
  { bg: "rgba(248, 113, 113, 0.12)", text: "#f87171" },
  { bg: "rgba(147, 181, 225, 0.12)", text: "#93b5e1" },
  { bg: "rgba(167, 139, 250, 0.12)", text: "#a78bfa" },
];

const LIGHT_PALETTE: CompanyColor[] = [
  { bg: "#ede9fe", text: "#6d28d9" },
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#fef3c7", text: "#b45309" },
  { bg: "#fce7f3", text: "#be185d" },
  { bg: "#dcfce7", text: "#15803d" },
  { bg: "#fee2e2", text: "#b91c1c" },
  { bg: "#e0f2fe", text: "#0369a1" },
  { bg: "#e0e7ff", text: "#4338ca" },
];

export function getCompanyColor(company: string, theme: Theme): CompanyColor {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = theme === "light" ? LIGHT_PALETTE : DARK_PALETTE;
  return palette[Math.abs(hash) % palette.length];
}
