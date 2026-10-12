import { describe, it, expect } from "vitest";
import { parseMatchAnalysis, InvalidMatchAnalysisError } from "./matchAnalysis";

const valid = {
  score: 78,
  matchedSkills: ["TypeScript", "React"],
  missingKeywords: ["Kubernetes"],
  suggestions: ["Mention CI/CD work in the Acme bullet"],
};

describe("parseMatchAnalysis", () => {
  it("accepts a valid analysis", () => {
    expect(parseMatchAnalysis(valid)).toEqual(valid);
  });

  it("rounds and clamps the score to 0-100", () => {
    expect(parseMatchAnalysis({ ...valid, score: 72.4 }).score).toBe(72);
    expect(parseMatchAnalysis({ ...valid, score: 104.6 }).score).toBe(100);
    expect(parseMatchAnalysis({ ...valid, score: -3 }).score).toBe(0);
  });

  it("caps list lengths (15 skills/keywords, 5 suggestions)", () => {
    const many = Array.from({ length: 20 }, (_, i) => `item ${i}`);
    const result = parseMatchAnalysis({ ...valid, matchedSkills: many, missingKeywords: many, suggestions: many });
    expect(result.matchedSkills).toHaveLength(15);
    expect(result.missingKeywords).toHaveLength(15);
    expect(result.suggestions).toHaveLength(5);
  });

  it("trims strings and drops empty ones", () => {
    const result = parseMatchAnalysis({ ...valid, matchedSkills: ["  Go ", "", "   "] });
    expect(result.matchedSkills).toEqual(["Go"]);
  });

  it("defaults missing lists to empty arrays", () => {
    expect(parseMatchAnalysis({ score: 50 })).toEqual({
      score: 50,
      matchedSkills: [],
      missingKeywords: [],
      suggestions: [],
    });
  });

  it("throws InvalidMatchAnalysisError when score is missing or not a number", () => {
    expect(() => parseMatchAnalysis({ ...valid, score: undefined })).toThrow(InvalidMatchAnalysisError);
    expect(() => parseMatchAnalysis({ ...valid, score: "80" })).toThrow(InvalidMatchAnalysisError);
  });

  it("throws InvalidMatchAnalysisError for non-objects", () => {
    expect(() => parseMatchAnalysis(null)).toThrow(InvalidMatchAnalysisError);
    expect(() => parseMatchAnalysis("nope")).toThrow(InvalidMatchAnalysisError);
  });
});
