import { useRef, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import logo from "../assets/trackr-logo-white.svg";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ScrollReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`scroll-fade-up${visible ? " visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

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
    title: "Interview Scheduling",
    description:
      "Log phone screens, technicals, and onsites with dates, locations, and prep notes.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: "Follow-up Reminders",
    description:
      "Set follow-up dates so you never forget to nudge a recruiter after a week of silence.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Tags & Notes",
    description:
      "Label applications as \"dream job\" or \"referral,\" add notes, and track every status change.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
];

function PipelineDots() {
  const dots = [
    { cx: 50, fill: "#475569", r: 4, delay: "0.9s" },
    { cx: 130, fill: "#64748b", r: 4, delay: "1.05s" },
    { cx: 210, fill: "#94a3b8", r: 4, delay: "1.2s" },
    { cx: 290, fill: "#cbd5e1", r: 4, delay: "1.35s" },
    { cx: 370, fill: "#f8fafc", r: 5, delay: "1.5s" },
  ];

  return (
    <svg className="h-4 w-full" viewBox="0 0 400 16" fill="none" preserveAspectRatio="xMidYMid">
      <line
        x1="0" y1="8" x2="400" y2="8"
        stroke="#334155" strokeWidth="2" strokeLinecap="round"
        strokeDasharray="400" strokeDashoffset="400"
        style={{ animation: "draw-line 0.8s ease-out 0.7s forwards" }}
      />
      {dots.map((d) => (
        <circle
          key={d.cx} cx={d.cx} cy="8" r={d.r} fill={d.fill}
          style={{ opacity: 0, transformOrigin: `${d.cx}px 8px`, animation: `dot-pop 0.4s ease-out ${d.delay} forwards` }}
        />
      ))}
    </svg>
  );
}

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Nav */}
      <header className="animate-slide-down fixed inset-x-0 top-0 z-50 border-b border-[#1e293b]/60 bg-[#0a0a0b]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/landing" className="py-2">
            <img src={logo} alt="Trackr" className="h-9" />
          </Link>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link
                to="/"
                className="rounded-lg bg-[#f8fafc] px-5 py-2 text-sm font-semibold text-[#0f172a] shadow-sm shadow-white/10 hover:bg-[#e2e8f0]"
              >
                Open App
              </Link>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc]"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="rounded-lg bg-[#f8fafc] px-5 py-2 text-sm font-semibold text-[#0f172a] shadow-sm shadow-white/10 hover:bg-[#e2e8f0]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-36 pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#1e293b]/40 blur-[120px]" />
          <div className="absolute top-20 left-1/3 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-[#334155]/20 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[#1e293b] bg-[#0f172a] px-4 py-1.5" style={{ animationDelay: "0.1s" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]" />
            <span className="text-xs font-medium text-[#94a3b8]">Open Source Job Tracker</span>
          </div>

          <h1 className="animate-fade-up text-5xl font-bold leading-tight tracking-tight text-[#f8fafc] sm:text-6xl" style={{ animationDelay: "0.2s" }}>
            Track every application.
            <br />
            <span className="text-[#f8fafc]">Land the job.</span>
          </h1>

          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#94a3b8]" style={{ animationDelay: "0.35s" }}>
            A minimal, Linear-inspired job tracker with a kanban board, analytics dashboard, and AI-powered cover letter generation.
          </p>

          <div className="mx-auto mt-12 max-w-sm">
            <PipelineDots />
          </div>

          <div className="animate-fade-up mt-10 flex items-center justify-center gap-4" style={{ animationDelay: "0.55s" }}>
            <Link
              to={isSignedIn ? "/" : "/sign-up"}
              className="rounded-lg bg-[#f8fafc] px-6 py-2.5 text-sm font-semibold text-[#0f172a] shadow-lg shadow-white/5 hover:bg-[#e2e8f0]"
            >
              {isSignedIn ? "Open Dashboard" : "Start Tracking — Free"}
            </Link>
            <a
              href="https://github.com/UlissesMolina/Trackr"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#1e293b] px-6 py-2.5 text-sm font-semibold text-[#94a3b8] hover:border-[#334155] hover:bg-[#0f172a] hover:text-[#f8fafc]"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[#1e293b] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#f8fafc]">Everything you need</h2>
              <p className="mt-3 text-[#64748b]">Simple, focused tools to manage your job search from start to finish.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div className="glow-card group h-full rounded-xl border border-[#334155]/50 bg-[#0f172a]/60 p-7 transition-all duration-300 hover:border-transparent hover:bg-[#0f172a]">
                  <div className="mb-4 inline-flex rounded-lg bg-[#1e293b] p-2.5 text-[#94a3b8] transition-colors group-hover:text-[#f8fafc]">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[#f8fafc]">{f.title}</h3>
                  <p className="mt-2 text-[0.938rem] leading-relaxed text-[#94a3b8]">{f.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#1e293b] py-24">
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <div className="pointer-events-none absolute inset-0 -top-12 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[200px] w-[500px] -translate-x-1/2 rounded-full bg-[#1e293b]/30 blur-[80px]" />
          </div>
          <ScrollReveal>
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-[#f8fafc]">Ready to get organized?</h2>
              <p className="mt-4 text-lg text-[#94a3b8]">
                <span className="font-semibold text-[#cbd5e1]">Stop losing track of applications in spreadsheets.</span> Start using Trackr today.
              </p>
              <Link
                to={isSignedIn ? "/" : "/sign-up"}
                className="mt-8 inline-flex rounded-lg bg-[#f8fafc] px-8 py-3 text-sm font-semibold text-[#0f172a] shadow-lg shadow-white/5 hover:bg-[#e2e8f0]"
              >
                {isSignedIn ? "Go to Dashboard" : "Get Started for Free"}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] py-8">
        <ScrollReveal>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
            <img src={logo} alt="Trackr" className="h-12 opacity-40" />
            <p className="text-xs text-[#475569]">
              Built with React, Express, Prisma &amp; OpenAI.
            </p>
          </div>
        </ScrollReveal>
      </footer>
    </div>
  );
}
