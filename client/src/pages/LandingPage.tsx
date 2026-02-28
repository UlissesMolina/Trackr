import { useRef, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { motion, useInView, animate } from "framer-motion";
import logo from "../assets/trackr-logo-white.svg";
import noiseTexture from "../assets/noise.svg?url";
import dashboardScreenshot from "../assets/trackr-dashbaord.png";
import boardScreenshot from "../assets/trackrBoard.png";
import coverLetterScreenshot from "../assets/coverLetterGen.png";
import jobFinderScreenshot from "../assets/jobFinder.png";

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const },
  viewport: { once: true },
};

function FadeUp({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={fadeUp.initial}
      whileInView={fadeUp.whileInView}
      viewport={fadeUp.viewport}
      transition={{ ...fadeUp.transition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ value, pad = 0 }: { value: number; pad?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const ctrl = animate(0, value, { duration: 0.8, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => ctrl.stop();
  }, [isInView, value]);

  const formatted = pad ? String(display).padStart(pad, "0") : String(display);
  return <motion.span ref={ref}>{formatted}</motion.span>;
}

const TYPING_WORDS = ["jobs.", "offers.", "interviews."];

function HeroHeadline() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % TYPING_WORDS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <h1 className="text-center font-black leading-[1.1] tracking-tight text-white" style={{ fontSize: "clamp(2.5rem, 8vw, 80px)" }}>
      <span className="block">
        {["Stop", "losing", "track."].map((word, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }} className="inline">
            {word}{" "}
          </motion.span>
        ))}
      </span>
      <span className="block">
        {["Start", "landing"].map((word, i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: (3 + i) * 0.08, ease: "easeOut" }} className="inline">
            {word}{" "}
          </motion.span>
        ))}
        <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }} className="inline-flex items-baseline">
          <span>{TYPING_WORDS[wordIndex]}</span>
          <span className="typing-cursor ml-0.5 inline-block h-[0.85em] w-[2px] shrink-0 bg-[#0ead81] align-middle" />
        </motion.span>
      </span>
    </h1>
  );
}

