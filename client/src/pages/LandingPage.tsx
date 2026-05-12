import { useRef, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import logo from "../assets/trackr-logo-white.svg";
import noiseTexture from "../assets/noise.svg?url";
import boardScreenshot from "../assets/trackrBoard.png";

// ─── Tokens ──────────────────────────────────────────────────────────────────

const C = {
  bg: "#08090d",
  bgWarm: "#0c0e14",
  bgDeep: "#0a0b10",
  bgCard: "#14161e",
  bgInner: "#10121a",
  borderSubtle: "rgba(255,255,255,0.06)",
  borderMed: "rgba(255,255,255,0.1)",
  borderHover: "rgba(96,165,250,0.18)",
  accent: "#93b5e1",
  accentMuted: "rgba(96,165,250,0.12)",
  white: "#ffffff",
  body: "#e8e8e8",
  muted: "#9ca3af",
  dim: "rgba(255,255,255,0.55)",
};
const F = {
  display: "'Instrument Serif', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── Custom Hooks ────────────────────────────────────────────────────────────

function useScrollDirection() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest < 80) { setHidden(false); return; }
    setHidden(latest > lastY.current);
    lastY.current = latest;
  });

  return hidden;
}

// ─── Helper Components ───────────────────────────────────────────────────────

function ScrollWord({ word, scrollYProgress, rangeStart, rangeEnd, color }: { word: string; scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"]; rangeStart: number; rangeEnd: number; color: string }) {
  const opacity = useTransform(scrollYProgress, [rangeStart, rangeEnd], [1, 0]);
  const blur = useTransform(scrollYProgress, [rangeStart, rangeEnd], [0, 8]);
  const filterStr = useTransform(blur, (v) => `blur(${v}px)`);

  const isGradient = color === "gradient";

  return (
    <motion.span
      className="mr-[0.22em] inline-block"
      style={{
        ...(isGradient
          ? { background: "linear-gradient(135deg, #93b5e1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
          : { color }),
        opacity,
        filter: filterStr,
      }}
    >
      {word}
    </motion.span>
  );
}

function GlowCard({ children, className = "", style, ...props }: { children: ReactNode; className?: string; style?: React.CSSProperties } & Omit<React.ComponentProps<typeof motion.div>, "ref" | "children" | "className" | "style">) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = "", direction }: { children: ReactNode; delay?: number; className?: string; direction?: "left" | "right" }) {
  const initial: Record<string, number> = { opacity: 0, y: 24 };
  if (direction === "left") initial.x = -40;
  if (direction === "right") initial.x = 40;

  const animate: Record<string, number> = { opacity: 1, y: 0 };
  if (direction) animate.x = 0;

  return (
    <motion.div initial={initial} whileInView={animate} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

// GradientDivider removed — replaced by CSS section-blend mask edges

function ScrollReveal({ children, delay: _delay = 0, className = "", direction }: { children: ReactNode; delay?: number; className?: string; direction?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [30, 0, 0, -20]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.97, 1, 1, 0.98]);

  const xInitial = direction === "left" ? -30 : direction === "right" ? 30 : 0;
  const x = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [xInitial, 0, 0, 0]);

  // Progress bar for top accent line
  const progressScaleX = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);

  return (
    <motion.div ref={ref} className={className} style={{ opacity, y, scale, x }}>
      {children}
      {/* Top-border accent progress line */}
      <motion.div
        className="pointer-events-none absolute left-0 top-0 h-[2px] w-full origin-left rounded-full"
        style={{ background: C.accent, scaleX: progressScaleX, opacity: 0.6 }}
      />
    </motion.div>
  );
}

// ─── Floating pills ──────────────────────────────────────────────────────────


// ─── INTERACTIVE FEATURE PREVIEWS ────────────────────────────────────────────

