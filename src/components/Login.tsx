import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  LogIn,
  ShieldCheck,
  UserRound,
  Lock,
  Mail,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Zap,
} from "lucide-react";
import { ADMIN_EMAIL, checkAdminCredentials } from "../utils/auth";
import { Background } from "./ui/Background";

interface LoginProps {
  onAdminLogin: (email: string) => void;
  onGuestLogin: () => void;
  onGoogleLogin: () => void;
}

/**
 * TaskNova landing / auth page.
 * Two primary flows: Admin Login (credential check) and Continue as Guest.
 * Google Sign-In is available under "Advanced" for future participant auth.
 */
export function Login({ onAdminLogin, onGuestLogin, onGoogleLogin }: LoginProps) {
  const [mode, setMode] = useState<"choice" | "admin">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both admin email and password.");
      return;
    }

    setAdminLoading(true);
    // Small delay so the loading state is visible and the flow feels responsive
    setTimeout(() => {
      if (checkAdminCredentials(email, password)) {
        onAdminLogin(email.trim());
      } else {
        setErrorMsg("Invalid admin credentials. Check the email and password and try again.");
        setAdminLoading(false);
      }
    }, 600);
  };

  const handleGuest = () => {
    setErrorMsg(null);
    setGuestLoading(true);
    setTimeout(() => onGuestLogin(), 500);
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setErrorMsg(err?.message || "Google Sign-In failed. You can still continue as Guest.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-[#040714] text-white min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
      <Background />

      <main className="relative z-10 w-full max-w-md px-6 flex flex-col items-center py-12">
        {/* Animated Brand Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3 select-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#3b82f6] to-[#00f2ff] opacity-20 rounded-2xl border border-[#3b82f6]/40 rotate-45 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-1.5 bg-gradient-to-bl from-[#050608] to-[#14161a]/95 rounded-2xl border border-white/5 rotate-45" />
            <span className="relative font-display text-4xl text-[#3b82f6] font-black tracking-tighter drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">N</span>
          </div>

          <h1 className="text-2xl font-bold uppercase tracking-[0.16em] text-white">TaskNova</h1>
          <p className="text-[10px] font-mono text-[#3b82f6] tracking-widest mt-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00f2ff] animate-pulse" />
            SECURED ACCESS PORTAL
          </p>
        </motion.div>

        {/* Authentication Framework Card */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="w-full glass rounded-[30px] p-7 glow-blue relative flex flex-col gap-6 overflow-hidden"
        >
          {/* Informational Notice */}
          <div className="flex bg-[#3b82f6]/5 border border-[#3b82f6]/10 p-3 rounded-xl gap-2 items-center">
            <ShieldCheck className="w-4 h-4 text-[#3c8bf2] shrink-0" />
            <div className="text-[10px] uppercase font-mono tracking-wider text-white/70 leading-normal">
              Choose your access level. <strong className="text-[#3b82f6]">Admins</strong> manage the command center,{" "}
              <strong className="text-[#00f2ff]">guests</strong> join as participants.
            </div>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-red-950/30 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2 font-sans"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400 animate-pulse" />
              <span className="leading-snug">{errorMsg}</span>
            </motion.div>
          )}

          {/* CHOICE MODE: Admin vs Guest */}
          {mode === "choice" && (
            <div className="space-y-4">
              {/* Admin Login */}
              <button
                type="button"
                onClick={() => {
                  setMode("admin");
                  setErrorMsg(null);
                }}
                className="w-full py-4 bg-white/5 border border-white/10 hover:border-[#3b82f6]/40 hover:bg-white/[0.08] text-white font-mono text-xs rounded-xl flex items-center justify-center gap-3 active:scale-98 transition-all duration-200 cursor-pointer text-center font-bold shadow-md"
              >
                <Lock className="w-4.5 h-4.5 text-[#3b82f6]" />
                ADMIN LOGIN
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 font-mono text-[9px] text-white/25 select-none py-1">
                <div className="h-[1px] flex-grow bg-white/5" />
                <span>PARTICIPANT ACCESS</span>
                <div className="h-[1px] flex-grow bg-white/5" />
              </div>

              {/* Continue as Guest */}
              <button
                type="button"
                disabled={guestLoading}
                onClick={handleGuest}
                className="w-full py-4 bg-[#00f2ff]/5 hover:bg-[#00f2ff]/10 border border-[#00f2ff]/25 text-[#00f2ff] font-mono text-xs rounded-xl flex items-center justify-center gap-3 active:scale-98 transition-all duration-200 cursor-pointer text-center font-bold shadow-[0_0_15px_rgba(0,242,255,0.06)]"
              >
                {guestLoading ? (
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <UserRound className="w-4.5 h-4.5" />
                )}
                {guestLoading ? "BOOTING GUEST WORKSTATION..." : "CONTINUE AS GUEST"}
              </button>

              {/* Advanced: Google Sign-In (optional, for future participant auth) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(s => !s)}
                  className="w-full flex items-center justify-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors cursor-pointer py-1"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                  Advanced · Google Sign-In
                </button>

                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <button
                      type="button"
                      disabled={googleLoading}
                      onClick={handleGoogle}
                      className="w-full mt-2 py-3 bg-white/5 border border-white/10 hover:border-[#3b82f6]/40 hover:bg-white/[0.08] text-white font-mono text-xs rounded-xl flex items-center justify-center gap-3 active:scale-98 transition-all duration-200 cursor-pointer font-bold"
                    >
                      {googleLoading ? (
                        <RefreshCw className="w-4.5 h-4.5 animate-spin text-[#3b82f6]" />
                      ) : (
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.01c2.34-2.16 3.69-5.32 3.69-8.75z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.01-3.13c-1.11.75-2.53 1.19-3.92 1.19-3.02 0-5.58-2.04-6.5-4.78H1.31v3.24C3.29 21.6 7.37 24 12 24z" />
                          <path fill="#FBBC05" d="M5.5 14.37a7.19 7.19 0 0 1 0-4.74V6.39H1.31a11.97 11.97 0 0 1 0 11.22l4.19-3.24z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.24 0 12 0 7.37 0 3.29 2.4 1.31 6.39l4.19 3.24c.92-2.74 3.48-4.78 6.5-4.78z" />
                        </svg>
                      )}
                      {googleLoading ? "CONTACTING GOOGLE..." : "SIGN IN WITH GOOGLE (OPTIONAL)"}
                    </button>
                    <p className="mt-2 text-[9px] font-mono text-white/25 text-center leading-relaxed">
                      <Zap className="w-3 h-3 inline text-[#00f2ff] mr-0.5" />
                      Not required for guests. Reserved for registered participant accounts.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* ADMIN MODE: credential form */}
          {mode === "admin" && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-mono tracking-widest text-[#3b82f6] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Admin Credentials
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setMode("choice");
                    setErrorMsg(null);
                  }}
                  className="text-[9px] font-mono uppercase tracking-widest text-white/40 hover:text-white/70 cursor-pointer"
                >
                  ← Back
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={ADMIN_EMAIL}
                    autoComplete="username"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/40 focus:outline-none rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Admin Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••"
                    autoComplete="current-password"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/40 focus:outline-none rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/20"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("choice");
                    setErrorMsg(null);
                  }}
                  className="flex-grow py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 font-mono text-xs rounded-xl transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="flex-grow py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-xs rounded-xl shadow-sm transition-all cursor-pointer font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {adminLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {adminLoading ? "VERIFYING..." : "ACCESS ADMIN PANEL"}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Footer block */}
        <footer className="mt-8 text-center text-[10px] uppercase font-mono tracking-[0.2em] text-white/25 leading-relaxed">
          <p>PROTECTED BY MAINFRAME SYSTEMS</p>
          <p className="mt-0.5 text-[#3b82f6]/50 font-bold">TaskNova Command Center</p>
        </footer>
      </main>
    </div>
  );
}
