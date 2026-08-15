import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  LogOut,
  Search,
  Plus,
  Trash2,
  Check,
  Activity,
  TrendingUp,
  Target,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  AlertCircle,
  X,
  BarChart3,
  Settings as SettingsIcon,
  Pencil,
  Eye,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import { Task } from "../types";
import { ADMIN_EMAIL } from "../utils/auth";
import { AnimatedCounter } from "./ui/AnimatedCounter";
import { Background } from "./ui/Background";

// ---------------------------------------------------------------------------
// Types & demo seed data (localStorage-backed for this prototype)
// ---------------------------------------------------------------------------
interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "registered" | "pending" | "completed";
  registeredTasks: string[];
  registeredAt: string;
}

interface Submission {
  id: string;
  participantName: string;
  taskTitle: string;
  submittedAt: string;
  status: "submitted" | "reviewed";
}

const SEED_PARTICIPANTS: Participant[] = [
  { id: "p1", name: "Aarav Sharma", email: "aarav.sharma@gmail.com", phone: "+91 98123 45670", status: "registered", registeredTasks: ["Design Workshop", "Hackathon Sprint"], registeredAt: "12 Aug 2026" },
  { id: "p2", name: "Priya Patel", email: "priya.patel@gmail.com", phone: "+91 98220 11223", status: "registered", registeredTasks: ["AI Bootcamp"], registeredAt: "11 Aug 2026" },
  { id: "p3", name: "Rohan Mehta", email: "rohan.mehta@gmail.com", phone: "+91 99670 88990", status: "pending", registeredTasks: [], registeredAt: "10 Aug 2026" },
  { id: "p4", name: "Sneha Iyer", email: "sneha.iyer@gmail.com", phone: "+91 90040 55667", status: "completed", registeredTasks: ["Product Pitch Night"], registeredAt: "08 Aug 2026" },
  { id: "p5", name: "Kabir Khan", email: "kabir.khan@gmail.com", phone: "+91 98765 43210", status: "registered", registeredTasks: ["AI Bootcamp", "Product Pitch Night"], registeredAt: "07 Aug 2026" },
];

const SEED_SUBMISSIONS: Submission[] = [
  { id: "s1", participantName: "Sneha Iyer", taskTitle: "Product Pitch Night", submittedAt: "13 Aug 2026, 18:42", status: "reviewed" },
  { id: "s2", participantName: "Kabir Khan", taskTitle: "AI Bootcamp", submittedAt: "13 Aug 2026, 11:05", status: "submitted" },
  { id: "s3", participantName: "Aarav Sharma", taskTitle: "Design Workshop", submittedAt: "12 Aug 2026, 20:17", status: "submitted" },
];

const STORAGE = {
  participants: "tasknova_admin_participants",
  submissions: "tasknova_admin_submissions",
};