const FAQ_ITEMS = [
  { q: "Is it actually free?", a: "Yes. All of it. No catch." },
  { q: "Do you store my resume?", a: "Only if you save it. We use it to autofill cover letters — that's it." },
  { q: "What's the AI cover letter thing?", a: "You paste a job description, we generate a personalized letter using GPT-4o. You can edit it before sending. It takes about 30 seconds." },
  { q: "Can I bring in jobs I already applied to?", a: "Yes — import a CSV or add them manually. Takes two minutes." },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <motion.div className="mx-auto mt-12 max-w-2xl space-y-3" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}>
      {FAQ_ITEMS.map((faq, i) => (
        <motion.div
          key={faq.q}
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
          className="overflow-hidden rounded-xl border border-white/10 border-l-4 border-l-[#0ead81]/60 bg-[#131316]"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between p-5 text-left sm:p-6"
          >
            <h3 className="font-semibold text-white sm:text-lg">{faq.q}</h3>
            <motion.span animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0 text-[#0ead81]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </motion.span>
          </button>
          <motion.div
            initial={false}
            animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="border-t border-white/5 px-5 pb-5 pt-0 text-base font-normal leading-relaxed text-[#9ca3af] sm:px-6 sm:pb-6">{faq.a}</p>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}

const FEATURES = [
  {
    label: "01 — TRACKING",
    title: "Kanban Board",
    description:
      "Your entire job search, on one board. No more digging through emails to remember where you stand.",
    align: "left" as const,
    image: boardScreenshot,
    bg: "#080808",
  },
  {
    label: "02 — COVER LETTERS",
    title: "AI Cover Letters",
    description:
      "Paste the job description. Get a cover letter. Edit it, link it to the application, done. Takes 30 seconds.",
    align: "right" as const,
    image: coverLetterScreenshot,
    bg: "#0d0d0d",
  },
  {
    label: "03 — JOB FINDER",
    title: "Job Finder",
    description:
      "2,800+ internships pulled from a live database. Filter by role, US only, posted today. Add to your board without leaving the page.",
    align: "left" as const,
    image: jobFinderScreenshot,
    bg: "#080808",
  },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#080808]">
      {/* Noise texture overlay — organic depth, 4% opacity */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: `url(${noiseTexture})`, backgroundRepeat: "repeat" }}
        aria-hidden
      />

      {/* Nav — logo, Features, Jobs, How it Works, Open App */}
      <header className="animate-slide-down fixed inset-x-0 top-0 z-50 border-b border-[#1e293b]/60 bg-[#080808]/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link to="/" className="py-2">
            <img src={logo} alt="Trackr" className="h-8 sm:h-9" />
          </Link>
          <div className="flex items-center gap-6 sm:gap-8">
            <a href="#features" className="text-sm font-medium text-[#94a3b8] hover:text-white transition-colors">Features</a>
            <a href="#jobs" className="text-sm font-medium text-[#94a3b8] hover:text-white transition-colors">Jobs</a>
            <a href="#how-it-works" className="text-sm font-medium text-[#94a3b8] hover:text-white transition-colors">How it Works</a>
            <Link
              to={isSignedIn ? "/dashboard" : "/sign-up"}
              className="rounded-lg bg-[#0ead81] px-4 py-2 text-sm font-semibold text-white hover:bg-[#10c98c] transition-colors sm:px-5"
            >
              Open App →
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero — #080808 with radial green glow, typing effect */}
      <section className="relative overflow-hidden bg-[#080808] pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-100" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(14, 173, 129, 0.08), transparent 70%)" }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <HeroHeadline />

          <FadeUp delay={0.15}>
            <p className="mx-auto mt-4 max-w-2xl text-base font-normal leading-relaxed text-[#9ca3af] sm:mt-6 sm:text-lg">
              Trackr keeps every application organized — so you can apply more, stress less, and actually follow up.
            </p>
          </FadeUp>

          <FadeUp delay={0.25}>
            <div className="mt-8 sm:mt-10">
            <Link
              to={isSignedIn ? "/dashboard" : "/sign-up"}
              className="inline-flex w-full max-w-xs justify-center rounded-lg bg-[#0ead81] px-8 py-3 text-sm font-semibold text-white hover:bg-[#10c98c] transition-colors shadow-lg shadow-[#0ead81]/20 sm:w-auto"
            >
              Open Dashboard
            </Link>
            </div>
          </FadeUp>
        </div>

        {/* Hero screenshot — 3D tilt, green glow, Mac browser frame */}
        <FadeUp delay={0.35}>
        <div className="relative mx-auto mt-10 w-full max-w-6xl px-4 sm:mt-12 sm:px-6">
          <div
            className="hero-screenshot-animate overflow-hidden rounded-xl border border-[#1e293b] bg-[#0d0d0f] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_80px_-20px_rgba(14,173,129,0.08),0_0_0_1px_rgba(255,255,255,0.06)]"
            style={{ transform: "perspective(1200px) rotateX(-4deg) rotateY(2deg)", transformStyle: "preserve-3d" }}
          >
            <div className="flex items-center gap-2 border-b border-[#1e293b] bg-[#18181b] px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="ml-2 flex-1 rounded-md bg-[#1e1e24] px-3 py-1.5 text-xs text-[#71717a]">trackr.app/dashboard</div>
            </div>
            <img
              src={dashboardScreenshot}
              alt="Trackr dashboard"
              className="h-auto w-full max-w-full object-cover object-top"
              style={{ maxHeight: "min(42vh, 380px)" }}
            />
          </div>
        </div>
        </FadeUp>

        {/* Social Proof Bar — under hero only */}
        <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-center gap-3 px-4 pb-8 text-sm text-[#94a3b8] sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2 sm:px-6">
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0 text-[#0ead81]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            2,800+ internships indexed
          </span>
          <span className="hidden text-[#475569] sm:inline">·</span>
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0 text-[#0ead81]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI cover letters in seconds
          </span>
          <span className="hidden text-[#475569] sm:inline">·</span>
          <span className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0 text-[#0ead81]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Real-time analytics
          </span>
        </div>
      </section>

      {/* How it works — large card format (Framer/Loom style) */}
      <section id="how-it-works" className="border-t border-[#1e293b] bg-[#0d0d0d] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp>
            <span className="text-xs font-medium uppercase tracking-widest text-[#0ead81]">YOUR ALL-IN-ONE TOOLKIT</span>
            <h2 className="mt-2 text-center text-[48px] font-bold tracking-tight text-white">Simple by design</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-base font-normal text-[#9ca3af]">Three steps. No fluff.</p>
          </FadeUp>

          {/* Large card format — 01, 02, 03 as decorative numbers, title + description */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {[
              { num: 1, title: "Find it", desc: "Browse 2,800+ Summer 2026 internships and add them to your board in one click." },
              { num: 2, title: "Track it", desc: "Move applications through stages as things progress. Applied, interviewing, ghosted — it's all there." },
              { num: 3, title: "Land it", desc: "Use AI cover letters, follow-up reminders, and analytics to stay ahead of everyone else." },
            ].map((item, i) => (
              <FadeUp key={item.title} delay={i * 0.08}>
                <div className="flex flex-col rounded-2xl border border-white/10 bg-[#131316] p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] transition-shadow hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] sm:p-10">
                  <span className="text-6xl font-light tabular-nums text-[#0ead81]/40 sm:text-7xl">
                    <CountUp value={item.num} pad={2} />
                  </span>
                  <h3 className="mt-4 text-xl font-bold text-white sm:text-2xl">{item.title}</h3>
                  <p className="mt-3 text-base font-normal leading-relaxed text-[#9ca3af]">{item.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Features — Stripe style: full bleed, 55% screenshot, slide in from side */}
      <section id="features" className="overflow-hidden pt-4">
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            id={f.title === "Job Finder" ? "jobs" : undefined}
            className={`flex flex-col md:flex-row md:items-center ${f.align === "right" ? "md:flex-row-reverse" : ""}`}
            style={{ background: f.bg }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {/* Screenshot — slide in from side */}
            <motion.div
              className="w-full md:w-[55%] shrink-0"
              variants={{
                hidden: { opacity: 0, x: f.align === "left" ? -60 : 60 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
            >
              <div className="overflow-hidden rounded-xl border border-[#1e293b] bg-[#0d0d0f] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),0_24px_48px_-12px_rgba(0,0,0,0.25)] mx-4 md:mx-6 lg:mx-10 my-8 md:my-12">
                <div className="flex items-center gap-2 border-b border-[#1e293b] bg-[#18181b] px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="ml-2 flex-1 rounded-md bg-[#1e1e24] px-3 py-1.5 text-xs text-[#71717a]">trackr.app/dashboard</div>
                </div>
                <img src={f.image} alt="" className="w-full h-auto object-cover object-top" style={{ maxHeight: "min(70vh, 560px)" }} />
              </div>
            </motion.div>
            {/* Text — 45% width, label + headline, green accent line */}
            <motion.div
              className="relative w-full md:w-[45%] border-l-4 border-[#0ead81] py-16 px-6 sm:py-20 sm:px-8 md:px-12 lg:px-16"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
              }}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-[#0ead81]">{f.label}</span>
              <h3 className="mt-3 text-[32px] font-semibold tracking-tight text-white">{f.title}</h3>
              <p className="mt-4 text-base font-normal leading-relaxed text-[#9ca3af]">{f.description}</p>
            </motion.div>
          </motion.div>
        ))}
      </section>

      {/* Built for students who — checklist with stagger, hover lift */}
      <section className="border-t border-[#1e293b] bg-[#080808] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp>
            <span className="text-xs font-medium uppercase tracking-wide text-[#0ead81]">SOUND FAMILIAR?</span>
            <h2 className="mt-2 text-center text-[48px] font-bold tracking-tight text-white">Built for students who</h2>
          </FadeUp>
          <motion.div
            className="mx-auto mt-12 max-w-2xl space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {[
              "Apply to a lot of jobs and lose track fast",
              "Hate writing cover letters from scratch every time",
              "Know they should follow up but always forget",
              "Are tired of managing a job search in a spreadsheet",
            ].map((pain) => (
              <motion.div
                key={pain}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#0ead81] bg-[#18181c] px-5 py-4 shadow-none transition-all duration-200 hover:-translate-y-1 hover:border-l-[#10c98c] hover:bg-[#1e1e24] hover:px-6 hover:py-5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] sm:px-6 sm:py-5 sm:hover:px-7 sm:hover:py-6"
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
                }}
              >
                <svg className="h-6 w-6 shrink-0 text-[#10c98c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-base font-normal text-[#e2e8f0]">{pain}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing — celebration card, radial gradient spotlight, #091410 */}
      <section className="border-t border-[#1e293b] py-20 sm:py-24" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, #091410, #080808)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp>
            <span className="block text-center text-xs font-medium uppercase tracking-wide text-[#0ead81]">NO CATCH</span>
            <h2 className="mt-2 text-center text-[48px] font-bold tracking-tight text-white">Pricing</h2>
          </FadeUp>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-12 max-w-lg"
          >
            <div className="pricing-card-shimmer relative mx-auto max-w-lg rounded-2xl border-2 border-[#0ead81]/60 bg-[#0d1510] p-8 shadow-[0_0_60px_-15px_rgba(14,173,129,0.3),0_0_0_1px_rgba(14,173,129,0.2)] sm:p-10">
              <p className="text-center text-[72px] font-black tracking-tight text-[#0ead81]">Free</p>
              <p className="mt-2 text-center text-lg font-semibold text-white">Genuinely.</p>
              <p className="mt-4 text-center text-base font-normal text-[#9ca3af]">No trial, no credit card, no premium tier. Just sign in and start tracking.</p>
              <ul className="mx-auto mt-6 max-w-xs space-y-2 text-base font-normal text-[#9ca3af] sm:mt-8">
                {["Kanban board", "AI cover letters", "Job Finder (2,800+ internships)", "Analytics & flow diagram", "CSV import", "Follow-up reminders"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-[#0ead81]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ — accordion expand */}
      <section className="border-t border-[#1e293b] bg-[#080808] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp>
            <span className="block text-center text-xs font-medium uppercase tracking-wide text-[#0ead81]">QUICK ANSWERS</span>
            <h2 className="mt-2 text-center text-[48px] font-bold tracking-tight text-white">Frequently asked questions</h2>
          </FadeUp>
          <FaqAccordion />
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-[#1e293b] bg-[#0d0d0f] py-20 sm:py-28">
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="pointer-events-none absolute left-1/2 -top-24 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-[#0ead81]/10 blur-[160px]" />
          <FadeUp>
            <div className="relative">
              <h2 className="text-[48px] font-bold tracking-tight text-white">Your next offer starts here.</h2>
              <Link
                to={isSignedIn ? "/dashboard" : "/sign-up"}
                className="mt-6 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-[#0ead81] px-8 py-3 text-sm font-semibold text-white hover:bg-[#10c98c] transition-colors shadow-lg shadow-[#0ead81]/20 sm:mt-8 sm:w-auto"
              >
                Open Dashboard
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer — 3-column: logo+tagline, links, CTA */}
      <footer className="border-t border-[#0ead81]/20 bg-[#080808] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp>
            <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
              <div className="flex flex-col gap-2">
                <img src={logo} alt="Trackr" className="h-10 w-fit sm:h-12" />
                <p className="text-base font-normal text-[#9ca3af]">Your job search, organized.</p>
                <p className="text-sm font-normal text-[#6b7280]">Built with React, Node.js, PostgreSQL & OpenAI</p>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">Links</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#9ca3af]">
                  <Link to={isSignedIn ? "/dashboard" : "/sign-up"} className="hover:text-white transition-colors">Dashboard</Link>
                  <a href="#jobs" className="hover:text-white transition-colors">Job Finder</a>
                  <a href="https://github.com/UlissesMolina/Trackr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
                  <a href="https://github.com/UlissesMolina/Trackr/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Report a bug</a>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">Ready to start?</span>
                <Link
                  to={isSignedIn ? "/dashboard" : "/sign-up"}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-[#0ead81] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#10c98c] transition-colors"
                >
                  Open Dashboard
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <p className="text-sm font-normal text-[#6b7280]">© 2026 Trackr</p>
              </div>
            </div>
          </FadeUp>
        </div>
      </footer>
    </div>
  );
}
