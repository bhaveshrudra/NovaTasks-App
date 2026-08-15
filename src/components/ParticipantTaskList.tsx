import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Check, Clock, Trash2 } from "lucide-react";
import { Task } from "../types";

interface ParticipantTaskListProps {
  tasks: Task[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

/**
 * Participant task checklist: search bar + Work / Personal lists.
 * Used by the "My Tasks" dashboard tab (and the Home feed).
 * Touch-friendly rows with 44px+ tap targets for mobile.
 */
export function ParticipantTaskList({ tasks, searchQuery, onSearchChange, onToggle, onDelete }: ParticipantTaskListProps) {
  const filteredTasks = searchQuery.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks;

  const renderTaskRow = (t: Task) => {
    let priorityBorderClass = '';
    if (!t.completed) {
      if (t.priority === 'high') {
        priorityBorderClass = 'bg-red-950/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-[pulse_2s_infinite] hover:border-red-400';
      } else if (t.priority === 'system') {
        priorityBorderClass = 'bg-[#00f2ff]/5 border-[#00f2ff]/30 shadow-[0_0_12px_rgba(0,242,255,0.15)] hover:border-[#00f2ff]/60';
      } else {
        priorityBorderClass = 'bg-[#3b82f6]/5 border-[#3b82f6]/30 shadow-[0_0_10px_rgba(59,130,246,0.15)] hover:border-[#3b82f6]/60';
      }
    } else {
      priorityBorderClass = 'bg-[#ffffff01] border-white/5 opacity-40 line-through';
    }

    return (
      <motion.div
        key={t.id}
        layout
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{
          opacity: t.completed ? 0.45 : 1,
          scale: 1,
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
        exit={{
          opacity: 0,
          scale: 0.92,
          x: -15,
          transition: { duration: 0.25 },
        }}
        whileTap={{ scale: 0.995 }}
        className={`p-4 rounded-xl flex items-center justify-between gap-4 transition-all duration-300 border backdrop-blur-md ${priorityBorderClass}`}
      >
        <div className="flex items-center gap-3.5 flex-grow min-w-0">
          <button
            onClick={() => onToggle(t.id)}
            aria-label={t.completed ? `Mark ${t.title} as pending` : `Complete ${t.title}`}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all cursor-pointer relative overflow-visible shrink-0 active:scale-90 ${
              t.completed
                ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-[#3b82f6]'
                : 'border-[#3b82f6]/40 hover:border-[#3b82f6] bg-transparent text-transparent'
            }`}
          >
            {t.completed ? (
              <motion.div initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 450, damping: 13 }}>
                <Check className="w-5 h-5" />
              </motion.div>
            ) : (
              <Check className="w-5 h-5" />
            )}

            {t.completed && (
              <motion.span
                className="absolute inset-0 rounded-lg border-2 border-[#00f2ff] opacity-0 pointer-events-none"
                initial={{ scale: 0.8, opacity: 0.9 }}
                animate={{ scale: 2.3, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            )}
          </button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{t.title}</p>
            <div className="flex items-center gap-2.5 mt-1 text-[11px] font-mono text-white/40 flex-wrap">
              {t.priority === 'high' ? (
                <span className="text-red-400 font-bold flex items-center gap-1 bg-red-950/40 px-2 py-0.5 rounded-full border border-red-500/20 text-[9px] uppercase tracking-wider">
                  ❗ High Priority
                </span>
              ) : t.priority === 'system' ? (
                <span className="text-[#00f2ff] font-bold flex items-center gap-1 bg-[#00f2ff]/10 px-2 py-0.5 rounded-full border border-[#00f2ff]/20 text-[9px] uppercase tracking-wider">
                  ⚡ System Sync
                </span>
              ) : (
                <span className="text-blue-400 font-bold flex items-center gap-1 bg-[#3b82f6]/10 px-2 py-0.5 rounded-full border border-[#3b82f6]/20 text-[9px] uppercase tracking-wider">
                  🔹 Normal
                </span>
              )}
              {t.dueDateText && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t.dueDateText}
                </span>
              )}
              {t.estimatedEnergy && (
                <span className="hidden sm:inline">• {t.estimatedEnergy}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-8 rounded-full blur-[1px] ${
            t.priority === 'high' ? 'bg-red-500' : t.priority === 'system' ? 'bg-[#00f2ff]' : 'bg-[#3b82f6]'
          }`} />

          <button
            onClick={() => onDelete(t.id)}
            aria-label={`Delete ${t.title}`}
            className="p-2.5 text-white/25 hover:text-red-400 rounded-xl transition-all cursor-pointer active:scale-90"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search commander matrix..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/40 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-all placeholder-white/20"
          />
        </div>

        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="text-xs font-mono text-[#3b82f6] hover:underline cursor-pointer shrink-0 px-3 py-3"
          >
            Reset
          </button>
        )}
      </div>

      {/* Category: WORK list */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase text-white/50 tracking-widest pl-2 flex items-center gap-2 border-l border-[#3b82f6]">
          Work Operations
        </h4>
        <div className="space-y-2 relative">
          <AnimatePresence mode="popLayout">
            {filteredTasks.filter(t => t.category === 'work').length === 0 ? (
              <motion.p key="empty-work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-white/20 italic pl-3">
                No active work items calibrated.
              </motion.p>
            ) : (
              filteredTasks.filter(t => t.category === 'work').map(renderTaskRow)
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Category: PERSONAL list */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase text-white/50 tracking-widest pl-2 flex items-center gap-2 border-l border-[#3b82f6]">
          Personal Objectives
        </h4>
        <div className="space-y-2 relative">
          <AnimatePresence mode="popLayout">
            {filteredTasks.filter(t => t.category === 'personal').length === 0 ? (
              <motion.p key="empty-personal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-white/20 italic pl-3">
                No active personal items calibrated.
              </motion.p>
            ) : (
              filteredTasks.filter(t => t.category === 'personal').map(renderTaskRow)
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
