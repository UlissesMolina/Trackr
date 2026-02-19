import { useState, useEffect, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { useApplications } from "../hooks/useApplications";
import { useResume } from "../hooks/useResume";

interface GenerateResponse {
  coverLetter: string;
}

const INPUT =
  "w-full rounded-lg border border-border-default bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export default function CoverLetterPage() {
  const { data: applications = [] } = useApplications();
  const { data: resume } = useResume();
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [result, setResult] = useState("");
  const [useSavedResume, setUseSavedResume] = useState(true);

  useEffect(() => {
    if (resume?.content && useSavedResume) {
      setResumeText(resume.content);
    }
  }, [resume, useSavedResume]);

  const mutation = useMutation({
    mutationFn: async () => {
      const selectedApp = applications.find((a) => a.id === applicationId);
      const { data } = await api.post<GenerateResponse>("/ai/cover-letter", {
        jobDescription,
        resumeText,
        jobTitle: selectedApp?.title,
        company: selectedApp?.company,
        applicationId: applicationId || undefined,
      });
      return data;
    },
    onSuccess: (data) => setResult(data.coverLetter),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!jobDescription.trim() || !resumeText.trim()) return;
    mutation.mutate();
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
  }

  function toggleResumeSource() {
    if (useSavedResume) {
      setUseSavedResume(false);
      setResumeText("");
    } else {
      setUseSavedResume(true);
      if (resume?.content) setResumeText(resume.content);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">AI Cover Letter Generator</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Link to Application (optional)</label>
            <select value={applicationId} onChange={(e) => setApplicationId(e.target.value)} className={INPUT}>
              <option value="">None — standalone generation</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>{app.title} at {app.company}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-tertiary">If linked, the cover letter will be saved to that application.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Job Description *</label>
            <textarea required value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." rows={8} className={INPUT} />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-text-secondary">Your Resume / Experience *</label>
              {resume?.content && (
                <button
                  type="button"
                  onClick={toggleResumeSource}
                  className="text-xs font-medium text-accent hover:text-accent-hover"
                >
                  {useSavedResume ? "Enter manually instead" : "Use saved resume"}
                </button>
              )}
            </div>

            {useSavedResume && resume?.content ? (
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-text-primary">Using your saved resume</span>
                </div>
                <p className="mt-1 text-xs text-text-tertiary">
                  {resume.content.length.toLocaleString()} characters
                  {resume.fileName ? ` — ${resume.fileName}` : ""}
                  {" · "}
                  <Link to="/resume" className="text-accent hover:underline">Edit</Link>
                </p>
              </div>
            ) : (
              <>
                <textarea
                  required
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text or a summary of your experience..."
                  rows={8}
                  className={INPUT}
                />
                {!resume?.content && (
                  <p className="mt-1 text-xs text-text-tertiary">
                    Tip: <Link to="/resume" className="text-accent hover:underline">Save your resume</Link> to auto-fill this field every time.
                  </p>
                )}
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !jobDescription.trim() || !resumeText.trim()}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {mutation.isPending ? "Generating..." : "Generate Cover Letter"}
          </button>

          {mutation.isError && (
            <p className="text-sm text-red-400">Failed to generate. Make sure your OpenAI API key is set in the server .env.</p>
          )}
        </form>

        <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Generated Cover Letter</h2>
            {result && (
              <button onClick={handleCopy} className="rounded-lg border border-border-default px-3 py-1 text-xs font-medium text-text-secondary hover:bg-surface-elevated">
                Copy
              </button>
            )}
          </div>

          {mutation.isPending ? (
            <div className="space-y-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface-elevated" />
              <div className="h-4 w-full animate-pulse rounded bg-surface-elevated" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-surface-elevated" />
              <div className="h-4 w-full animate-pulse rounded bg-surface-elevated" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface-elevated" />
            </div>
          ) : result ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{result}</p>
          ) : (
            <p className="text-sm text-text-tertiary">Your generated cover letter will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
