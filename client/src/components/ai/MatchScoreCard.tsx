import { useResume } from "../../hooks/useResume";
import { useAnalyzeMatch } from "../../hooks/useAI";
import { scoreTone } from "../../lib/match";
import { getApiError } from "../../lib/utils";
import type { Application } from "../../types";

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreRing({ score }: { score: number }) {
  return (
    <div className={`relative h-16 w-16 shrink-0 ${scoreTone(score).text}`}>
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={6} />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-semibold">{score}</span>
    </div>
  );
}

function ChipList({ label, items, chipCls }: { label: string; items: string[]; chipCls: string }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-medium text-text-tertiary">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`rounded-full px-2 py-0.5 text-xs ${chipCls}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

interface MatchScoreCardProps {
  application: Application;
}

export default function MatchScoreCard({ application }: MatchScoreCardProps) {
  const { data: resume } = useResume();
  const analyze = useAnalyzeMatch();
  const analysis = application.matchAnalysis;

  const hasJobDescription = !!application.jobDescription?.trim();
  const hasResume = !!resume?.content?.trim();
  const disabledReason = !hasJobDescription
    ? "Add a job description to this application first."
    : !hasResume
      ? "Save a resume on the Resume page first."
      : null;
  const outdated =
    !!analysis &&
    !!resume &&
    !!application.matchAnalyzedAt &&
    new Date(resume.updatedAt) > new Date(application.matchAnalyzedAt);

  return (
    <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Resume Match</h2>
        {outdated && (
          <span className="rounded-full bg-yellow-500/12 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
            Outdated
          </span>
        )}
      </div>

      {analysis && (
        <>
          <div className="flex items-center gap-4">
            <ScoreRing score={analysis.score} />
            <p className="text-sm text-text-secondary">
              How well your saved resume matches this job description.
            </p>
          </div>
          <ChipList label="Matched" items={analysis.matchedSkills} chipCls="bg-emerald-500/12 text-emerald-400" />
          <ChipList label="Missing" items={analysis.missingKeywords} chipCls="bg-red-500/12 text-red-400" />
          {analysis.suggestions.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-text-tertiary">Suggestions</p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-text-primary">
                {analysis.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className={analysis ? "mt-5" : ""}>
        <button
          onClick={() => analyze.mutate(application.id)}
          disabled={!!disabledReason || analyze.isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {analyze.isPending ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze match"}
        </button>
        {disabledReason && <p className="mt-2 text-xs text-text-tertiary">{disabledReason}</p>}
        {analyze.isError && (
          <p className="mt-2 text-xs text-red-400">
            {getApiError(analyze.error, "Couldn't analyze the match. Try again.")}
          </p>
        )}
      </div>
    </div>
  );
}