// 1. KANBAN — card auto-drags from Applied → Interview on loop
function KanbanPreview() {
  const [phase, setPhase] = useState(0); // 0=in Applied, 1=moving, 2=in Interview, 3=reset
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
      { company: "Google", role: "SWE Intern", daysAgo: "2d", id: "g" },
      { company: "Meta", role: "Product Eng", daysAgo: "5d", id: "m" },
      { company: "Figma", role: "Frontend", daysAgo: "1w", id: "f" },
    ]},
    { label: "Interview", color: "#a855f7", cards: [
      { company: "Stripe", role: "Full Stack", daysAgo: "3d", id: "s" },
      { company: "Linear", role: "SWE Intern", daysAgo: "6d", id: "l" },
    ]},
    { label: "Offer", color: "#93b5e1", cards: [
      { company: "Vercel", role: "Frontend", daysAgo: "1d", id: "v" },
    ]},
    { label: "Rejected", color: "#ef4444", cards: [
      { company: "Amazon", role: "SDE Intern", daysAgo: "2w", id: "a" },
    ]},
  ];

  // Google card moves from Applied to Interview
  const movingCard = columns[0].cards[0];
  const showInApplied = phase === 0;
  const showInInterview = phase === 2;

  return (
    <div className="flex gap-2.5 overflow-hidden p-4" style={{ minHeight: 200 }}>
      {columns.map((col, ci) => {
        let cards = col.cards;
        if (ci === 0 && !showInApplied) cards = cards.filter(c => c.id !== "g");
        const extraCard = ci === 1 && showInInterview ? movingCard : null;
        return (
          <div key={col.label} className="flex flex-1 flex-col gap-1.5">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.color }} />
                <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: col.color, fontFamily: F.mono }}>{col.label}</span>
              </div>
              <span className="text-[7px]" style={{ color: C.dim }}>{cards.length + (extraCard ? 1 : 0)}</span>
            </div>
            <AnimatePresence mode="popLayout">
              {extraCard && (
                <motion.div
                  key="moving-card"
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="rounded-[4px] border p-1.5"
                  style={{ background: C.bgInner, borderColor: `${col.color}40`, boxShadow: `0 2px 12px ${col.color}20` }}
                >
                  <div className="text-[8px] font-medium" style={{ color: C.body }}>{extraCard.role}</div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[7px]" style={{ color: C.muted }}>{extraCard.company}</span>
                    <span className="text-[6px]" style={{ color: C.dim }}>{extraCard.daysAgo}</span>
                  </div>
                </motion.div>
              )}
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={false}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, y: -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="rounded-[4px] border p-1.5"
                  style={{ background: C.bgInner, borderColor: C.borderSubtle, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                >
                  <div className="text-[8px] font-medium" style={{ color: C.body }}>{card.role}</div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[7px]" style={{ color: C.muted }}>{card.company}</span>
                    <span className="text-[6px]" style={{ color: C.dim }}>{card.daysAgo}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// 2. COVER LETTER — types out text character by character when in view
function CoverLetterPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const fullText = "I am writing to express my interest in the Software Engineering Intern position at Google. As a computer science student with hands-on experience in full-stack development, I am eager to contribute to your team's innovative projects.";
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCharCount(i);
      if (i >= fullText.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [inView, fullText.length]);

  const visibleText = fullText.slice(0, charCount);
  const progress = Math.round((charCount / fullText.length) * 100);

  return (
    <div ref={ref} className="flex flex-col gap-2 p-4" style={{ minHeight: 200 }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-medium" style={{ color: C.body }}>SWE Intern — Google</div>
          <div className="text-[7px]" style={{ color: C.muted }}>Mountain View, CA</div>
        </div>
        <motion.div
          className="flex items-center gap-1 rounded-[4px] px-2.5 py-1 text-[8px] font-semibold"
          style={{ background: C.accent, color: "#000", fontFamily: F.mono }}
        >
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          Generating...
        </motion.div>
      </div>
      <div className="flex-1 rounded-md border p-3" style={{ background: "rgba(96,165,250,0.02)", borderColor: "rgba(96,165,250,0.08)" }}>
        <div className="text-[8px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.55)" }}>Dear Hiring Manager,</div>
        <div className="mt-1.5 text-[8px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.45)" }}>
          {visibleText}
          {charCount < fullText.length && <span className="landing-typing-cursor ml-0.5 inline-block h-3 w-[1.5px] rounded-full bg-[#93b5e1]" />}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div className="h-full rounded-full" style={{ background: C.accent }} animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
          </div>
          <span className="text-[8px] tabular-nums" style={{ color: C.accent, fontFamily: F.mono }}>{progress}%</span>
        </div>
      </div>
    </div>
  );
}

