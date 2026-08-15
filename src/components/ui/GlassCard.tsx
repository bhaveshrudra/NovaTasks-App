import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

/** Glassmorphism card with optional hover lift and cyan/blue glow. */
export function GlassCard({ children, className = "", hover = false, glow = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-[24px] ${hover ? "hover-lift cursor-pointer" : ""} ${glow ? "glow-blue" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
