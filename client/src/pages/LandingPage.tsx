import { useRef, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Search, LayoutGrid, Target } from "lucide-react";
import logo from "../assets/trackr-logo-white.svg";
import dashboardScreenshot from "../assets/trackr-dashbaord.png";
import boardScreenshot from "../assets/trackrBoard.png";
import coverLetterScreenshot from "../assets/coverLetterGen.png";
import jobFinderScreenshot from "../assets/jobFinder.png";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
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
      "Your entire job search, on one board. No more digging through emails to remember where you stand.",
    align: "left" as const,
    image: boardScreenshot,
  },
  {
    title: "AI Cover Letters",
    description:
      "Paste the job description. Get a cover letter. Edit it, link it to the application, done. Takes 30 seconds.",
    align: "right" as const,
    image: coverLetterScreenshot,
  },
  {
    title: "Job Finder",
    description:
      "2,800+ internships pulled from a live database. Filter by role, US only, posted today. Add to your board without leaving the page.",
    align: "left" as const,
    image: jobFinderScreenshot,
  },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0a0a0b]">
      {/* Nav */}
      <header className="animate-slide-down fixed inset-x-0 top-0 z-50 border-b border-[#1e293b]/60 bg-[#0a0a0b]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link to="/" className="py-2">
            <img src={logo} alt="Trackr" className="h-8 sm:h-9" />
          </Link>
          <Link
            to={isSignedIn ? "/dashboard" : "/sign-up"}
            className="rounded-lg bg-[#10b981] px-4 py-2 text-sm font-semibold text-white hover:bg-[#34d399] transition-colors sm:px-5"
          >
            Open App
          </Link>
        </div>
      </header>

      {/* Hero — pure black, radial green glow behind headline */}
      <section className="relative overflow-hidden bg-black pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-100" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(16, 185, 129, 0.15), transparent 70%)" }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h1 className="animate-fade-up text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl" style={{ animationDelay: "0.1s" }}>
            Stop losing track.
            <br />
            <span className="text-white">Start landing jobs.</span>
          </h1>

          <p className="animate-fade-up mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#94a3b8] sm:mt-6 sm:text-lg" style={{ animationDelay: "0.2s" }}>
            Trackr keeps every application organized — so you can apply more, stress less, and actually follow up.
          </p>

          <div className="animate-fade-up mt-8 sm:mt-10" style={{ animationDelay: "0.35s" }}>
            <Link
              to={isSignedIn ? "/dashboard" : "/sign-up"}
              className="inline-flex w-full max-w-xs justify-center rounded-lg bg-[#10b981] px-8 py-3 text-sm font-semibold text-white hover:bg-[#34d399] transition-colors shadow-lg shadow-[#10b981]/20 sm:w-auto"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        {/* Full-width app screenshot — lifted off background */}
        <div className="relative mx-auto mt-10 w-full max-w-6xl px-4 sm:mt-12 sm:px-6">
          <div className="animate-fade-up hero-screenshot-animate overflow-hidden rounded-2xl border-2 border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)]" style={{ animationDelay: "0.45s" }}>
            <img
              src={dashboardScreenshot}
              alt="Trackr dashboard"
              className="h-auto w-full max-w-full object-cover object-top"
              style={{ maxHeight: "min(42vh, 380px)" }}
            />
          </div>
        </div>

        {/* Social Proof Bar — under hero only */}
        <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-center gap-3 px-4 pb-8 text-sm text-[#94a3b8] sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2 sm:px-6">
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            2,800+ internships indexed
          </span>
          <span className="hidden text-[#475569] sm:inline">·</span>
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI cover letters in seconds
          </span>
          <span className="hidden text-[#475569] sm:inline">·</span>
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Real-time analytics
          </span>
        </div>
      </section>

      {/* How it works — slightly lighter bg, numbered steps */}
      <section className="border-t border-[#1e293b] bg-[#0d0d0f] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-4xl">Simple by design</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#94a3b8] sm:text-base">Three steps. No fluff.</p>
          </ScrollReveal>
          <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
            {[
              { num: "01", title: "Find it", desc: "Browse 2,800+ Summer 2026 internships and add them to your board in one click.", Icon: Search },
              { num: "02", title: "Track it", desc: "Move applications through stages as things progress. Applied, interviewing, ghosted — it's all there.", Icon: LayoutGrid },
              { num: "03", title: "Land it", desc: "Use AI cover letters, follow-up reminders, and analytics to stay ahead of everyone else.", Icon: Target },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 80}>
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl font-bold tabular-nums tracking-tight text-[#10b981] sm:text-5xl">{item.num}</span>
                  <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-[#131316]">
                    <item.Icon className="h-7 w-7 text-[#34d399]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white sm:text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features — browser frame, green accent on text */}
      <section className="bg-black py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100}>
              <div
                className={`mb-20 flex flex-col gap-8 last:mb-0 sm:mb-24 sm:gap-10 md:flex-row md:items-center md:gap-16 ${
                  f.align === "right" ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="min-w-0 flex-1 md:flex-[5]">
                  <div className="overflow-hidden rounded-xl border border-[#1e293b] bg-[#0d0d0f] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] sm:rounded-2xl">
                    <div className="flex items-center gap-2 border-b border-[#1e293b] bg-[#131316] px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-[#3f3f46]" />
                        <div className="h-3 w-3 rounded-full bg-[#3f3f46]" />
                        <div className="h-3 w-3 rounded-full bg-[#3f3f46]" />
                      </div>
                      <div className="ml-2 flex-1 rounded-md bg-[#1e1e24] px-3 py-1.5 text-xs text-[#71717a]">trackr.app/dashboard</div>
                    </div>
                    <img src={f.image} alt="" className="w-full max-w-full" />
                  </div>
                </div>
                <div className="relative min-w-0 flex-1 border-l-4 border-[#10b981] pl-6 md:flex-[2] md:pl-8">
                  <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{f.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-[#94a3b8] sm:mt-4 sm:text-lg">{f.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Built for students who — lighter cards, bigger checks, hover */}
      <section className="border-t border-[#1e293b] bg-[#0d0d0f] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-4xl">Built for students who</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#94a3b8]">Sound familiar?</p>
          </ScrollReveal>
          <div className="mx-auto mt-12 max-w-2xl space-y-4">
            {[
              "Apply to a lot of jobs and lose track fast",
              "Hate writing cover letters from scratch every time",
              "Know they should follow up but always forget",
              "Are tired of managing a job search in a spreadsheet",
            ].map((pain, i) => (
              <ScrollReveal key={pain} delay={i * 60}>
                <div className="flex items-center gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#10b981] bg-[#18181c] px-5 py-4 transition-colors hover:bg-[#1e1e24] sm:px-6 sm:py-5">
                  <svg className="h-6 w-6 shrink-0 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#e2e8f0] sm:text-base">{pain}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — card, features list, big Free, green tint bg */}
      <section className="border-t border-[#1e293b] py-20 sm:py-24" style={{ background: "rgba(16, 185, 129, 0.03)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="mx-auto max-w-lg rounded-2xl border-2 border-[#10b981]/40 bg-[#0a0a0b] p-8 shadow-xl shadow-[#10b981]/5 sm:p-10">
              <p className="text-center text-5xl font-bold tracking-tight text-[#10b981] sm:text-6xl">Free</p>
              <p className="mt-2 text-center text-lg font-semibold text-white">Genuinely.</p>
              <p className="mt-4 text-center text-sm text-[#94a3b8]">No trial, no credit card, no premium tier. Just sign in and start tracking.</p>
              <ul className="mx-auto mt-6 max-w-xs space-y-2 text-sm text-[#94a3b8] sm:mt-8">
                {["Kanban board", "AI cover letters", "Job Finder (2,800+ internships)", "Analytics & flow diagram", "CSV import", "Follow-up reminders"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ — more spacing, green left border on items */}
      <section className="border-t border-[#1e293b] bg-black py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-4xl">Frequently asked questions</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#94a3b8]">Quick answers.</p>
          </ScrollReveal>
          <div className="mx-auto mt-12 max-w-2xl space-y-5">
            {[
              { q: "Is it actually free?", a: "Yes. All of it. No catch." },
              { q: "Do you store my resume?", a: "Only if you save it. We use it to autofill cover letters — that's it." },
              { q: "What's the AI cover letter thing?", a: "You paste a job description, we generate a personalized letter using GPT-4o. You can edit it before sending. It takes about 30 seconds." },
              { q: "Can I bring in jobs I already applied to?", a: "Yes — import a CSV or add them manually. Takes two minutes." },
            ].map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 60}>
                <div className="rounded-xl border border-white/10 border-l-4 border-l-[#10b981]/60 bg-[#131316] p-5 sm:p-6">
                  <h3 className="font-semibold text-white sm:text-lg">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#94a3b8] sm:text-base">{faq.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-[#1e293b] bg-[#0d0d0f] py-20 sm:py-28">
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="pointer-events-none absolute left-1/2 -top-24 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-[#10b981]/10 blur-[160px]" />
          <ScrollReveal>
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">Your next offer starts here.</h2>
              <Link
                to={isSignedIn ? "/dashboard" : "/sign-up"}
                className="mt-6 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-[#10b981] px-8 py-3 text-sm font-semibold text-white hover:bg-[#34d399] transition-colors shadow-lg shadow-[#10b981]/20 sm:mt-8 sm:w-auto"
              >
                Open Dashboard
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] py-6 sm:py-8">
        <ScrollReveal>
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between sm:px-6">
            <img src={logo} alt="Trackr" className="h-8 opacity-40 sm:h-10 md:h-12" />
          </div>
        </ScrollReveal>
      </footer>
    </div>
  );
}