// 3. SANKEY — paths draw themselves when scrolled into view
function SankeyFlowPath({ d, fill, id, hovered, setHovered }: { d: string; fill: string; id: string; index: number; scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"]; hovered: string | null; setHovered: (v: string | null) => void }) {
  const opacityVal = hovered === null || hovered === id ? 1 : 0.3;

  return (
    <motion.path
      d={d}
      fill={fill}
      style={{ cursor: "pointer" }}
      animate={{ opacity: opacityVal }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(id)}
      onMouseLeave={() => setHovered(null)}
    />
  );
}

// 4. JOB FINDER — clickable filter pills that highlight matching results
function JobFinderPreview() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const jobs = [
    { role: "SWE Intern", co: "Google", loc: "Mountain View, CA", posted: "2d ago", salary: "$55/hr", tags: ["US Only"] },
    { role: "Frontend Intern", co: "Stripe", loc: "Remote", posted: "1d ago", salary: "$50/hr", tags: ["Remote"] },
    { role: "Backend Intern", co: "Shopify", loc: "Remote", posted: "3d ago", salary: "$45/hr", tags: ["Remote"] },
    { role: "ML Intern", co: "OpenAI", loc: "San Francisco, CA", posted: "4d ago", salary: "$60/hr", tags: ["US Only"] },
  ];
  const filtered = activeFilter ? jobs.filter(j => j.tags.includes(activeFilter)) : jobs;

  return (
    <div className="flex flex-col gap-1.5 p-4" style={{ minHeight: 200 }}>
      <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5" style={{ borderColor: C.borderMed, background: "rgba(255,255,255,0.02)" }}>
        <svg className="h-3 w-3" style={{ color: C.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span className="text-[9px]" style={{ color: C.body, fontFamily: F.mono }}>software intern</span>
        <div className="ml-auto flex gap-1">
          {["US Only", "Remote"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(activeFilter === f ? null : f)}
              className="rounded border px-1.5 py-0.5 text-[7px] transition-all duration-200"
              style={{
                borderColor: activeFilter === f ? C.borderHover : C.borderSubtle,
                color: activeFilter === f ? C.accent : C.muted,
                background: activeFilter === f ? C.accentMuted : "transparent",
                fontFamily: F.mono,
                cursor: "pointer",
              }}
            >{f}</button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="popLayout">
        {filtered.map((job) => (
          <motion.div
            key={job.co}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center justify-between rounded-md border px-2.5 py-2"
            style={{ borderColor: C.borderSubtle, background: C.bgInner, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-medium" style={{ color: C.body }}>{job.role}</span>
                <span className="text-[7px]" style={{ color: C.accent, fontFamily: F.mono }}>{job.salary}</span>
              </div>
              <div className="text-[7px]" style={{ color: C.muted }}>{job.co} · {job.loc} · {job.posted}</div>
            </div>
            <motion.div
              className="ml-2 shrink-0 cursor-pointer rounded-[3px] border px-1.5 py-0.5 text-[7px] font-semibold"
              style={{ color: C.accent, borderColor: C.borderHover, fontFamily: F.mono }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >+ Add</motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// 5. RESUME — click to switch active resume
function ResumePreview() {
  const [active, setActive] = useState(0);
  const docs = [
    { name: "resume_v3.pdf", date: "Updated 2 days ago", lines: [40, 70, 90, 80, 55, 85, 65] },
    { name: "resume_v2.pdf", date: "Updated 2 weeks ago", lines: [50, 85, 75, 60, 45, 70, 55] },
    { name: "resume_v1.pdf", date: "Updated 1 month ago", lines: [35, 60, 80, 70, 50, 65, 45] },
  ];

  return (
    <div className="flex gap-3 p-4" style={{ minHeight: 200 }}>
      {/* Active resume — big preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.25 }}
          className="flex-1 rounded-md border"
          style={{ background: C.bgInner, borderColor: C.borderHover, boxShadow: `0 2px 16px rgba(96,165,250,0.08)` }}
        >
          <div className="border-b p-2.5" style={{ borderColor: C.borderSubtle }}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold" style={{ color: C.body }}>{docs[active].name}</span>
              <span className="rounded-[3px] px-1.5 py-0.5 text-[6px] font-bold" style={{ background: C.accentMuted, color: C.accent, fontFamily: F.mono }}>ACTIVE</span>
            </div>
            <div className="text-[7px]" style={{ color: C.muted }}>{docs[active].date}</div>
          </div>
          <div className="flex flex-col gap-1 p-3">
            {/* Header skeleton */}
            <div className="h-[3px] w-[35%] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="h-[2px] w-[55%] rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="mt-2" />
            {/* Body lines */}
            {docs[active].lines.map((w, j) => (
              <div key={j} className="h-[2px] rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,0.06)" }} />
            ))}
            <div className="mt-2" />
            <div className="h-[3px] w-[30%] rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            {[80, 70, 50].map((w, j) => (
              <div key={`s${j}`} className="h-[2px] rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Version list */}
      <div className="flex flex-col gap-1.5" style={{ width: 72 }}>
        {docs.map((doc, i) => (
          <motion.button
            key={doc.name}
            onClick={() => setActive(i)}
            className="rounded-[4px] border p-1.5 text-left transition-all"
            style={{
              background: C.bgInner,
              borderColor: i === active ? C.borderHover : C.borderSubtle,
              opacity: i === active ? 1 : 0.5,
              cursor: "pointer",
            }}
            whileHover={{ opacity: 0.8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col gap-[2px]">
              {[60, 80, 45].map((w, j) => (
                <div key={j} className="h-[1.5px] rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,0.08)" }} />
              ))}
            </div>
            <div className="mt-1.5 truncate text-[6px]" style={{ color: i === active ? C.accent : C.muted, fontFamily: F.mono }}>{doc.name}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// 6. TAGS — clickable tags that filter note content
function TagsPreview() {
  const allTags = [
    { label: "Remote", color: "#3b82f6" },
    { label: "Frontend", color: "#a855f7" },
    { label: "Startup", color: "#f59e0b" },
    { label: "NYC", color: "#ef4444" },
    { label: "Intern", color: "#06b6d4" },
  ];
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const notes = [
    { title: "Stripe Interview", date: "Mar 20", text: "Behavioral round went well. System design for payment queue. Send thank you by Friday.", tags: ["Frontend", "NYC"] },
    { title: "Vercel Follow-up", date: "Mar 18", text: "Hiring manager said next round is a take-home. Due in 5 days.", tags: ["Remote", "Frontend", "Startup"] },
    { title: "Google Prep", date: "Mar 15", text: "Review LC mediums on trees and graphs. Mock interview scheduled Thursday.", tags: ["Intern"] },
  ];

  const filtered = activeTags.size === 0
    ? notes
    : notes.filter(n => n.tags.some(t => activeTags.has(t)));

  const toggle = (label: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2 p-4" style={{ minHeight: 200 }}>
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((t) => (
          <motion.button
            key={t.label}
            onClick={() => toggle(t.label)}
            className="rounded-[3px] px-2 py-0.5 text-[7px] font-semibold transition-all"
            style={{
              background: activeTags.has(t.label) ? `${t.color}30` : `${t.color}10`,
              color: t.color,
              border: `1px solid ${activeTags.has(t.label) ? `${t.color}60` : `${t.color}20`}`,
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >{t.label}</motion.button>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {filtered.map((note) => (
            <motion.div
              key={note.title}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="rounded-md border"
              style={{ borderColor: C.borderSubtle, background: C.bgInner, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
            >
              <div className="border-b px-2.5 py-1" style={{ borderColor: C.borderSubtle }}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-medium" style={{ color: C.body }}>{note.title}</span>
                  <span className="text-[6px]" style={{ color: C.muted }}>{note.date}</span>
                </div>
              </div>
              <div className="px-2.5 py-1.5 text-[7px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.45)" }}>{note.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Bento data ──────────────────────────────────────────────────────────────

const FEATURES: { title: string; desc: string; visual: ReactNode; accent: string; layout: "visual-first" | "default" | "horizontal" | "compact" }[] = [
  { title: "AI Cover Letters", desc: "Paste a job description, get a tailored cover letter in under 30 seconds.", visual: <CoverLetterPreview />, accent: "#93b5e1", layout: "visual-first" },
  { title: "Job Finder", desc: "Search thousands of listings from a live database. Filter, review, add to your board.", visual: <JobFinderPreview />, accent: "#3b82f6", layout: "default" },
  { title: "Resume Manager", desc: "Store multiple resumes. The AI cover letter generator pulls from whichever you choose.", visual: <ResumePreview />, accent: "#a855f7", layout: "horizontal" },
  { title: "Tags & Notes", desc: "Organize with custom tags and attach notes to any application for quick context.", visual: <TagsPreview />, accent: "#f59e0b", layout: "compact" },
];

const BENTO = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ isSignedIn }: { isSignedIn: boolean }) {
  const hidden = useScrollDirection();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <motion.header initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: hidden ? "-100%" : "0%" }} transition={{ duration: 0.3, ease: "easeOut" }} className="sticky inset-x-0 top-0 z-50 transition-all duration-300" style={{ background: "rgba(10,10,12,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6" style={{ fontFamily: F.body }}>
        <Link to="/"><img src={logo} alt="trackr" className="h-7" /></Link>
        <div className="hidden items-center gap-8 sm:flex">
          {["Features", "How it works"].map((l) => (<a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} className="nav-link-underline text-sm transition-colors hover:text-white" style={{ color: C.muted }}>{l}</a>))}
        </div>
        <div className="flex items-center gap-4">
          <Link to={isSignedIn ? "/dashboard" : "/sign-in"} className="hidden text-sm transition-colors hover:text-white sm:block" style={{ color: C.muted }}>Log in</Link>
          <Link to={isSignedIn ? "/dashboard" : "/sign-up"} className="rounded-lg px-5 py-2 text-sm font-medium transition-all duration-300 hover:brightness-125" style={{ background: "rgba(255,255,255,0.06)", color: "#ccc", border: "none" }}>Get started</Link>
        </div>
      </nav>
    </motion.header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ isSignedIn, pageScrollY }: { isSignedIn: boolean; pageScrollY: ReturnType<typeof useScroll>["scrollY"] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Step 3: Mockup at 0.85x — lags behind slightly
  const mockupY = useTransform(pageScrollY, [0, 900], [0, 900 * 0.15]);

  // 5b: Headline words with scroll ranges
  const headlineLines = [
    { words: [{ w: "Your", color: C.white }, { w: "job", color: C.white }, { w: "search,", color: C.white }], d: 0.35 },
    { words: [{ w: "finally", color: "rgba(255,255,255,0.45)" }, { w: "organized.", color: "gradient" }], d: 0.59 },
  ];
  const allWords = headlineLines.flatMap(l => l.words);
  const wordCount = allWords.length;

  return (
    <section ref={ref} className="relative flex items-center overflow-hidden pt-16" style={{ minHeight: "90vh" }}>

      <div className="pointer-events-none fixed inset-0 z-[9998] opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: `url(${noiseTexture})`, backgroundRepeat: "repeat" }} aria-hidden />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 pb-8 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col justify-center py-8 lg:py-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5" style={{ borderColor: "rgba(96,165,250,0.15)", background: "rgba(96,165,250,0.1)", fontFamily: F.mono, fontSize: 12, color: "#93b5e1" }}>
            <span className="badge-dot-pulse h-1.5 w-1.5 rounded-full" style={{ background: "#93b5e1" }} />Now in Beta
          </motion.div>

          {/* 5b: Headline with scroll-linked fade/blur per word */}
          <h1 style={{ fontFamily: F.display, letterSpacing: "-0.02em", lineHeight: 1.1, fontWeight: 600, textShadow: "0 0 1px rgba(255,255,255,0.08)" }}>
            {(() => {
              let wordIndex = 0;
              return headlineLines.map((line, li) => (
                <span key={li} className="block" style={{ fontSize: "clamp(3rem, 7vw, 56px)" }}>
                  {line.words.map((wordObj, wi) => {
                    const idx = wordIndex++;
                    const rangeStart = 0.15 + (idx / wordCount) * 0.25;
                    const rangeEnd = rangeStart + 0.2;
                    return (
                      <motion.span
                        key={wordObj.w}
                        className="inline-block"
                        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.5, delay: line.d + wi * 0.08 }}
                      >
                        <ScrollWord word={wordObj.w} scrollYProgress={scrollYProgress} rangeStart={rangeStart} rangeEnd={rangeEnd} color={wordObj.color} />
                      </motion.span>
                    );
                  })}
                </span>
              ));
            })()}
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.9 }} className="mt-5 leading-relaxed" style={{ fontFamily: F.body, fontSize: 17, color: "#888", maxWidth: 400 }}>Track every application. Generate cover letters. See where you stand.</motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.05 }} className="mt-7 flex flex-wrap items-center gap-4">
            <Link to={isSignedIn ? "/dashboard" : "/sign-up"} className="group inline-flex items-center gap-2 rounded-lg border px-7 py-3 text-sm font-semibold transition-all duration-300 hover:bg-[rgba(96,165,250,0.3)]" style={{ background: "rgba(96,165,250,0.2)", color: "#93b5e1", border: "1px solid rgba(96,165,250,0.25)", fontFamily: F.body }}>
              Get started<svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a href="#features" className="inline-flex items-center text-sm font-medium transition-colors duration-300 hover:underline hover:text-white" style={{ color: "#888", fontFamily: F.body }}>View features</a>
          </motion.div>
        </div>

        {/* 5a: Mockup with perspective tilt */}
        <motion.div className="relative flex items-center justify-center lg:justify-end" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.15, ease: [0.22, 1, 0.36, 1] }} style={{ y: mockupY, willChange: "transform" }}>
          <div
            className="relative w-full overflow-hidden"
            style={{
              maxWidth: "min(700px, 55vw)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              transform: "perspective(2000px) rotateY(-8deg) rotateX(2deg)",
            }}
          >
            <img src={boardScreenshot} alt="Trackr dashboard" className="h-auto w-full object-cover object-top" style={{ filter: "brightness(1.2) contrast(1.08)" }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Full-Bleed Kanban ───────────────────────────────────────────────────────

function FullBleedKanban() {
  return (
    <div className="mx-auto w-[92vw] max-w-[1400px] mt-12">
      {/* Decorative gradient line above card */}
      <div className="mx-auto mb-4 h-px" style={{ width: "60%", background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.2), transparent)" }} />
      <ScrollReveal>
        <GlowCard
          className="overflow-hidden border"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.06)",
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}
          whileHover={{ borderColor: C.borderHover, boxShadow: "0 12px 48px rgba(0,0,0,0.5)" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="h-2 w-2 rounded-full" style={{ background: C.accent }} />
              <h3 className="text-lg sm:text-xl font-semibold" style={{ fontFamily: F.body, color: C.white }}>Kanban Board</h3>
            </div>
            <p className="text-sm leading-relaxed max-w-lg" style={{ fontFamily: F.body, color: C.muted }}>Drag applications through every stage. Your entire pipeline, visible at a glance.</p>
          </div>
          <div className="border-t px-4 pb-4 sm:px-6 sm:pb-6" style={{ borderColor: C.borderSubtle, background: "rgba(255,255,255,0.012)" }}>
            <div className="mx-auto" style={{ maxWidth: 900 }}>
              <KanbanPreview />
            </div>
          </div>
        </GlowCard>
      </ScrollReveal>
    </div>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="section-blend relative">
      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <Reveal>
          <div className="flex items-center gap-2.5">
            <span className="h-1 w-1 rounded-full" style={{ background: C.accent }} />
            <span className="font-medium uppercase" style={{ fontSize: 12, letterSpacing: "0.1em", color: C.accent, fontFamily: F.mono }}>Features</span>
          </div>
          <h2 className="mt-3 max-w-lg" style={{ fontFamily: F.display, fontSize: 40, color: C.white, letterSpacing: "-0.02em", lineHeight: 1.1, fontWeight: 600 }}>Everything you need to land the role</h2>
          <p className="mt-3 max-w-md" style={{ fontFamily: F.body, color: C.muted, fontSize: "1.05rem", lineHeight: 1.6 }}>From discovery to offer — tracking, cover letters, analytics, and more in one place.</p>
        </Reveal>
      </div>

      {/* Full-bleed Kanban breakout */}
      <FullBleedKanban />

      <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08} className={`relative ${BENTO[i]}`} direction={i % 2 === 0 ? "left" : "right"}>
              <GlowCard
                className="group flex h-full overflow-hidden border"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  borderTop: `1px solid ${f.accent}18`,
                  flexDirection: f.layout === "horizontal" ? "row" : "column",
                }}
                whileHover={{ y: -4, boxShadow: `0 8px 32px ${f.accent}10` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {/* Gradient top accent line */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${f.accent}30, transparent)` }} />

                {f.layout === "visual-first" ? (
                  <>
                    <div className="relative flex-1 border-b" style={{ borderColor: C.borderSubtle, background: "rgba(255,255,255,0.012)", minHeight: 220 }}>
                      {f.visual}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.accent }} />
                        <h3 className="text-[15px] font-semibold" style={{ fontFamily: F.body, color: C.white }}>{f.title}</h3>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ fontFamily: F.body, color: C.muted }}>{f.desc}</p>
                    </div>
                  </>
                ) : f.layout === "horizontal" ? (
                  <>
                    <div className="flex flex-col justify-center p-5 sm:w-[45%] shrink-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.accent }} />
                        <h3 className="text-[15px] font-semibold" style={{ fontFamily: F.body, color: C.white }}>{f.title}</h3>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ fontFamily: F.body, color: C.muted }}>{f.desc}</p>
                    </div>
                    <div className="flex-1 border-l" style={{ borderColor: C.borderSubtle, background: "rgba(255,255,255,0.012)" }}>
                      {f.visual}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.accent }} />
                        <h3 className="text-[15px] font-semibold" style={{ fontFamily: F.body, color: C.white }}>{f.title}</h3>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ fontFamily: F.body, color: C.muted }}>{f.desc}</p>
                    </div>
                    <div className="flex-1 border-t" style={{ borderColor: C.borderSubtle, background: "rgba(255,255,255,0.012)" }}>
                      {f.visual}
                    </div>
                  </>
                )}
              </GlowCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Full-Bleed Sankey ───────────────────────────────────────────────────────

function FullBleedSankey() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section ref={sectionRef} className="section-blend relative py-24 sm:py-36">
      {/* Background tint — subtle dark tint to set apart */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,18,14,0.25) 0%, rgba(10,14,18,0.2) 50%, rgba(10,18,14,0.25) 100%)" }} aria-hidden />

      <div className="relative mx-auto max-w-6xl px-6 mb-14">
        <Reveal>
          <div className="flex items-center gap-2.5">
            <span className="h-1 w-1 rounded-full" style={{ background: "#a855f7" }} />
            <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: "#a855f7", fontFamily: F.mono }}>Analytics</span>
          </div>
          <h2 className="mt-4 max-w-2xl" style={{ fontFamily: F.display, fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)", color: C.white, letterSpacing: "-0.03em", lineHeight: 1.05, fontWeight: 700 }}>Your pipeline, visualized</h2>
          <p className="mt-4 max-w-lg" style={{ fontFamily: F.body, color: C.muted, fontSize: "1.1rem", lineHeight: 1.6 }}>See exactly where applications drop off with an interactive flow diagram.</p>
        </Reveal>
      </div>

      <div className="relative mx-auto" style={{ width: "95vw", maxWidth: 1400 }}>
        {/*
          Sankey geometry (proportional):
          Applied=47 → Interview=18 (38%)
          Interview splits: Offer=5 (28%), Rejected=13 (72%)

          At x=0:   Applied band = y 75→205  (130px)
          At x=540: Interview band = y 115→165 (50px, proportional to 18/47)
          Split:    Offer = y 115→129 (14px, 5/18 of 50)
                    Rejected = y 129→165 (36px, 13/18 of 50)
          At x=1200: Offer = y 70→84, Rejected = y 180→216 (spread for clarity)
        */}
        <svg viewBox="0 0 1200 280" className="w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="skFull1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id="skFull2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#93b5e1" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="skFull3" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          {/* Stage labels */}
          <text x="30" y="58" fill="#888" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600" letterSpacing="0.1em">APPLIED</text>
          <text x="530" y="100" fill="#888" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600" letterSpacing="0.1em">INTERVIEW</text>
          <text x="1060" y="52" fill="#888" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600" letterSpacing="0.1em">OFFER</text>
          <text x="1060" y="170" fill="#888" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600" letterSpacing="0.1em">REJECTED</text>

          {/* Counts */}
          <text x="30" y="220" fill="#888" fontSize="28" fontFamily="JetBrains Mono, monospace" fontWeight="800" opacity="0.4">47</text>
          <text x="530" y="185" fill="#888" fontSize="28" fontFamily="JetBrains Mono, monospace" fontWeight="800" opacity="0.4">18</text>
          <text x="1060" y="100" fill="#888" fontSize="28" fontFamily="JetBrains Mono, monospace" fontWeight="800" opacity="0.4">5</text>
          <text x="1060" y="230" fill="#888" fontSize="28" fontFamily="JetBrains Mono, monospace" fontWeight="800" opacity="0.4">13</text>

          {/* Flow paths — properly connected at junction */}
          {[
            { d: "M0,75 C270,75 310,115 540,115 L540,165 C310,165 270,205 0,205 Z", fill: "url(#skFull1)", id: "applied" },
            { d: "M540,115 C720,115 780,70 1200,70 L1200,84 C780,84 720,129 540,129 Z", fill: "url(#skFull2)", id: "offer" },
            { d: "M540,129 C720,129 780,180 1200,180 L1200,216 C780,216 720,165 540,165 Z", fill: "url(#skFull3)", id: "rejected" },
          ].map((path, i) => (
            <SankeyFlowPath key={path.id} {...path} index={i} scrollYProgress={scrollYProgress} hovered={hovered} setHovered={setHovered} />
          ))}
        </svg>

        {/* Hover tooltip */}
        <div className="mt-6 text-center h-6" style={{ color: C.dim, fontFamily: F.mono, fontSize: "0.85rem" }}>
          {hovered === "applied" && "47 applied \u2192 18 got interviews (38%)"}
          {hovered === "offer" && "18 interviews \u2192 5 offers (28%)"}
          {hovered === "rejected" && "18 interviews \u2192 13 rejected (72%)"}
          {!hovered && "Hover a flow to see conversion rates"}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepAreaRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = stepAreaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setTriggered(true);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const steps = [
    { num: "01", title: "Add applications", desc: "Import a CSV or add jobs manually from the finder." },
    { num: "02", title: "Track progress", desc: "Drag cards through stages as you hear back." },
    { num: "03", title: "Land the role", desc: "Follow up on time, see your funnel, close the loop." },
  ];

  // Stagger: dot1=0s, line1=0.3s, dot2=0.6s, line2=0.9s, dot3=1.2s
  // Text fades up 0.1s after its dot
  const dotDelay = (i: number) => i * 0.6;
  const lineDelay = (i: number) => 0.3 + i * 0.6;
  const textDelay = (i: number) => dotDelay(i) + 0.1;

  return (
    <section ref={sectionRef} id="how-it-works" className="section-blend relative">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <Reveal>
          <div className="flex items-center gap-2.5">
            <span className="h-1 w-1 rounded-full" style={{ background: C.accent }} />
            <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: C.accent, fontFamily: F.mono }}>How it works</span>
          </div>
          <h2 className="mt-3" style={{ fontFamily: F.display, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: C.white, letterSpacing: "-0.02em", fontWeight: 700 }}>Three steps. That's it.</h2>
        </Reveal>
        <div ref={stepAreaRef} className="relative mt-10">
          {/* Connecting dots and lines */}
          <div className="absolute left-0 right-0 top-[11px] hidden h-[2px] w-full sm:block" aria-hidden>
            {/* Dots */}
            {["0%", "50%", "100%"].map((left, i) => (
              <motion.div
                key={`dot-${i}`}
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left, background: C.accent }}
                initial={{ scale: 0 }}
                animate={triggered ? { scale: 1 } : { scale: 0 }}
                transition={{ duration: 0.4, delay: dotDelay(i), ease: [0.34, 1.56, 0.64, 1] }}
              />
            ))}
            {/* Lines between dots */}
            {[0, 1].map((i) => (
              <svg key={`line-${i}`} className="absolute top-0 h-full" style={{ left: i === 0 ? "0%" : "50%", width: "50%" }} preserveAspectRatio="none">
                <motion.line
                  x1="0" y1="1" x2="100%" y2="1"
                  stroke={C.accent}
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="1000"
                  initial={{ strokeDashoffset: 1000 }}
                  animate={triggered ? { strokeDashoffset: 0 } : { strokeDashoffset: 1000 }}
                  transition={{ duration: 0.35, delay: lineDelay(i), ease: "easeOut" }}
                />
              </svg>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 8 }}
                animate={triggered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.4, delay: textDelay(i), ease: "easeOut" }}
              >
                <div className="relative pl-10 sm:pl-0">
                  <span className="absolute left-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-[4px] text-[10px] font-bold sm:relative sm:mb-4" style={{ background: C.bgCard, color: C.accent, fontFamily: F.mono, border: `1px solid ${C.accent}35` }}>
                    {s.num}
                  </span>
                  <h3 className="text-base font-semibold sm:mt-0" style={{ fontFamily: F.body, color: C.white }}>{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ fontFamily: F.body, color: C.muted }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CTA({ isSignedIn }: { isSignedIn: boolean }) {
  const ctaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: ctaProgress } = useScroll({ target: ctaRef, offset: ["start end", "end start"] });
  // 8a: Headline scale entrance
  const headlineScale = useTransform(ctaProgress, [0, 0.4], [0.92, 1.0]);
  return (
    <section className="relative overflow-hidden">
      {/* Full-bleed gradient top border */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.15) 30%, rgba(96,165,250,0.25) 50%, rgba(96,165,250,0.15) 70%, transparent 100%)" }} aria-hidden />
      {/* Warm background tint — extends to bottom so it blends into footer */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(20,16,12,0.2) 40%, rgba(16,14,12,0.15) 100%)" }} aria-hidden />
      <div ref={ctaRef} className="relative mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
        <Reveal>
          {/* 8a: Scale entrance */}
          <motion.h2 style={{ fontFamily: F.display, fontSize: 44, color: C.white, letterSpacing: "-0.02em", lineHeight: 1.1, fontWeight: 600, scale: headlineScale }}>
            Built by a job seeker, <span style={{ background: "linear-gradient(135deg, #93b5e1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>for job seekers.</span>
          </motion.h2>
          <p className="mx-auto mt-4 max-w-md" style={{ fontFamily: F.body, color: C.muted, fontSize: "1.05rem", lineHeight: 1.6 }}>Free forever. No premium tiers, no usage limits, no credit card.</p>
          <div className="mt-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              style={{ display: "inline-block" }}
            >
              <Link to={isSignedIn ? "/dashboard" : "/sign-up"} className="group inline-flex items-center gap-2 rounded-lg border px-8 py-3.5 text-sm font-semibold transition-all duration-300 hover:bg-[rgba(96,165,250,0.3)]" style={{ background: "rgba(96,165,250,0.2)", color: "#93b5e1", border: "1px solid rgba(96,165,250,0.25)", fontFamily: F.body }}>
                Get started free<svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-8">
      <div className="mx-auto max-w-6xl px-6 text-center" style={{ fontFamily: F.body, fontSize: 12, color: "#555" }}>
        &copy; {new Date().getFullYear()} Trackr{" · "}
        <a href="https://github.com/UlissesMolina/Trackr" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#888]" style={{ color: "#555" }}>GitHub</a>
        {" · "}
        <a href="https://github.com/UlissesMolina/Trackr/issues" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#888]" style={{ color: "#555" }}>Report a bug</a>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollY, scrollYProgress: pageProgress } = useScroll();

  // Step 1: page-wide scroll-linked background color shift
  const pageBg = useTransform(
    pageProgress,
    [0, 0.35, 0.65, 1.0],
    ["#08090d", "#0a0f12", "#0d0e14", "#0e0d10"]
  );

  return (
    <motion.div
      ref={pageRef}
      className="min-h-screen w-full overflow-x-hidden"
      style={{ background: pageBg, fontFamily: F.body }}
    >
      <Navbar isSignedIn={!!isSignedIn} />
      <Hero isSignedIn={!!isSignedIn} pageScrollY={scrollY} />
      <Features />
      <FullBleedSankey />
      <HowItWorks />
      <CTA isSignedIn={!!isSignedIn} />
      <Footer />
    </motion.div>
  );
}
