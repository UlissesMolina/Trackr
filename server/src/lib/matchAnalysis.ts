import { z } from "zod";

const stringList = (max: number) =>
  z
    .array(z.string())
    .default([])
    .transform((items) => items.map((s) => s.trim()).filter(Boolean).slice(0, max));

const matchAnalysisSchema = z.object({
  score: z.number().finite().transform((n) => Math.min(100, Math.max(0, Math.round(n)))),
  matchedSkills: stringList(15),
  missingKeywords: stringList(15),
  suggestions: stringList(5),
});

export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;

export class InvalidMatchAnalysisError extends Error {
  constructor() {
    super("AI returned an invalid analysis");
    this.name = "InvalidMatchAnalysisError";
  }
}

/** Validate and normalize the model's JSON output for a resume/job match. */
export function parseMatchAnalysis(raw: unknown): MatchAnalysis {
  const result = matchAnalysisSchema.safeParse(raw);
  if (!result.success) throw new InvalidMatchAnalysisError();
  return result.data;
}
