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

// ─── Shared helpers ────────────────────────────────────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CountUp({
  to,
  suffix = "",
}: {
  to: number;
  suffix?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const ctrl = animate(0, to, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [isInView, to]);

  return (
    <motion.span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </motion.span>
  );
}

// ─── BrowserFrame ──────────────────────────────────────────────────────────────

function BrowserFrame({
  url,
  children,
  className = "",
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#1e293b] bg-[#0d0d0f] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5),0_24px_48px_-12px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-[#1e293b] bg-[#18181b] px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-[#1e1e24] px-3 py-1.5 text-xs text-[#71717a]">
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "Is it actually free?",
    a: "Yes. All of it. No catch.",
  },
  {
    q: "Do you store my resume?",
    a: "Only if you save it. We use it to autofill cover letters — that's it.",
  },
  {
    q: "What's the AI cover letter thing?",
    a: "You paste a job description, we generate a personalized letter using GPT-4o. You can edit it before sending. Takes about 30 seconds.",
  },
  {
    q: "Can I bring in jobs I already applied to?",
    a: "Yes — import a CSV or add them manually. Takes two minutes.",
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <motion.div
      className="mx-auto mt-10 max-w-2xl divide-y divide-white/[0.06]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {FAQ_ITEMS.map((faq, i) => (
        <motion.div
          key={faq.q}
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
          }}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between py-5 text-left"
          >
            <h3 className="font-medium text-white sm:text-lg">{faq.q}</h3>
            <motion.span
              animate={{ rotate: openIndex === i ? 45 : 0 }}
              transition={{ duration: 0.25 }}
              className="ml-4 shrink-0 text-[#0ead81]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </motion.span>
          </button>
          <motion.div
            initial={false}
            animate={{
              height: openIndex === i ? "auto" : 0,
              opacity: openIndex === i ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-base leading-relaxed text-[#9ca3af]">{faq.a}</p>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Feature icon cards data ───────────────────────────────────────────────────

const ICON_FEATURES = [
  {
    title: "Kanban Board",
    desc: "Drag applications through stages. Every job, every status, one board.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    title: "AI Cover Letters",
    desc: "Paste the job description. Get a tailored letter in 30 seconds.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: "Job Finder",
    desc: "2,800+ internships from a live database. Filter, find, apply.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
      </svg>
    ),
  },
  {
    title: "Analytics",
    desc: "See your funnel, response rates, and where things stall.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "CSV Import",
    desc: "Already tracking in a spreadsheet? Import in two minutes.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
  {
    title: "Follow-up Reminders",
    desc: "Never let a promising application go cold. Get nudged when it matters.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
];

// ─── Feature showcase rows ─────────────────────────────────────────────────────

const SHOWCASES = [
  {
    chip: "Tracking",
    title: "Kanban Board",
    description:
      "Your entire job search, on one board. Drag applications through stages as things progress — Applied, Interviewing, Offer, Ghosted. No more digging through emails.",
    align: "left" as const,
    image: boardScreenshot,
    bg: "#080808",
    url: "trackr.app/board",
  },
  {
    chip: "Cover Letters",
    title: "AI Cover Letters",
    description:
      "Paste the job description. Get a personalized letter built on your resume. Edit it, link it to the application, done. Takes 30 seconds.",
    align: "right" as const,
    image: coverLetterScreenshot,
    bg: "#0d0d0d",
    url: "trackr.app/cover-letter",
  },
  {
    chip: "Job Finder",
    title: "Job Finder",
    description:
      "2,800+ internships pulled from a live database. Filter by role, US only, posted today. Add to your board without leaving the page.",
    align: "left" as const,
    image: jobFinderScreenshot,
    bg: "#080808",
    url: "trackr.app/jobs",
  },
];

// ─── Hero section with cursor-reactive dot grid ───────────────────────────────

function HeroSection({ isSignedIn }: { isSignedIn: boolean }) {
  const baseGridRef = useRef<HTMLDivElement>(null);
  const highlightGridRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: -9999, y: -9999 });
  const raf = useRef<number>(0);

  useEffect(() => {
    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.055;
      current.current.y += (target.current.y - current.current.y) * 0.055;
      const x = current.current.x;
      const y = current.current.y;
      const pos = `calc(50% + ${x}px) calc(50% + ${y}px)`;
      if (baseGridRef.current) baseGridRef.current.style.backgroundPosition = pos;
      if (highlightGridRef.current) {
        highlightGridRef.current.style.backgroundPosition = pos;
        const cx = cursor.current.x;
        const cy = cursor.current.y;
        const mask = `radial-gradient(circle 160px at ${cx}px ${cy}px, black 0%, transparent 100%)`;
        highlightGridRef.current.style.maskImage = mask;
        highlightGridRef.current.style.webkitMaskImage = mask;
      }
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  function onMouseMove(e: { clientX: number; clientY: number; currentTarget: { getBoundingClientRect(): DOMRect } }) {
    const rect = e.currentTarget.getBoundingClientRect();
    cursor.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const nx = cursor.current.x / rect.width - 0.5;
    const ny = cursor.current.y / rect.height - 0.5;
    target.current = { x: nx * 12, y: ny * 10 };
  }

  function onMouseLeave() {
    target.current = { x: 0, y: 0 };
    cursor.current = { x: -9999, y: -9999 };
  }

  return (
    <section
      className="relative overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-16"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Base dot grid — faint, follows cursor with parallax */}
      <div
        ref={baseGridRef}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.11) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundPosition: "50% 50%",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
        }}
        aria-hidden
      />
      {/* Cursor highlight — same grid, brighter, revealed only near cursor */}
      <div
        ref={highlightGridRef}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundPosition: "50% 50%",
          maskImage:
            "radial-gradient(circle 160px at -9999px -9999px, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle 160px at -9999px -9999px, black 0%, transparent 100%)",
        }}
        aria-hidden
      />
      {/* Green glow orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[440px] w-[700px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(14,173,129,0.13), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* Badge pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-sm text-[#9ca3af]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#0ead81]" />
          Free to use · No credit card required
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="font-black leading-[1.08] text-white"
          style={{
            fontSize: "clamp(2.75rem, 7.5vw, 80px)",
            letterSpacing: "-0.04em",
          }}
        >
          <span className="block">Your job search,</span>
          <span className="block text-[#c8d6e5]">finally organized.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#6b7280] sm:text-lg"
        >
          Trackr keeps every application on a single board — so you apply more, stress less, and actually follow up.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <Link
            to={isSignedIn ? "/dashboard" : "/sign-up"}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-[#0ead81] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0ead81]/20 transition-colors hover:bg-[#10c98c] sm:w-auto"
          >
            Get started free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#features"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-7 py-3 text-sm font-semibold text-[#94a3b8] transition-colors hover:border-white/20 hover:text-white sm:w-auto"
          >
            See features
          </a>
        </motion.div>
      </div>

      {/* Hero screenshot */}
      <FadeUp delay={0.4}>
        <div className="relative mx-auto mt-12 w-full max-w-5xl px-4 sm:mt-16 sm:px-6">
          <BrowserFrame
            url="trackr.app/dashboard"
            className="hero-screenshot-animate shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_80px_-20px_rgba(14,173,129,0.08),0_0_0_1px_rgba(255,255,255,0.06)]"
          >
            <img
              src={dashboardScreenshot}
              alt="Trackr dashboard"
              className="h-auto w-full max-w-full object-cover object-top"
              style={{ maxHeight: "min(44vh, 400px)" }}
            />
          </BrowserFrame>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#080808]">
      {/* Noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[9998] opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: `url(${noiseTexture})`, backgroundRepeat: "repeat" }}
        aria-hidden
      />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="animate-slide-down fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="py-2">
            <img src={logo} alt="Trackr" className="h-7 sm:h-8" />
          </Link>

          {/* Center links — hidden on mobile */}
          <div className="hidden items-center gap-7 sm:flex">
            {(["#features", "#jobs", "#pricing", "#faq"] as const).map((href) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-[#71717a] transition-colors hover:text-white"
              >
                {href.replace("#", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              to={isSignedIn ? "/dashboard" : "/sign-in"}
              className="hidden text-sm font-medium text-[#94a3b8] transition-colors hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link
              to={isSignedIn ? "/dashboard" : "/sign-up"}
              className="rounded-full bg-[#0ead81] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#10c98c]"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <HeroSection isSignedIn={!!isSignedIn} />

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <div className="border-y border-white/[0.06] bg-[#0d0d0f]">
        <div className="mx-auto grid max-w-4xl grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { to: 2800, suffix: "+", label: "Internships indexed" },
            { to: 100, suffix: "%", label: "Features free, always" },
            { to: 30, suffix: "s", label: "AI cover letter generation" },
          ].map((stat) => (
            <FadeUp key={stat.label} className="flex flex-col items-center py-10 px-6 text-center">
              <span className="text-4xl font-black tabular-nums text-white" style={{ letterSpacing: "-0.03em" }}>
                <CountUp to={stat.to} suffix={stat.suffix} />
              </span>
              <span className="mt-1.5 text-sm text-[#6b7280]">{stat.label}</span>
            </FadeUp>
          ))}
        </div>
      </div>

      {/* ── Feature icon grid ────────────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0ead81]">
              Everything you need
            </span>
            <h2
              className="mt-3 font-bold text-white"
              style={{ fontSize: "clamp(1.75rem, 4vw, 48px)", letterSpacing: "-0.03em" }}
            >
              Built for the whole search
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-[#6b7280]">
              From finding jobs to landing them — every tool in one place, free.
            </p>
          </FadeUp>

          <motion.div
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07 } },
            }}
          >
            {ICON_FEATURES.map((feat) => (
              <motion.div
                key={feat.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                }}
                className="group rounded-xl border border-white/[0.08] bg-[#0d0d0f] p-6 transition-all duration-200 hover:border-white/[0.14] hover:-translate-y-0.5"
              >
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0ead81]/10 ring-1 ring-[#0ead81]/20 text-[#0ead81]">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-white">{feat.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6b7280]">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Feature showcases ────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-t border-white/[0.06]">
        {SHOWCASES.map((f) => (
          <motion.div
            key={f.title}
            id={f.chip === "Job Finder" ? "jobs" : undefined}
            className={`flex flex-col md:flex-row md:items-center ${f.align === "right" ? "md:flex-row-reverse" : ""}`}
            style={{ background: f.bg }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.13 } } }}
          >
            {/* Screenshot */}
            <motion.div
              className="w-full shrink-0 md:w-[55%]"
              variants={{
                hidden: { opacity: 0, x: f.align === "left" ? -50 : 50 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <BrowserFrame
                url={f.url}
                className="mx-4 my-8 md:mx-6 md:my-12 lg:mx-10"
              >
                <img
                  src={f.image}
                  alt={f.title}
                  className="h-auto w-full object-cover object-top"
                  style={{ maxHeight: "min(70vh, 520px)" }}
                />
              </BrowserFrame>
            </motion.div>

            {/* Text */}
            <motion.div
              className="w-full py-12 px-6 sm:py-16 sm:px-8 md:w-[45%] md:px-10 lg:px-14"
              variants={{
                hidden: { opacity: 0, y: 32 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
              }}
            >
              <span className="inline-block rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#9ca3af]">
                {f.chip}
              </span>
              <h3
                className="mt-4 font-bold text-white"
                style={{ fontSize: "clamp(1.5rem, 3vw, 32px)", letterSpacing: "-0.025em" }}
              >
                {f.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-[#9ca3af]">{f.description}</p>
            </motion.div>
          </motion.div>
        ))}
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-white/[0.06] bg-[#080808] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0ead81]">
              Pricing
            </span>
            <h2
              className="mt-3 font-bold text-white"
              style={{ fontSize: "clamp(1.75rem, 4vw, 48px)", letterSpacing: "-0.03em" }}
            >
              One plan. Everything included.
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base text-[#6b7280]">
              No tiers, no trials, no upsells. Just sign in.
            </p>
          </FadeUp>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-14 max-w-sm"
          >
            <div className="rounded-2xl border border-white/[0.1] bg-[#111113] p-8 sm:p-10">
              {/* Price */}
              <div className="flex items-end gap-2">
                <span
                  className="font-bold text-white"
                  style={{ fontSize: "52px", lineHeight: 1, letterSpacing: "-0.04em" }}
                >
                  $0
                </span>
                <span className="mb-1.5 text-sm text-[#4b5563]">/ forever</span>
              </div>
              <p className="mt-2 text-sm text-[#6b7280]">
                No credit card. No premium tier. No expiry.
              </p>

              <div className="my-6 border-t border-white/[0.06]" />

              {/* Features */}
              <ul className="space-y-3 text-sm text-[#9ca3af]">
                {[
                  "Kanban board",
                  "AI cover letters (GPT-4o)",
                  "Job Finder — 2,800+ internships",
                  "Analytics & flow diagram",
                  "CSV import",
                  "Follow-up reminders",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <svg className="h-4 w-4 shrink-0 text-[#0ead81]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to={isSignedIn ? "/dashboard" : "/sign-up"}
                className="mt-8 flex w-full items-center justify-center rounded-lg bg-[#0ead81] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#10c98c]"
              >
                Get started free →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-white/[0.06] bg-[#080808] py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeUp className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0ead81]">
              FAQ
            </span>
            <h2
              className="mt-3 font-bold text-white"
              style={{ fontSize: "clamp(1.75rem, 4vw, 48px)", letterSpacing: "-0.03em" }}
            >
              Quick answers
            </h2>
          </FadeUp>
          <FaqAccordion />
        </div>
      </section>

      {/* ── CTA footer ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#0d0d0f] py-24 sm:py-32">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(14,173,129,0.09), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <FadeUp>
            <span className="inline-block rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#9ca3af]">
              Ready to start
            </span>
            <h2
              className="mt-6 font-bold text-white"
              style={{ fontSize: "clamp(2rem, 5vw, 56px)", letterSpacing: "-0.035em" }}
            >
              Your next offer starts here.
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-base text-[#6b7280]">
              Free forever. No setup required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                to={isSignedIn ? "/dashboard" : "/sign-up"}
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-[#0ead81] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0ead81]/20 transition-colors hover:bg-[#10c98c] sm:w-auto"
              >
                Get started free →
              </Link>
              <a
                href="https://github.com/UlissesMolina/Trackr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-7 py-3 text-sm font-semibold text-[#94a3b8] transition-colors hover:border-white/20 hover:text-white sm:w-auto"
              >
                View on GitHub
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#080808] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-4 sm:gap-8">
            {/* Logo + tagline — spans 2 cols */}
            <div className="flex flex-col gap-2 sm:col-span-2">
              <img src={logo} alt="Trackr" className="h-8 w-fit" />
              <p className="mt-1 text-sm text-[#6b7280]">Your job search, organized.</p>
              <p className="text-xs text-[#4b5563]">Built with React, Node.js, PostgreSQL & OpenAI</p>
            </div>

            {/* Product */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#4b5563]">
                Product
              </span>
              <div className="flex flex-col gap-2 text-sm text-[#9ca3af]">
                <Link to={isSignedIn ? "/dashboard" : "/sign-up"} className="transition-colors hover:text-white">
                  Dashboard
                </Link>
                <a href="#features" className="transition-colors hover:text-white">
                  Features
                </a>
                <a href="#pricing" className="transition-colors hover:text-white">
                  Pricing
                </a>
                <a href="#faq" className="transition-colors hover:text-white">
                  FAQ
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#4b5563]">
                Links
              </span>
              <div className="flex flex-col gap-2 text-sm text-[#9ca3af]">
                <a
                  href="https://github.com/UlissesMolina/Trackr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  GitHub
                </a>
                <a
                  href="https://github.com/UlissesMolina/Trackr/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Report a bug
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 border-t border-white/[0.06] pt-6 text-center text-xs text-[#4b5563]">
            © 2026 Trackr. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
