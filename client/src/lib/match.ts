/** Tailwind classes for a 0-100 match score: green ≥ 75, amber 50-74, red < 50. */
export function scoreTone(score: number): { text: string; bg: string } {
  if (score >= 75) return { text: "text-emerald-400", bg: "bg-emerald-500/15" };
  if (score >= 50) return { text: "text-amber-400", bg: "bg-amber-500/15" };
  return { text: "text-red-400", bg: "bg-red-500/15" };
}
