import React from "react";

interface BackgroundProps {
  /** 'full' shows particles + grid + orbs; 'subtle' keeps only gradient + faint grid */
  intensity?: "full" | "subtle";
  className?: string;
}

const PARTICLES = [
  { top: "12%", left: "8%", size: 4, delay: 0, duration: 7, color: "#00f2ff" },
  { top: "22%", left: "82%", size: 3, delay: 1.2, duration: 8, color: "#3b82f6" },
  { top: "38%", left: "18%", size: 5, delay: 0.6, duration: 9, color: "#60a5fa" },
  { top: "48%", left: "70%", size: 3, delay: 2.1, duration: 6.5, color: "#00f2ff" },
  { top: "62%", left: "12%", size: 4, delay: 0.3, duration: 8.5, color: "#3b82f6" },
  { top: "70%", left: "88%", size: 5, delay: 1.8, duration: 7.5, color: "#60a5fa" },
  { top: "82%", left: "35%", size: 3, delay: 0.9, duration: 9.5, color: "#00f2ff" },
  { top: "30%", left: "55%", size: 4, delay: 2.6, duration: 7, color: "#3b82f6" },
  { top: "55%", left: "45%", size: 3, delay: 1.5, duration: 8, color: "#00f2ff" },
  { top: "88%", left: "68%", size: 4, delay: 0.2, duration: 7.8, color: "#60a5fa" },
  { top: "8%", left: "48%", size: 3, delay: 3.1, duration: 6.8, color: "#00f2ff" },
  { top: "75%", left: "6%", size: 3, delay: 2.2, duration: 9.2, color: "#3b82f6" },
];

/** Shared futuristic backdrop: deep navy gradient, animated grid, glow orbs, particles. */
export function Background({ intensity = "full", className = "" }: BackgroundProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 ${className}`} aria-hidden="true">
      {/* Base deep-navy gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030612] via-[#040714] to-[#071024]" />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          animation: "tasknova-grid-pan 14s linear infinite",
        }}
      />

      {/* Soft ambient glow orbs */}
      <div className="absolute top-[-10%] left-[-8%] w-[520px] h-[520px] bg-[#3b82f6] opacity-[0.09] blur-[140px] rounded-full" />
      <div className="absolute bottom-[-12%] right-[-8%] w-[520px] h-[520px] bg-[#00f2ff] opacity-[0.07] blur-[140px] rounded-full" />
      <div className="absolute top-[40%] right-[25%] w-[300px] h-[300px] bg-[#6366f1] opacity-[0.06] blur-[120px] rounded-full" />

      {/* Floating particles (hidden on small screens for low-end phone performance) */}
      {intensity === "full" &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-float hidden md:block"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 8px ${p.color}`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
    </div>
  );
}
