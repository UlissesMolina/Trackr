import { useRef, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  motion,
  useInView,
  AnimatePresence,
} from "framer-motion";
import logo from "../assets/trackr-logo-white.svg";
import noiseTexture from "../assets/noise.svg?url";
import boardScreenshot from "../assets/trackrBoard.png";

// ─── Tokens ──────────────────────────────────────────────────────────────────

const border = "rgba(255,255,255,0.1)";
const accent = "#9dbbff";
const muted = "rgba(255,255,255,0.62)";
const dim = "rgba(255,255,255,0.42)";

const F = {
  sans: "'Geist', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
};

// ─── Shared ──────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = "", style }: { children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── FEATURE PREVIEWS ────────────────────────────────────────────────────────

function KanbanPreview() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2000),
      setTimeout(() => setPhase(2), 2600),
      setTimeout(() => setPhase(0), 5000),
    ];
    const interval = setInterval(() => {
      setPhase(0);
      setTimeout(() => setPhase(1), 2000);
      setTimeout(() => setPhase(2), 2600);
    }, 5000);
    return () => { timers.forEach(clearTimeout); clearInterval(interval); };
  }, []);

  const columns = [
    { label: "Applied", color: "#3b82f6", cards: [
      { company: "Google", role: "SWE Intern", id: "g" },
      { company: "Meta", role: "Product Eng", id: "m" },
      { company: "Figma", role: "Frontend", id: "f" },
    ]},
    { label: "Interview", color: "#6b9bd2", cards: [
      { company: "Stripe", role: "Full Stack", id: "s" },
      { company: "Linear", role: "SWE Intern", id: "l" },
    ]},
    { label: "Offer", color: "#22c55e", cards: [
      { company: "Vercel", role: "Frontend", id: "v" },
    ]},
    { label: "Rejected", color: "#ef4444", cards: [
      { company: "Amazon", role: "SDE Intern", id: "a" },
    ]},
  ];

  const movingCard = columns[0].cards[0];
  const showInApplied = phase === 0;
  const showInInterview = phase === 2;

  return (
    <div className="flex gap-3 p-5">
      {columns.map((col, ci) => {
        let cards = col.cards;
        if (ci === 0 && !showInApplied) cards = cards.filter(c => c.id !== "g");
        const extraCard = ci === 1 && showInInterview ? movingCard : null;
        return (
          <div key={col.label} className="flex flex-1 flex-col gap-2">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: col.color, fontFamily: F.mono }}>{col.label}</span>
            </div>
            <AnimatePresence mode="popLayout">
              {extraCard && (
                <motion.div key="moving" layout initial={{ opacity: 0, scale: 0.8, y: -16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="rounded-lg border p-2.5" style={{ background: "rgba(255,255,255,0.04)", borderColor: `${col.color}40` }}>
                  <div className="text-[10px] font-medium text-[#e2e8f0]">{extraCard.role}</div>
                  <div className="mt-1 text-[9px]" style={{ color: muted }}>{extraCard.company}</div>
                </motion.div>
              )}
              {cards.map((card) => (
                <motion.div key={card.id} layout initial={false} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85, y: -8 }} transition={{ duration: 0.3 }} className="rounded-lg border p-2.5" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                  <div className="text-[10px] font-medium text-[#e2e8f0]">{card.role}</div>
                  <div className="mt-1 text-[9px]" style={{ color: muted }}>{card.company}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function CoverLetterPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const fullText = "I am writing to express my interest in the Software Engineering Intern position. As a CS student with full-stack experience, I am eager to contribute to your team's innovative projects.";
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const interval = setInterval(() => { i++; setCharCount(i); if (i >= fullText.length) clearInterval(interval); }, 22);
    return () => clearInterval(interval);
  }, [inView, fullText.length]);

  return (
    <div ref={ref} className="flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-[#e2e8f0]">SWE Intern — Google</span>
        <span className="text-[9px] font-medium" style={{ color: accent, fontFamily: F.mono }}>{Math.round((charCount / fullText.length) * 100)}%</span>
      </div>
      <div className="text-[10px] leading-[2]" style={{ color: muted }}>Dear Hiring Manager,</div>
      <div className="text-[10px] leading-[2]" style={{ color: dim }}>
        {fullText.slice(0, charCount)}
        {charCount < fullText.length && <span className="ml-0.5 inline-block h-3.5 w-[1.5px] rounded-full animate-pulse" style={{ background: accent }} />}
      </div>
      <div className="mt-auto h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" style={{ background: accent }} animate={{ width: `${Math.round((charCount / fullText.length) * 100)}%` }} />
      </div>
    </div>
  );
}

function JobFinderPreview() {
  const [filter, setFilter] = useState<string | null>(null);
  const jobs = [
    { role: "SWE Intern", co: "Google", salary: "$55/hr", tags: ["US"] },
    { role: "Frontend", co: "Stripe", salary: "$50/hr", tags: ["Remote"] },
    { role: "Backend", co: "Shopify", salary: "$45/hr", tags: ["Remote"] },
    { role: "ML Intern", co: "OpenAI", salary: "$60/hr", tags: ["US"] },
  ];
  const filtered = filter ? jobs.filter(j => j.tags.includes(filter)) : jobs;

  return (
    <div className="flex flex-col gap-2 p-5">
      <div className="flex items-center gap-2 mb-1">
        <svg className="h-3.5 w-3.5" style={{ color: muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span className="text-[10px]" style={{ color: "#e2e8f0", fontFamily: F.mono }}>software intern</span>
        <div className="ml-auto flex gap-1.5">
          {["US", "Remote"].map((f) => (
            <button key={f} onClick={() => setFilter(filter === f ? null : f)} className="rounded border px-1.5 py-0.5 text-[9px] transition-all" style={{ borderColor: filter === f ? "rgba(157,187,255,0.3)" : "rgba(255,255,255,0.08)", color: filter === f ? accent : muted, background: filter === f ? "rgba(157,187,255,0.08)" : "transparent", fontFamily: F.mono, cursor: "pointer" }}>{f}</button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="popLayout">
        {filtered.map((job) => (
          <motion.div key={job.co} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <div>
              <span className="text-[10px] font-medium text-[#e2e8f0]">{job.role}</span>
              <span className="ml-2 text-[9px]" style={{ color: accent, fontFamily: F.mono }}>{job.salary}</span>
              <div className="text-[9px]" style={{ color: muted }}>{job.co}</div>
            </div>
            <span className="text-[9px] font-medium" style={{ color: accent, fontFamily: F.mono, cursor: "pointer" }}>+</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ResumePreview() {
  const [active, setActive] = useState(0);
  const lines = [[40, 70, 90, 80, 55, 85, 65], [50, 85, 75, 60, 45, 70, 55], [35, 60, 80, 70, 50, 65, 45]];

  return (
    <div className="flex gap-3 p-5">
      <div className="flex flex-1 flex-col rounded-lg border p-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(157,187,255,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium text-[#e2e8f0]">resume_v{3 - active}.pdf</span>
          <span className="text-[8px] font-bold" style={{ color: accent, fontFamily: F.mono }}>ACTIVE</span>
        </div>
        <div className="flex flex-col gap-[4px]">
          <div className="h-[3px] w-[38%] rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="h-[2px] w-[55%] rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="mt-2" />
          {lines[active].map((w, j) => (<div key={j} className="h-[2px] rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,0.035)" }} />))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2].map((i) => (
          <button key={i} onClick={() => setActive(i)} className="rounded border p-1.5 transition-all" style={{ width: 44, background: "rgba(255,255,255,0.03)", borderColor: i === active ? "rgba(157,187,255,0.15)" : "rgba(255,255,255,0.08)", opacity: i === active ? 1 : 0.4, cursor: "pointer" }}>
            <div className="flex flex-col gap-[2px]">{[55, 70, 40].map((w, j) => (<div key={j} className="h-[1px] rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,0.08)" }} />))}</div>
            <div className="mt-1 text-[7px]" style={{ color: i === active ? accent : muted, fontFamily: F.mono }}>v{3 - i}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div className="flex flex-col p-5">
      <svg viewBox="0 0 360 120" className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="f1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3b82f6" stopOpacity=".4" /><stop offset="100%" stopColor="#6b9bd2" stopOpacity=".3" /></linearGradient>
          <linearGradient id="f2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6b9bd2" stopOpacity=".3" /><stop offset="100%" stopColor="#22c55e" stopOpacity=".4" /></linearGradient>
          <linearGradient id="f3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6b9bd2" stopOpacity=".25" /><stop offset="100%" stopColor="#ef4444" stopOpacity=".3" /></linearGradient>
        </defs>
        <text x="8" y="16" fill={muted} fontSize="7" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing=".08em">APPLIED</text>
        <text x="150" y="32" fill={muted} fontSize="7" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing=".08em">INTERVIEW</text>
        <text x="305" y="14" fill={muted} fontSize="7" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing=".08em">OFFER</text>
        <text x="305" y="78" fill={muted} fontSize="7" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing=".08em">REJECTED</text>
        <text x="8" y="95" fill={muted} fontSize="14" fontFamily="JetBrains Mono" fontWeight="800" opacity=".18">47</text>
        <text x="155" y="82" fill={muted} fontSize="14" fontFamily="JetBrains Mono" fontWeight="800" opacity=".18">18</text>
        <text x="320" y="36" fill={muted} fontSize="14" fontFamily="JetBrains Mono" fontWeight="800" opacity=".18">5</text>
        <text x="320" y="102" fill={muted} fontSize="14" fontFamily="JetBrains Mono" fontWeight="800" opacity=".18">13</text>
        {[
          { d: "M0,25 C80,25 90,40 160,40 L160,68 C90,68 80,82 0,82 Z", fill: "url(#f1)", id: "applied" },
          { d: "M160,40 C215,40 230,18 360,18 L360,26 C230,26 215,48 160,48 Z", fill: "url(#f2)", id: "offer" },
          { d: "M160,48 C215,48 230,70 360,70 L360,92 C230,92 215,68 160,68 Z", fill: "url(#f3)", id: "rejected" },
        ].map((p) => (
          <motion.path key={p.id} d={p.d} fill={p.fill} style={{ cursor: "pointer" }} animate={{ opacity: hovered === null || hovered === p.id ? 1 : 0.15 }} transition={{ duration: 0.25 }} onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)} />
        ))}
      </svg>
      <div className="mt-2 h-4 text-center">
        <span className="text-[9px]" style={{ color: dim, fontFamily: F.mono }}>
          {hovered === "applied" ? "38% interview rate" : hovered === "offer" ? "28% offer rate" : hovered === "rejected" ? "72% rejected" : "Hover to explore"}
        </span>
      </div>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${border}` }}>
      <div className="mx-auto grid h-14 max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center px-8">
        <Link to="/"><img src={logo} alt="trackr" className="h-5" /></Link>
        <nav className="hidden items-center gap-7 sm:flex">
          {["Features", "How it works"].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="text-[13px] transition-colors hover:text-white" style={{ color: muted }}>{l}</a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-[18px]">
          <Link to={isSignedIn ? "/dashboard" : "/sign-in"} className="hidden text-[13px] transition-colors hover:text-white sm:block" style={{ color: "rgba(255,255,255,0.55)" }}>Log in</Link>
          <Link to={isSignedIn ? "/dashboard" : "/sign-up"} className="rounded-full px-4 py-[7px] text-[13px] font-medium transition-all duration-150 hover:bg-[#eaeaea]" style={{ background: "#fff", color: "#000" }}>Get started</Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section
      style={{
        borderBottom: `1px solid ${border}`,
        background: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), #000",
        backgroundSize: "72px 72px, 72px 72px, auto",
      }}
    >
      <div className="mx-auto grid min-h-[580px] max-w-[1200px] grid-cols-1 items-center gap-16 px-8 py-32 lg:grid-cols-2 lg:gap-[72px]">
        <div className="flex flex-col">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontFamily: F.sans, fontSize: "clamp(52px, 6vw, 84px)", fontWeight: 650, lineHeight: 0.92, letterSpacing: "-0.06em", color: "#f5f5f5" }}
          >
            Your job search,<br />
            <span style={{ color: "rgba(255,255,255,0.72)" }}>organized.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-7 max-w-[380px] text-[16px] leading-[1.6]"
            style={{ color: muted }}
          >
            Track applications, generate cover letters, and see where every opportunity stands.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-9 flex items-center gap-5"
          >
            <Link
              to={isSignedIn ? "/dashboard" : "/sign-up"}
              className="inline-flex items-center gap-2 rounded-full px-5 py-[10px] text-[13px] font-medium transition-all duration-150 hover:bg-[#eaeaea]"
              style={{ background: "#fff", color: "#000" }}
            >
              Get started free
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a href="#features" className="text-[13px] transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>View features →</a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="overflow-hidden rounded-[12px]" style={{ border: `1px solid ${border}`, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            <img src={boardScreenshot} alt="Trackr dashboard" className="h-auto w-full object-cover object-top" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Feature Cell ────────────────────────────────────────────────────────────

function FeatureCell({ title, desc, children, delay = 0 }: { title: string; desc: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal
      delay={delay}
      className="relative flex flex-col overflow-hidden"
      style={{
        borderRight: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        minHeight: 420,
        padding: "48px 44px 0",
        background: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.045), transparent 45%), #000",
        backgroundSize: "48px 48px, 48px 48px, auto, auto",
      }}
    >
      {/* Corner cross-lines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px) top left / 24px 1px no-repeat, linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px) top left / 1px 24px no-repeat",
          opacity: 0.4,
        }}
      />

      {/* Copy with bottom divider */}
      <div className="relative z-10 pb-6 mb-6" style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
        <h3 style={{ fontFamily: F.sans, fontSize: 26, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.04em", color: "#f5f5f5", marginBottom: 12 }}>{title}</h3>
        <p style={{ maxWidth: 320, fontSize: 15, lineHeight: 1.6, color: muted }}>{desc}</p>
      </div>

      {/* Visual — absolutely positioned, cropped at bottom */}
      <div
        className="absolute left-9 right-9 bottom-[-32px] z-10 overflow-hidden rounded-t-[14px] border border-b-0"
        style={{ height: 200, borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.035)", boxShadow: "0 -8px 48px rgba(0,0,0,0.5)" }}
      >
        {children}
      </div>
    </Reveal>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" style={{ borderBottom: `1px solid ${border}` }}>
      <div
        className="mx-auto grid max-w-[1200px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{ borderLeft: `1px solid ${border}`, borderTop: `1px solid ${border}` }}
      >
        {/* Intro cell */}
        <Reveal
          className="relative overflow-hidden flex flex-col justify-center"
          style={{
            borderRight: `1px solid ${border}`,
            borderBottom: `1px solid ${border}`,
            minHeight: 420,
            padding: "56px 48px",
            background: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px), radial-gradient(circle at 50% 90%, rgba(157,187,255,0.04), transparent 50%), #000`,
            backgroundSize: "48px 48px, 48px 48px, auto, auto",
          }}
        >
          <span className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: accent, fontFamily: F.mono }}>Features</span>
          <h2 style={{ fontFamily: F.sans, fontSize: 44, fontWeight: 650, lineHeight: 1.0, letterSpacing: "-0.05em", color: "#f5f5f5", maxWidth: 260 }}>
            The job search, without the spreadsheet.
          </h2>
          <p className="mt-5 text-[16px] leading-[1.55]" style={{ color: muted, maxWidth: 280 }}>
            Applications, resumes, cover letters, and analytics — one workspace.
          </p>
        </Reveal>

        <FeatureCell delay={0.05} title="Track applications" desc="Move every role through your pipeline from applied to offer.">
          <KanbanPreview />
        </FeatureCell>

        <FeatureCell delay={0.1} title="AI cover letters" desc="Generate a polished draft from any job description in seconds.">
          <CoverLetterPreview />
        </FeatureCell>

        <FeatureCell delay={0.15} title="Find jobs faster" desc="Search, filter, and add listings directly to your board.">
          <JobFinderPreview />
        </FeatureCell>

        <FeatureCell delay={0.2} title="Manage resumes" desc="Store multiple versions and pull the right one when needed.">
          <ResumePreview />
        </FeatureCell>

        <FeatureCell delay={0.25} title="Visualize progress" desc="See where your applications drop off with simple analytics.">
          <AnalyticsPreview />
        </FeatureCell>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const steps = [
    { num: "01", title: "Add applications", desc: "Import a CSV or add jobs from the built-in finder." },
    { num: "02", title: "Track progress", desc: "Move cards through each stage as you hear back." },
    { num: "03", title: "Land the role", desc: "Follow up on time, watch your funnel, close the loop." },
  ];

  return (
    <section id="how-it-works" style={{ borderBottom: `1px solid ${border}` }}>
      <div ref={ref} className="mx-auto max-w-[1200px] px-8 py-24">
        <Reveal>
          <span className="mb-4 inline-block text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: accent, fontFamily: F.mono }}>How it works</span>
          <h2 style={{ fontFamily: F.sans, fontSize: 36, fontWeight: 650, lineHeight: 1.05, letterSpacing: "-0.045em", color: "#f5f5f5" }}>
            Three steps. That's it.
          </h2>
        </Reveal>

        <div
          className="mt-14 grid grid-cols-1 sm:grid-cols-3"
          style={{ borderTop: `1px solid ${border}`, borderLeft: `1px solid ${border}` }}
        >
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.12 * i }}
              className="relative p-9"
              style={{
                borderRight: `1px solid ${border}`,
                borderBottom: `1px solid ${border}`,
                minHeight: 200,
                background: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px), #000",
                backgroundSize: "48px 48px, 48px 48px, auto",
              }}
            >
              <span className="mb-6 inline-block text-[12px] font-semibold tracking-[0.08em]" style={{ color: accent, fontFamily: F.mono }}>{s.num}</span>
              <h3 className="text-[16px] font-semibold" style={{ color: "#f5f5f5", fontFamily: F.sans }}>{s.title}</h3>
              <p className="mt-2.5 text-[14px] leading-[1.6]" style={{ color: muted }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CTA({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section>
      <div className="mx-auto max-w-[1200px] px-8 py-24 text-center">
        <Reveal>
          <h2 style={{ fontFamily: F.sans, fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 650, lineHeight: 1.05, letterSpacing: "-0.05em", color: "#f5f5f5" }}>
            Built by a job seeker,{" "}
            <span style={{ color: "rgba(255,255,255,0.72)" }}>for job seekers.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.6]" style={{ color: muted }}>
            Free forever. No premium tiers, no usage limits, no credit card.
          </p>
          <div className="mt-8">
            <Link to={isSignedIn ? "/dashboard" : "/sign-up"} className="inline-flex items-center gap-2 rounded-full px-6 py-[10px] text-[14px] font-medium transition-all duration-150 hover:bg-[#eaeaea]" style={{ background: "#fff", color: "#000" }}>
              Get started free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${border}` }}>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-6">
        <span className="text-[12px]" style={{ color: muted }}>&copy; {new Date().getFullYear()} Trackr</span>
        <div className="flex items-center gap-5">
          <a href="https://github.com/UlissesMolina/Trackr" target="_blank" rel="noopener noreferrer" className="text-[12px] transition-colors hover:text-white" style={{ color: muted }}>GitHub</a>
          <a href="https://github.com/UlissesMolina/Trackr/issues" target="_blank" rel="noopener noreferrer" className="text-[12px] transition-colors hover:text-white" style={{ color: muted }}>Report a bug</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: "#000", fontFamily: F.sans, color: "#fff" }}>
      <div className="pointer-events-none fixed inset-0 z-[9998] opacity-[0.016] mix-blend-overlay" style={{ backgroundImage: `url(${noiseTexture})`, backgroundRepeat: "repeat" }} aria-hidden />
      <Navbar isSignedIn={!!isSignedIn} />
      <main>
        <Hero isSignedIn={!!isSignedIn} />
        <Features />
        <HowItWorks />
        <CTA isSignedIn={!!isSignedIn} />
        <Footer />
      </main>
    </div>
  );
}