type AdminTab = "overview" | "participants" | "tasks" | "registrations" | "analytics" | "settings";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    registered: "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]",
    pending: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    completed: "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]",
    submitted: "bg-[#00f2ff]/10 border-[#00f2ff]/30 text-[#00f2ff]",
    reviewed: "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border font-semibold ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, accent, animate = false }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean; animate?: boolean }) {
  return (
    <div className={`glass rounded-[24px] p-5 flex items-center gap-4 hover-lift ${accent ? "glow-cyan" : "glow-blue"}`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${accent ? "bg-[#00f2ff]/10 border border-[#00f2ff]/25" : "bg-[#3b82f6]/10 border border-[#3b82f6]/20"}`}>
        <span className={accent ? "text-[#00f2ff]" : "text-[#3b82f6]"}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-mono uppercase tracking-widest text-white/40">{label}</p>
        <p className="text-2xl font-display font-medium text-white tabular-nums">
          {animate ? <AnimatedCounter value={Number(value)} /> : value}
        </p>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="text-xs uppercase font-mono tracking-[0.2em] text-[#3b82f6] font-semibold">{title}</h3>
      <h4 className="text-xl md:text-2xl font-display font-medium text-white mt-1">{subtitle}</h4>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Dashboard
// ---------------------------------------------------------------------------
export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [participants, setParticipants] = useState<Participant[]>(() => loadJSON(STORAGE.participants, SEED_PARTICIPANTS));
  const [submissions, setSubmissions] = useState<Submission[]>(() => loadJSON(STORAGE.submissions, SEED_SUBMISSIONS));
  const [tasks, setTasks] = useState<Task[]>(() => loadJSON("tasknova_tasks", [] as Task[]));

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Participant["status"]>("all");

  // Add participant modal state
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Add task modal state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<"work" | "personal">("work");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "normal" | "system">("normal");
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "work" as "work" | "personal", priority: "normal" as "high" | "normal" | "system", difficulty: "medium" as "easy" | "medium" | "hard", dueDateText: "", completed: false });

  // Participant detail modal state
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);

  // Persist on change
  useEffect(() => saveJSON(STORAGE.participants, participants), [participants]);
  useEffect(() => saveJSON(STORAGE.submissions, submissions), [submissions]);
  useEffect(() => saveJSON("tasknova_tasks", tasks), [tasks]);

  // Derived stats
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const openEvents = tasks.filter(t => !t.completed).length;
    return {
      totalParticipants: participants.length,
      registeredParticipants: participants.filter(p => p.status === "registered").length,
      totalTasks: tasks.length,
      completedTasks,
      openEvents,
      totalSubmissions: submissions.length,
      pendingSubmissions: submissions.filter(s => s.status === "submitted").length,
    };
  }, [participants, tasks, submissions]);

  const filteredParticipants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return participants.filter(p => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [participants, searchQuery, statusFilter]);

  // Handlers
  const addParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    const participant: Participant = {
      id: "p_" + Date.now(),
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || "—",
      status: "registered",
      registeredTasks: [],
      registeredAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    setParticipants(prev => [participant, ...prev]);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setShowAddParticipant(false);
  };

  const deleteParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: "admin_" + Date.now(),
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      priority: newTaskPriority,
      difficulty: newTaskDifficulty,
      completed: false,
      dueDateText: "Open Event",
    };
    setTasks(prev => [task, ...prev]);
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  const openEditTask = (task: Task) => {
    setEditForm({
      title: task.title,
      category: task.category,
      priority: task.priority,
      difficulty: task.difficulty || "medium",
      dueDateText: task.dueDateText || "",
      completed: task.completed,
    });
    setEditingTask(task);
  };

  const saveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editForm.title.trim()) return;
    setTasks(prev => prev.map(t =>
      t.id === editingTask.id
        ? { ...t, ...editForm, title: editForm.title.trim(), dueDateText: editForm.dueDateText.trim() || "Open Event" }
        : t
    ));
    setEditingTask(null);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const reviewSubmission = (id: string) => {
    setSubmissions(prev => prev.map(s => (s.id === id ? { ...s, status: "reviewed" } : s)));
  };

  const navItems: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "participants", label: "Participants", icon: <Users className="w-4 h-4" /> },
    { key: "tasks", label: "Tasks / Events", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "registrations", label: "Registrations", icon: <FileText className="w-4 h-4" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "settings", label: "Settings", icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-[#040714] text-white min-h-screen relative overflow-x-hidden font-sans select-none">
      <Background intensity="subtle" />

      {/* HEADER */}
      <header className="sticky top-0 w-full z-40 glass-strong border-b border-white/5 flex justify-between items-center px-5 md:px-10 h-16 md:h-18 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-display font-bold tracking-wide text-white">
              Task<span className="text-[#3b82f6]">Nova</span> <span className="text-[10px] font-mono text-[#00f2ff] align-middle ml-1 border border-[#00f2ff]/30 rounded-full px-2 py-0.5">ADMIN</span>
            </h1>
            <p className="text-[9px] font-mono uppercase text-white/40 tracking-wider font-semibold hidden md:block">Command Center · {ADMIN_EMAIL}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-950/25 hover:bg-red-950/45 border border-red-500/30 text-red-400 text-[10px] font-mono rounded-xl transition-all cursor-pointer flex items-center gap-2 font-bold uppercase tracking-wider"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* MOBILE TAB BAR */}
      <div className="md:hidden sticky top-16 z-30 glass-strong border-b border-white/5 flex overflow-x-auto px-2 py-2 gap-1">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer font-semibold ${
              tab === item.key ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30" : "text-white/40 hover:text-white border border-transparent"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative z-10 flex max-w-7xl mx-auto">
        {/* SIDEBAR (desktop) */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 px-4 py-8 gap-1">
          <p className="text-[9px] font-mono uppercase tracking-widest text-white/25 px-3 pb-2">Admin Modules</p>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer font-semibold ${
                tab === item.key ? "bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/25" : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <div className="mt-auto pt-8">
            <div className="p-4 bg-[#ffffff03] border border-white/10 rounded-[20px]">
              <p className="text-[9px] font-mono uppercase tracking-widest text-[#00f2ff] mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> System Status
              </p>
              <p className="text-[10px] text-white/50 font-mono leading-relaxed">
                All modules operational. {stats.totalParticipants} participants synced.
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-grow min-w-0 px-5 md:px-8 py-8">
          <AnimatePresence mode="wait">
            {/* ================= OVERVIEW ================= */}
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-8">
                <SectionHeading title="Admin Overview" subtitle="Command Center Statistics" />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={<Users className="w-5 h-5" />} label="Total Participants" value={stats.totalParticipants} animate />
                  <StatCard icon={<Activity className="w-5 h-5" />} label="Active Registrations" value={stats.registeredParticipants} accent animate />
                  <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Open Tasks / Events" value={stats.openEvents} animate />
                  <StatCard icon={<FileText className="w-5 h-5" />} label="Submissions" value={stats.pendingSubmissions} animate />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Task completion */}
                  <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 rounded-[24px] p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold">Task Completion</h5>
                      <span className="text-xs font-mono text-[#3b82f6]">
                        {stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-4">
                      <div
                        className="h-full bg-gradient-to-r from-[#3b82f6] to-[#00f2ff] rounded-full transition-all duration-500"
                        style={{ width: `${stats.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-mono text-white/40">
                      {stats.completedTasks} of {stats.totalTasks} objectives completed across all participants.
                    </p>
                  </div>

                  {/* Recent submissions */}
                  <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 rounded-[24px] p-6">
                    <h5 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold mb-4">Recent Registrations</h5>
                    <div className="space-y-3">
                      {submissions.slice(0, 3).map(s => (
                        <div key={s.id} className="flex items-center justify-between gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                          <div className="min-w-0">
                            <p className="text-xs text-white font-medium truncate">{s.participantName}</p>
                            <p className="text-[10px] font-mono text-white/40 truncate">{s.taskTitle} · {s.submittedAt}</p>
                          </div>
                          <StatusBadge status={s.status} />
                        </div>
                      ))}
                      {submissions.length === 0 && <p className="text-[11px] font-mono text-white/30">No submissions yet.</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= PARTICIPANTS ================= */}
            {tab === "participants" && (
              <motion.div key="participants" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <SectionHeading title="Manage Participants" subtitle="Search, filter & manage participants" />
                  <button
                    onClick={() => setShowAddParticipant(true)}
                    className="px-4 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer font-bold uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" /> Add Participant
                  </button>
                </div>

                {/* Search + filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email or phone..."
                      className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/40 focus:outline-none rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/20"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["all", "registered", "pending", "completed"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-3.5 py-2 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-semibold border ${
                          statusFilter === f ? "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30" : "bg-white/5 text-white/40 border-white/10 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table (desktop) / Cards (mobile) */}
                <div className="glass rounded-[24px] overflow-hidden">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left min-w-[640px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Participant", "Contact", "Status", "Registered Tasks", "Date", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-white/35 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParticipants.map(p => (
                          <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/25 flex items-center justify-center shrink-0">
                                  <UserRound className="w-4 h-4 text-[#3b82f6]" />
                                </div>
                                <span className="text-xs font-semibold text-white">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-[11px] text-white/70 flex items-center gap-1.5"><Mail className="w-3 h-3 text-white/30" />{p.email}</p>
                              <p className="text-[10px] font-mono text-white/40 flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3 text-white/30" />{p.phone}</p>
                            </td>
                            <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {p.registeredTasks.length ? p.registeredTasks.map(t => (
                                  <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-white/60">{t}</span>
                                )) : <span className="text-[10px] font-mono text-white/30">None</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-[11px] font-mono text-white/50">{p.registeredAt}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setViewingParticipant(p)}
                                  title="View details"
                                  className="p-2 rounded-lg text-white/30 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteParticipant(p.id)}
                                  title="Remove participant"
                                  className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-950/25 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredParticipants.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-[11px] font-mono text-white/30">No participants match your search.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: participant cards */}
                  <div className="md:hidden divide-y divide-white/5">
                    {filteredParticipants.map(p => (
                      <div key={p.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/25 flex items-center justify-center shrink-0">
                              <UserRound className="w-5 h-5 text-[#3b82f6]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                              <p className="text-[10px] font-mono text-white/40 truncate">{p.email}</p>
                            </div>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.registeredTasks.length ? p.registeredTasks.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-white/60">{t}</span>
                          )) : <span className="text-[10px] font-mono text-white/30">No registrations</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-white/40 truncate">{p.phone} · {p.registeredAt}</span>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => setViewingParticipant(p)} title="View details" className="p-2.5 rounded-lg text-white/40 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all cursor-pointer">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteParticipant(p.id)} title="Remove participant" className="p-2.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-950/25 transition-all cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredParticipants.length === 0 && (
                      <p className="p-6 text-center text-[11px] font-mono text-white/30">No participants match your search.</p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] font-mono text-white/30">Showing {filteredParticipants.length} of {participants.length} participants.</p>
              </motion.div>
            )}

            {/* ================= TASKS / EVENTS ================= */}
            {tab === "tasks" && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <SectionHeading title="Manage Tasks / Events" subtitle="Create & maintain participant objectives" />
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="px-4 py-2.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/30 text-[#00f2ff] font-mono text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-bold uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" /> New Task / Event
                  </button>
                </div>

                <div className="bg-[#ffffff03] backdrop-blur-md border border-white/10 rounded-[24px] p-2 divide-y divide-white/5">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors rounded-2xl">
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          t.completed ? "bg-[#10b981] border-[#10b981]" : "border-white/25 hover:border-[#3b82f6]"
                        }`}
                      >
                        {t.completed && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div className="flex-grow min-w-0">
                        <p className={`text-sm font-medium truncate ${t.completed ? "text-white/35 line-through" : "text-white"}`}>{t.title}</p>
                        <p className="text-[10px] font-mono text-white/40 mt-0.5 uppercase tracking-wide">
                          {t.category} · {t.priority} priority · {t.dueDateText || "Open"} ·{" "}
                          <span className={t.difficulty === "hard" ? "text-red-400" : t.difficulty === "easy" ? "text-[#10b981]" : "text-[#00f2ff]"}>
                            {t.difficulty || "medium"} difficulty
                          </span>
                        </p>
                        <p className="text-[9px] font-mono text-white/30 mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#3b82f6]" /> {participants.filter(p => (p.registeredTasks || []).includes(t.title)).length} registered
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border font-semibold ${t.completed ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]" : "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]"}`}>
                        {t.completed ? "Completed" : "Open"}
                      </span>
                      <button
                        onClick={() => openEditTask(t)}
                        title="Edit task"
                        className="p-2 rounded-lg text-white/30 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(t.id)}
                        title="Delete task"
                        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-950/25 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="p-10 text-center">
                      <Target className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-[11px] font-mono text-white/30">No tasks or events yet. Create one to get started.</p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-mono text-white/30">Shared with the participant dashboard — changes sync instantly.</p>
              </motion.div>
            )}

            {/* ================= REGISTRATIONS ================= */}
            {tab === "registrations" && (
              <motion.div key="registrations" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                <SectionHeading title="Registrations & Submissions" subtitle="Review participant submissions" />

                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <StatCard icon={<FileText className="w-5 h-5" />} label="Total Submissions" value={stats.totalSubmissions} />
                  <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Pending Review" value={stats.pendingSubmissions} accent />
                </div>

                <div className="glass rounded-[24px] overflow-hidden">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left min-w-[560px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Participant", "Task / Event", "Submitted At", "Status", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-[9px] font-mono uppercase tracking-widest text-white/35 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map(s => (
                          <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3.5 text-xs font-semibold text-white">{s.participantName}</td>
                            <td className="px-4 py-3.5 text-xs text-white/70">{s.taskTitle}</td>
                            <td className="px-4 py-3.5 text-[11px] font-mono text-white/50">{s.submittedAt}</td>
                            <td className="px-4 py-3.5"><StatusBadge status={s.status} /></td>
                            <td className="px-4 py-3.5">
                              {s.status === "submitted" ? (
                                <button
                                  onClick={() => reviewSubmission(s.id)}
                                  className="px-3 py-1.5 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#3b82f6] text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer font-bold"
                                >
                                  Mark Reviewed
                                </button>
                              ) : (
                                <span className="text-[10px] font-mono text-[#10b981] flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Reviewed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {submissions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-[11px] font-mono text-white/30">No submissions yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: submission cards */}
                  <div className="md:hidden divide-y divide-white/5">
                    {submissions.map(s => (
                      <div key={s.id} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{s.participantName}</p>
                            <p className="text-[11px] text-white/60 truncate mt-0.5">{s.taskTitle}</p>
                          </div>
                          <StatusBadge status={s.status} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-white/40">{s.submittedAt}</span>
                          {s.status === "submitted" ? (
                            <button
                              onClick={() => reviewSubmission(s.id)}
                              className="px-3.5 py-2 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#3b82f6] text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer font-bold"
                            >
                              Mark Reviewed
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-[#10b981] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Reviewed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {submissions.length === 0 && (
                      <p className="p-6 text-center text-[11px] font-mono text-white/30">No submissions yet.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= ANALYTICS ================= */}
            {tab === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                <SectionHeading title="Analytics" subtitle="Performance Insights" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tasks by category */}
                  <div className="glass rounded-[24px] p-6">
                    <h5 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold mb-5">Tasks by Category</h5>
                    {([
                      { label: "Work", count: tasks.filter(t => t.category === "work").length, color: "from-[#3b82f6] to-[#00f2ff]" },
                      { label: "Personal", count: tasks.filter(t => t.category === "personal").length, color: "from-[#6366f1] to-[#3b82f6]" },
                    ] as const).map(row => (
                      <div key={row.label} className="mb-4">
                        <div className="flex justify-between text-[10px] font-mono text-white/50 mb-1.5">
                          <span className="uppercase tracking-wider">{row.label}</span>
                          <span className="text-white">{row.count}</span>
                        </div>
                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all duration-700`} style={{ width: `${tasks.length ? (row.count / tasks.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tasks by priority */}
                  <div className="glass rounded-[24px] p-6">
                    <h5 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold mb-5">Tasks by Priority</h5>
                    {([
                      { label: "High", count: tasks.filter(t => t.priority === "high").length, color: "from-red-500 to-[#3b82f6]" },
                      { label: "Normal", count: tasks.filter(t => t.priority === "normal").length, color: "from-[#3b82f6] to-[#00f2ff]" },
                      { label: "System", count: tasks.filter(t => t.priority === "system").length, color: "from-[#6366f1] to-[#a5b4fc]" },
                    ] as const).map(row => (
                      <div key={row.label} className="mb-4">
                        <div className="flex justify-between text-[10px] font-mono text-white/50 mb-1.5">
                          <span className="uppercase tracking-wider">{row.label}</span>
                          <span className="text-white">{row.count}</span>
                        </div>
                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all duration-700`} style={{ width: `${tasks.length ? (row.count / tasks.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Participants by status */}
                  <div className="glass rounded-[24px] p-6">
                    <h5 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold mb-5">Participants by Status</h5>
                    {(["registered", "pending", "completed"] as const).map(status => {
                      const count = participants.filter(p => p.status === status).length;
                      return (
                        <div key={status} className="mb-4">
                          <div className="flex justify-between text-[10px] font-mono text-white/50 mb-1.5">
                            <span className="uppercase tracking-wider">{status}</span>
                            <span className="text-white">{count}</span>
                          </div>
                          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <div className={`h-full rounded-full transition-all duration-700 ${status === "registered" ? "bg-gradient-to-r from-[#10b981] to-[#00f2ff]" : status === "pending" ? "bg-gradient-to-r from-amber-500 to-[#3b82f6]" : "bg-gradient-to-r from-[#3b82f6] to-[#6366f1]"}`} style={{ width: `${participants.length ? (count / participants.length) * 100 : 0}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weekly activity */}
                  <div className="glass rounded-[24px] p-6">
                    <h5 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold mb-5">Weekly Activity</h5>
                    <div className="flex items-end justify-between gap-2 h-40">
                      {[{ d: "Mon", v: 42 }, { d: "Tue", v: 65 }, { d: "Wed", v: 38 }, { d: "Thu", v: 80 }, { d: "Fri", v: 56 }, { d: "Sat", v: 72 }, { d: "Sun", v: 48 }].map(b => (
                        <div key={b.d} className="flex flex-col items-center gap-1.5 flex-1">
                          <div className="w-full rounded-t-lg bg-gradient-to-t from-[#3b82f6] to-[#00f2ff] transition-all duration-700" style={{ height: `${b.v}%`, opacity: 0.7, boxShadow: "0 0 12px rgba(0,242,255,0.25)" }} />
                          <span className="text-[9px] font-mono text-white/35">{b.d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= SETTINGS ================= */}
            {tab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="space-y-6">
                <SectionHeading title="Settings" subtitle="Administration & Data" />

                <div className="glass rounded-[24px] p-6 space-y-6 max-w-2xl">
                  <div>
                    <h5 className="text-xs uppercase font-mono text-[#3b82f6] tracking-widest font-semibold mb-3">Admin Profile</h5>
                    <div className="space-y-2 text-xs text-white/60">
                      <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#3b82f6]" /> {ADMIN_EMAIL}</p>
                      <p className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" /> Role: Super Administrator</p>
                      <p className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-[#00f2ff]" /> Access: Full command center control</p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-white/5">
                    <h5 className="text-xs uppercase font-mono text-[#3b82f6] tracking-widest font-semibold mb-3">Data Management</h5>
                    <p className="text-[11px] font-mono text-white/40 mb-4">Reset prototype stores back to seed data, or clear tasks entirely.</p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setParticipants(SEED_PARTICIPANTS)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 text-[#3b82f6] font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reset Participants
                      </button>
                      <button
                        onClick={() => setSubmissions(SEED_SUBMISSIONS)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/30 text-[#00f2ff] font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reset Submissions
                      </button>
                      <button
                        onClick={() => setTasks([])}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-950/25 hover:bg-red-950/45 border border-red-500/30 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear All Tasks
                      </button>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-white/5">
                    <h5 className="text-xs uppercase font-mono text-[#3b82f6] tracking-widest font-semibold mb-3">Security Note</h5>
                    <p className="text-[11px] font-mono text-white/40 leading-relaxed">
                      Admin credentials are validated client-side in this prototype build. The session structure is ready
                      for Firebase-based admin authorization (custom claims / Admin SDK) in production.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* FLOATING ACTION BUTTON: create task (mobile, Tasks tab) */}
      {tab === 'tasks' && (
        <button
          onClick={() => setShowAddTask(true)}
          aria-label="Create task"
          className="md:hidden fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white flex items-center justify-center shadow-[0_0_24px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/10"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ADD PARTICIPANT MODAL */}
      <AnimatePresence>
        {showAddParticipant && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0c0e12] border border-white/10 rounded-[24px] p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-display">Add Participant</h4>
                <button onClick={() => setShowAddParticipant(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={addParticipant} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Full Name</label>
                  <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Ananya Singh" className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-white/20" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Email</label>
                  <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. ananya@gmail.com" className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-white/20" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Phone (optional)</label>
                  <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="e.g. +91 98xxxxxx" className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-white/20" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddParticipant(false)} className="flex-grow py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 font-mono text-xs rounded-xl transition-all cursor-pointer">CANCEL</button>
                  <button type="submit" className="flex-grow py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-xs rounded-xl shadow-sm transition-all cursor-pointer font-semibold">ADD</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD TASK MODAL */}
      <AnimatePresence>
        {showAddTask && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0c0e12] border border-white/10 rounded-[24px] p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-display">New Task / Event</h4>
                <button onClick={() => setShowAddTask(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={addTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Title</label>
                  <input type="text" required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="e.g. Design Workshop" className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-white/20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Category</label>
                    <select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value as any)} className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white">
                      <option value="work" className="bg-[#0c0e12]">Work</option>
                      <option value="personal" className="bg-[#0c0e12]">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Priority</label>
                    <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as any)} className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white">
                      <option value="normal" className="bg-[#0c0e12]">Normal</option>
                      <option value="high" className="bg-[#0c0e12]">High</option>
                      <option value="system" className="bg-[#0c0e12]">System</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Difficulty</label>
                  <select value={newTaskDifficulty} onChange={e => setNewTaskDifficulty(e.target.value as any)} className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white">
                    <option value="easy" className="bg-[#0c0e12]">Easy</option>
                    <option value="medium" className="bg-[#0c0e12]">Medium</option>
                    <option value="hard" className="bg-[#0c0e12]">Hard</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddTask(false)} className="flex-grow py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 font-mono text-xs rounded-xl transition-all cursor-pointer">CANCEL</button>
                  <button type="submit" className="flex-grow py-2.5 bg-[#00f2ff]/15 hover:bg-[#00f2ff]/25 border border-[#00f2ff]/30 text-[#00f2ff] font-mono text-xs rounded-xl transition-all cursor-pointer font-semibold">CREATE</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TASK MODAL */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0c0e12] border border-white/10 rounded-[24px] p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-display">Edit Task / Event</h4>
                <button onClick={() => setEditingTask(null)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={saveEditTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Title</label>
                  <input type="text" required value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Category</label>
                    <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value as any }))} className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white">
                      <option value="work" className="bg-[#0c0e12]">Work</option>
                      <option value="personal" className="bg-[#0c0e12]">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Priority</label>
                    <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as any }))} className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white">
                      <option value="normal" className="bg-[#0c0e12]">Normal</option>
                      <option value="high" className="bg-[#0c0e12]">High</option>
                      <option value="system" className="bg-[#0c0e12]">System</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Difficulty</label>
                    <select value={editForm.difficulty} onChange={e => setEditForm(f => ({ ...f, difficulty: e.target.value as any }))} className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white">
                      <option value="easy" className="bg-[#0c0e12]">Easy</option>
                      <option value="medium" className="bg-[#0c0e12]">Medium</option>
                      <option value="hard" className="bg-[#0c0e12]">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Deadline</label>
                    <input type="text" value={editForm.dueDateText} onChange={e => setEditForm(f => ({ ...f, dueDateText: e.target.value }))} placeholder="e.g. Sep 05" className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2 px-3 text-xs text-white placeholder-white/20" />
                  </div>
                </div>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                  <input type="checkbox" checked={editForm.completed} onChange={e => setEditForm(f => ({ ...f, completed: e.target.checked }))} className="w-4 h-4 accent-[#10b981]" />
                  <span className="text-xs text-white/70 font-medium">Mark as completed</span>
                </label>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setEditingTask(null)} className="flex-grow py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 font-mono text-xs rounded-xl transition-all cursor-pointer">CANCEL</button>
                  <button type="submit" className="flex-grow py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-xs rounded-xl shadow-sm transition-all cursor-pointer font-semibold">SAVE</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PARTICIPANT DETAIL MODAL */}
      <AnimatePresence>
        {viewingParticipant && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0c0e12] border border-white/10 rounded-[24px] p-6 w-full max-w-sm space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/25 flex items-center justify-center shrink-0">
                    <UserRound className="w-6 h-6 text-[#3b82f6]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{viewingParticipant.name}</h4>
                    <StatusBadge status={viewingParticipant.status} />
                  </div>
                </div>
                <button onClick={() => setViewingParticipant(null)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-white/60">
                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#3b82f6]" /> {viewingParticipant.email}</p>
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#3b82f6]" /> {viewingParticipant.phone}</p>
                <p className="flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5 text-[#00f2ff]" /> Registered {viewingParticipant.registeredAt}</p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-semibold mb-3">Registered Tasks</h5>
                <div className="flex flex-wrap gap-2">
                  {viewingParticipant.registeredTasks.length ? viewingParticipant.registeredTasks.map(t => (
                    <span key={t} className="px-3 py-1.5 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/25 text-[#3b82f6] text-[10px] font-mono">{t}</span>
                  )) : (
                    <p className="text-[11px] font-mono text-white/30">No registered tasks yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
