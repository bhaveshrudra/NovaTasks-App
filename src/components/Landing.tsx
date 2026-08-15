import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Zap,
  Target,
  CalendarClock,
  Users,
  ShieldCheck,
  Rocket,
  Globe,
  UserRound,
  CheckCircle2,
  Activity,
  ListChecks,
  Bell,
  Clock,
  Mic,
  MapPin,
  Mail,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { Background } from "./ui/Background";
import { AnimatedCounter } from "./ui/AnimatedCounter";
import { navigateTo, getGuestSession } from "../utils/auth";
import { Task } from "../types";

interface LandingProps {
  onGuestLogin: () => void;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const UPCOMING_EVENTS = [
  { title: "Design Workshop", date: "Aug 22", time: "10:00", tag: "Workshop", location: "Innovation Lab" },
  { title: "AI Bootcamp", date: "Aug 28", time: "09:30", tag: "Bootcamp", location: "Main Auditorium" },
  { title: "Hackathon Sprint", date: "Sep 05", time: "18:00", tag: "Sprint", location: "Nova Hall" },
  { title: "Product Pitch Night", date: "Sep 12", time: "17:00", tag: "Showcase", location: "Startup Hub" },
];

const FEATURES = [
  { icon: <Zap className="w-5 h-5" />, title: "AI Task Parsing", text: "Natural-language commands become structured objectives instantly." },
  { icon: <Globe className="w-5 h-5" />, title: "Real-time Sync", text: "Tasks, events and registrations stay in sync across sessions." },
  { icon: <Clock className="w-5 h-5" />, title: "Focus Timer", text: "Deep-work sessions with ambient soundscapes and progress tracking." },
  { icon: <Mic className="w-5 h-5" />, title: "Voice Commands", text: "Dictate tasks and alarms through the Nova voice assistant." },
  { icon: <Bell className="w-5 h-5" />, title: "Critical Alerts", text: "Priority alarms cut through with urgent visual and audio cues." },
  { icon: <Activity className="w-5 h-5" />, title: "Energy Intelligence", text: "Cognitive-load estimates help you schedule when you're sharpest." },
];

const STEPS = [
  { icon: <UserRound className="w-5 h-5" />, step: "01", title: "Join as Guest", text: "No account needed — one click and you're in the command center." },
  { icon: <ListChecks className="w-5 h-5" />, step: "02", title: "Enroll in Tasks", text: "Browse available events and enroll in the ones that matter." },
  { icon: <Clock className="w-5 h-5" />, step: "03", title: "Track & Focus", text: "Monitor progress, deadlines and lock in with the focus timer." },
  { icon: <Rocket className="w-5 h-5" />, step: "04", title: "Ship Results", text: "Complete objectives and your registrations are logged automatically." },
];

const WHY_STATS = [
  { value: 500, suffix: "+", label: "Community Members" },
  { value: 40, suffix: "+", label: "Tasks Shipped" },
  { value: 92, suffix: "%", label: "Completion Rate" },
  { value: 24, suffix: "/7", label: "Platform Uptime" },
];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Network visual (hero right column) — lightweight SVG node graph
// ---------------------------------------------------------------------------
function NetworkVisual() {
  const rings = useMemo(() => {
    const defs = [
      { rx: 150, ry: 58, rot: 0, n: 8 },
      { rx: 150, ry: 58, rot: 60, n: 8 },
      { rx: 150, ry: 58, rot: 120, n: 8 },
      { rx: 150, ry: 58, rot: 30, n: 6 },
    ];
    return defs.map((d) => {
      const nodes: { x: number; y: number }[] = [];
      for (let i = 0; i < d.n; i++) {
        const a = (i / d.n) * Math.PI * 2;
        const ex = d.rx * Math.cos(a);
        const ey = d.ry * Math.sin(a);
        const rad = (d.rot * Math.PI) / 180;
        nodes.push({
          x: 300 + ex * Math.cos(rad) - ey * Math.sin(rad),
          y: 210 + ex * Math.sin(rad) + ey * Math.cos(rad),
        });
      }
      return { ...d, nodes };
    });
  }, []);

  // unique node set (approx by rounding) for drawing lines
  const unique = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    rings.forEach((r) => r.nodes.forEach((p) => map.set(`${Math.round(p.x)},${Math.round(p.y)}`, p)));
    return [...map.values()];
  }, [rings]);

  return (
    <div className="relative w-full max-w-[560px] mx-auto aspect-[4/3] flex items-center justify-center select-none">
      {/* Expanding radar rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-40 h-40 rounded-full border border-[#3b82f6]/20" style={{ animation: "tasknova-ring 5s ease-out infinite" }} />
        <div className="absolute w-40 h-40 rounded-full border border-[#00f2ff]/15" style={{ animation: "tasknova-ring 5s ease-out infinite", animationDelay: "2.5s" }} />
      </div>

      <svg viewBox="0 0 600 420" className="w-full h-full drop-shadow-[0_0_30px_rgba(59,130,246,0.25)]">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ring ellipses */}
        {rings.map((r, i) => (
          <ellipse
            key={`r${i}`}
            cx={300}
            cy={210}
            rx={r.rx}
            ry={r.ry}
            fill="none"
            stroke="rgba(59,130,246,0.25)"
            strokeWidth="1"
            transform={`rotate(${r.rot} 300 210)`}
          />
        ))}

        {/* Connecting lines between unique nodes */}
        {unique.map((p, i) => {
          const next = unique[(i + 1) % unique.length];
          return (
            <line
              key={`l${i}`}
              x1={p.x}
              y1={p.y}
              x2={next.x}
              y2={next.y}
              stroke="rgba(96,165,250,0.18)"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Center core */}
        <circle cx={300} cy={210} r={60} fill="url(#coreGlow)" />
        <circle cx={300} cy={210} r={10} fill="#00f2ff" className="animate-node" style={{ filter: "drop-shadow(0 0 10px #00f2ff)" }} />

        {/* Nodes */}
        {unique.map((p, i) => (
          <circle
            key={`n${i}`}
            cx={p.x}
            cy={p.y}
            r={i % 4 === 0 ? 5 : 3}
            fill={i % 3 === 0 ? "#00f2ff" : "#60a5fa"}
            className="animate-node"
            style={{ animationDelay: `${(i % 7) * 0.45}s`, filter: "drop-shadow(0 0 6px rgba(0,242,255,0.8))" }}
          />
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: React.ReactNode; text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="text-center max-w-2xl mx-auto mb-12"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00f2ff] mb-3 flex items-center justify-center gap-2">
        <span className="w-6 h-px bg-[#00f2ff]/50" /> {eyebrow} <span className="w-6 h-px bg-[#00f2ff]/50" />
      </p>
      <h2 className="text-3xl md:text-5xl font-display font-semibold text-white tracking-tight">{title}</h2>
      {text && <p className="mt-4 text-white/50 text-sm md:text-base leading-relaxed">{text}</p>}
    </motion.div>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const NAV_LINKS = [
  { label: "Home", id: "home" },
  { label: "Tasks", id: "tasks" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Events", id: "events" },
  { label: "About", id: "about" },
  { label: "Contact", id: "contact" },
];

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------
export function Landing({ onGuestLogin }: LandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const featuredTasks = useMemo(() => {
    const store = loadJSON<Task[]>("tasknova_tasks", []);
    const participants = loadJSON<{ registeredTasks?: string[] }[]>("tasknova_admin_participants", []);
    const source = store.length ? store : [
      { id: "d1", title: "Design Workshop", category: "work", priority: "normal", completed: false, dueDateText: "Aug 22" },
      { id: "d2", title: "AI Bootcamp", category: "work", priority: "high", completed: false, dueDateText: "Aug 28" },
      { id: "d3", title: "Hackathon Sprint", category: "work", priority: "high", completed: false, dueDateText: "Sep 05" },
      { id: "d4", title: "Product Pitch Night", category: "personal", priority: "normal", completed: false, dueDateText: "Sep 12" },
    ] as Task[];

    return source.slice(0, 6).map((t) => ({
      title: t.title,
      description: t.estimatedEnergy || `${t.category === "work" ? "Work objective" : "Personal objective"} · ${t.priority} priority`,
      category: t.category,
      difficulty: t.difficulty || "medium",
      deadline: t.dueDateText || "Open",
      status: t.completed ? "Completed" : "Open",
      participants: participants.filter((p) => (p.registeredTasks || []).some((rt: string) => rt.toLowerCase() === t.title.toLowerCase())).length,
    }));
  }, []);

  const handleViewTask = () => {
    if (getGuestSession()) navigateTo("participant");
    else navigateTo("login");
  };

  const navbar = (
    <nav className={`glass-strong mx-auto max-w-6xl rounded-full px-5 md:px-6 py-3 flex items-center justify-between transition-all duration-300 ${scrolled ? "glow-blue" : ""}`}>
      {/* Brand */}
      <button onClick={() => scrollToId("home")} className="flex items-center gap-2.5 cursor-pointer group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#00f2ff] flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_24px_rgba(0,242,255,0.6)] transition-shadow">
          <span className="font-display font-black text-white text-lg">N</span>
        </div>
        <span className="font-display font-bold tracking-[0.12em] text-white text-sm md:text-base">
          TASK<span className="text-gradient">NOVA</span>
        </span>
      </button>

      {/* Desktop links */}
      <div className="hidden lg:flex items-center gap-1">
        {NAV_LINKS.map((l) => (
          <button
            key={l.id}
            onClick={() => scrollToId(l.id)}
            className="px-3.5 py-2 rounded-full text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Auth button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateTo("login")}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_18px_rgba(59,130,246,0.4)] hover:shadow-[0_0_28px_rgba(0,242,255,0.5)] hover:scale-105 transition-all cursor-pointer"
        >
          <UserRound className="w-3.5 h-3.5" /> Login
        </button>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="lg:hidden p-2 rounded-full text-white/70 hover:bg-white/10 cursor-pointer"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="bg-[#040714] text-white min-h-screen relative overflow-x-hidden font-sans">
      <Background />

      {/* FLOATING NAVBAR */}
      <div className="sticky top-4 z-50 px-4">
        {navbar}

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden glass-strong rounded-3xl mt-2 p-4 space-y-1 max-w-6xl mx-auto"
          >
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => { scrollToId(l.id); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-mono uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => navigateTo("login")}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white text-sm font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              Login / Profile
            </button>
          </motion.div>
        )}
      </div>

      {/* ============================ HERO ============================ */}
      <section id="home" className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-14 md:pt-24 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left column */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[10px] font-mono uppercase tracking-[0.25em] text-white/70 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
              Futuristic Command Center
            </div>

            <h1 className="font-display font-bold tracking-tight leading-[1.02] text-5xl sm:text-6xl xl:text-7xl">
              <span className="text-white">MASTER YOUR</span>
              <br />
              <span className="text-gradient">TASKS, SHIP</span>
              <br />
              <span className="text-white">THE FUTURE.</span>
            </h1>

            <p className="mt-5 text-[13px] font-mono uppercase tracking-[0.22em] text-[#00f2ff]/80">
              ENGINEERING EXCELLENCE. <span className="inline-block w-2 h-4 bg-[#00f2ff] align-middle animate-pulse" style={{ animationDuration: "1.1s" }} />
            </p>

            <p className="mt-5 text-white/55 text-base md:text-lg leading-relaxed max-w-xl">
              TaskNova is the AI-powered task command center for modern teams and communities.
              Plan objectives, enroll in events, track progress and ship — all in one cinematic workspace.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <button
                onClick={() => scrollToId("tasks")}
                className="group flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-4 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(59,130,246,0.45)] hover:shadow-[0_0_36px_rgba(0,242,255,0.55)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Explore Tasks
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onGuestLogin}
                className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-4 rounded-full glass text-white font-mono text-xs font-bold uppercase tracking-wider hover:border-[#00f2ff]/40 hover:bg-white/10 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#00f2ff]" />
                Continue as Guest
              </button>
            </div>
          </motion.div>

          {/* Right column: network visual */}
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }}>
            <NetworkVisual />
            <div className="text-center mt-4">
              <p className="text-xs font-display font-bold tracking-[0.3em] text-white/80">TASKNOVA</p>
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/35 mt-1">COMMAND CENTER NETWORK</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================ FEATURED TASKS ============================ */}
      <section id="tasks" className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <SectionHeader
          eyebrow="Featured Tasks"
          title={<>LIVE <span className="text-gradient">MISSIONS</span></>}
          text="Hand-picked objectives open for enrollment right now. Join, focus and ship."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featuredTasks.map((t, i) => (
            <motion.div
              key={t.title + i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="glass rounded-[24px] p-6 hover-lift flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border font-semibold ${
                  t.category === "work" ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]" : "bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff]"
                }`}>
                  {t.category}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border font-semibold ${
                  t.status === "Completed" ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]" : "bg-white/5 border-white/10 text-white/60"
                }`}>
                  {t.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-display font-semibold text-white">{t.title}</h3>
                <p className="mt-1.5 text-xs text-white/45 leading-relaxed line-clamp-2">{t.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <p className="uppercase tracking-wider text-white/30 mb-0.5">Difficulty</p>
                  <p className="text-white/80 capitalize">{t.difficulty}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <p className="uppercase tracking-wider text-white/30 mb-0.5">Deadline</p>
                  <p className="text-white/80">{t.deadline}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <p className="uppercase tracking-wider text-white/30 mb-0.5">Participants</p>
                  <p className="text-white/80">{t.participants}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <p className="uppercase tracking-wider text-white/30 mb-0.5">Priority</p>
                  <p className="text-white/80 capitalize">{t.category === "work" ? "Team" : "Personal"}</p>
                </div>
              </div>

              <button
                onClick={handleViewTask}
                className="mt-auto flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#3b82f6] font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
              >
                View Task <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <SectionHeader
          eyebrow="How TaskNova Works"
          title={<>FROM IDEA TO <span className="text-gradient">LAUNCH</span></>}
          text="A simple four-step loop that turns scattered goals into shipped results."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-[24px] p-6 hover-lift relative overflow-hidden"
            >
              <span className="absolute -top-3 -right-1 font-display font-black text-[64px] text-white/[0.04] select-none">{s.step}</span>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3b82f6]/20 to-[#00f2ff]/10 border border-[#3b82f6]/25 flex items-center justify-center text-[#3b82f6] mb-4">
                {s.icon}
              </div>
              <h3 className="text-sm font-display font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-xs text-white/45 leading-relaxed">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ UPCOMING EVENTS ============================ */}
      <section id="events" className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <SectionHeader
          eyebrow="Upcoming Events"
          title={<>MARK THE <span className="text-gradient">CALENDAR</span></>}
          text="Live sessions, sprints and showcases happening across the TaskNova network."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {UPCOMING_EVENTS.map((e, i) => (
            <motion.div
              key={e.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.08 }}
              className="glass rounded-[24px] p-6 hover-lift flex items-center gap-5"
            >
              <div className="shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3b82f6]/15 to-[#00f2ff]/5 border border-[#3b82f6]/25 flex flex-col items-center justify-center glow-blue">
                <span className="text-lg font-display font-bold text-white leading-none">{e.date.split(" ")[1]}</span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#00f2ff] mt-1">{e.date.split(" ")[0]}</span>
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/25 text-[9px] font-mono uppercase tracking-wider text-[#00f2ff]">{e.tag}</span>
                  <span className="text-[10px] font-mono text-white/40">{e.time}</span>
                </div>
                <h3 className="mt-1.5 text-base font-display font-semibold text-white truncate">{e.title}</h3>
                <p className="mt-0.5 text-[11px] font-mono text-white/40 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-[#3b82f6]" /> {e.location}
                </p>
              </div>
              <button
                onClick={handleViewTask}
                className="shrink-0 p-3 rounded-full bg-white/5 hover:bg-[#3b82f6]/20 border border-white/10 hover:border-[#3b82f6]/40 text-white/60 hover:text-white transition-all cursor-pointer"
                aria-label={`View ${e.title}`}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ PLATFORM FEATURES ============================ */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <SectionHeader
          eyebrow="Platform Features"
          title={<>BUILT FOR <span className="text-gradient">MOMENTUM</span></>}
          text="Everything you need to plan, focus and finish — engineered into one command center."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="glass rounded-[24px] p-6 hover-lift flex gap-4"
            >
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/25 flex items-center justify-center text-[#3b82f6]">
                {f.icon}
              </div>
              <div>
                <h3 className="text-sm font-display font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-xs text-white/45 leading-relaxed">{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ WHY TASKNOVA ============================ */}
      <section id="about" className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="glass rounded-[32px] p-8 md:p-14 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#3b82f6] opacity-10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#00f2ff] opacity-8 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#00f2ff] mb-3 flex items-center gap-2">
                <span className="w-6 h-px bg-[#00f2ff]/50" /> Why TaskNova
              </p>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">
                A COMMAND CENTER FOR <span className="text-gradient">EVERY BUILDER</span>
              </h2>
              <p className="mt-5 text-white/50 text-sm md:text-base leading-relaxed max-w-lg">
                TaskNova fuses AI-driven planning with a cinematic workspace. Whether you're organizing a
                community event or shipping personal goals, the platform keeps you focused, on schedule and
                in flow — with the polish of a premium product and the soul of a hacker community.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["AI-Powered", "Zero Friction", "Community First", "Open to Build"].map((chip) => (
                  <span key={chip} className="px-4 py-2 rounded-full glass text-[10px] font-mono uppercase tracking-wider text-[#00f2ff]">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {WHY_STATS.map((s) => (
                <div key={s.label} className="glass rounded-[24px] p-6 text-center animate-glow">
                  <p className="text-3xl md:text-4xl font-display font-bold text-gradient">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-white/45">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section id="cta" className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 py-16 md:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
        >
          <Cpu className="w-10 h-10 text-[#00f2ff] mx-auto mb-6 animate-node" />
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
            READY TO <span className="text-gradient">LAUNCH</span>?
          </h2>
          <p className="mt-4 text-white/50 text-sm md:text-base max-w-xl mx-auto">
            Jump into the command center in seconds. No sign-up, no friction — just build.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3">
            <button
              onClick={onGuestLogin}
              className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_28px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(0,242,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Continue as Guest
            </button>
            <button
              onClick={() => navigateTo("login")}
              className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 rounded-full glass text-white font-mono text-xs font-bold uppercase tracking-wider hover:border-[#3b82f6]/40 hover:bg-white/10 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#3b82f6]" /> Admin Login
            </button>
          </div>
        </motion.div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer id="contact" className="relative z-10 border-t border-white/5 mt-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3b82f6] to-[#00f2ff] flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.5)]">
                <span className="font-display font-black text-white text-lg">N</span>
              </div>
              <span className="font-display font-bold tracking-[0.12em] text-white">TASK<span className="text-gradient">NOVA</span></span>
            </div>
            <p className="mt-4 text-xs text-white/40 leading-relaxed max-w-sm">
              The AI-powered command center for tasks, events and communities.
              Plan. Focus. Ship.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30 mb-4">Navigate</p>
            <div className="space-y-2.5">
              {NAV_LINKS.map((l) => (
                <button key={l.id} onClick={() => scrollToId(l.id)} className="block text-xs text-white/55 hover:text-[#00f2ff] transition-colors cursor-pointer">
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30 mb-4">Connect</p>
            <div className="space-y-2.5 text-xs text-white/55">
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#3b82f6]" /> admin@tasknova.in</p>
              <p className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-[#3b82f6]" /> tasknova.command</p>
              <p className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-[#3b82f6]" /> Community Network</p>
            </div>
            <button
              onClick={onGuestLogin}
              className="mt-5 px-5 py-2.5 rounded-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#3b82f6] font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="border-t border-white/5 py-6">
          <p className="text-center text-[10px] font-mono uppercase tracking-[0.2em] text-white/25">
            <span className="flex items-center justify-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#3b82f6]" />
              PROTECTED BY MAINFRAME SYSTEMS · TASKNOVA © 2026
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
