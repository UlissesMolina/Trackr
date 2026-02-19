import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

const FEATURES = [
  {
    title: "Kanban Board",
    description:
      "Drag-and-drop your applications through every stage — from saved to offer.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    title: "Real-time Dashboard",
    description:
      "Track response rates, interview conversions, and application volume over time.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "AI Cover Letters",
    description:
      "Generate tailored cover letters in seconds with GPT-4o, linked directly to your applications.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    title: "Notes & Timeline",
    description:
      "Keep detailed notes and see every status change on a timeline for each application.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border-default/50 bg-surface-primary/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-text-primary">Trackr</span>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link
                to="/"
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Open App
              </Link>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="rounded-lg px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-secondary px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-text-secondary">Open Source Job Tracker</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-text-primary sm:text-6xl">
            Track every application.
            <br />
            <span className="text-accent">Land the job.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            A minimal, Linear-inspired job tracker with a kanban board, analytics dashboard, and AI-powered cover letter generation.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to={isSignedIn ? "/" : "/sign-up"}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover"
            >
              {isSignedIn ? "Open Dashboard" : "Start Tracking — Free"}
            </Link>
            <a
              href="https://github.com/UlissesMolina/Trackr"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border-default px-6 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-secondary"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border-default py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">Everything you need</h2>
            <p className="mt-3 text-text-secondary">Simple, focused tools to manage your job search from start to finish.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border-default bg-surface-secondary p-6 transition-colors hover:border-accent/30"
              >
                <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-2.5 text-accent">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-text-primary">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border-default py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Ready to get organized?</h2>
          <p className="mt-3 text-text-secondary">
            Stop losing track of applications in spreadsheets. Start using Trackr today.
          </p>
          <Link
            to={isSignedIn ? "/" : "/sign-up"}
            className="mt-8 inline-flex rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover"
          >
            {isSignedIn ? "Go to Dashboard" : "Get Started for Free"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-default py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs text-text-tertiary">
            Built with React, Express, Prisma &amp; OpenAI.
          </p>
        </div>
      </footer>
    </div>
  );
}
