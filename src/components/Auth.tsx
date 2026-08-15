import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { auth } from "../utils/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { 
  Sparkles, 
  RefreshCw, 
  LogIn, 
  AlertCircle,
  Zap 
} from "lucide-react";

interface AuthProps {
  onAuthSuccess: (mockUser?: any) => void;
  onSkipAuth: () => void;
}

export function Auth({ onAuthSuccess, onSkipAuth }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const progressTimerRef = useRef<any>(null);

  // Clean timers on unmount and assess if trial is expired
  useEffect(() => {
    setTrialExpired(localStorage.getItem("tasknova_trial_expired") === "true");
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Helper to simulate fast progress steps
  const runProgressSimulation = (steps: string[]) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    let idx = 0;
    setProgressStep(steps[0]);
    progressTimerRef.current = setInterval(() => {
      idx++;
      if (idx < steps.length) {
        setProgressStep(steps[idx]);
      } else {
        clearInterval(progressTimerRef.current);
      }
    }, 600);
  };

  // Handle Google Sign-in with progress steps to make it feel fast & track pop-up bottlenecks
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    runProgressSimulation([
      "Bypassing iframe cookie sandboxes...",
      "Opening Google Authentication gateway popup...",
      "Waiting for credentials authorization...",
      "Authenticating profile parameters...",
      "Mapping Firestore real-time state..."
    ]);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgressStep("Verified! Booting main core mainframe...");
      
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    } catch (err: any) {
      console.error("Google login failed", err);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in popup closed before completion. Please try again or use Sandbox guest mode below.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setErrorMsg("Multiple authentication popups triggered. Only one popup can be active at a time.");
      } else {
        setErrorMsg(err.message || "Failed to authenticate with Google. High cookie security is blocking popups.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger simulated developer sandbox auth bypass (simulates a Google profile)
  const handleTriggerSandboxFlow = () => {
    setErrorMsg(null);
    setLoading(true);
    
    runProgressSimulation([
      "Launching sandboxed cryptographic pipeline layer...",
      "Generating localized virtual identity credentials...",
      "Simulating zero-trust security handshake...",
      "Sandbox matrix authorized! Booting workstation portal..."
    ]);
    
    setTimeout(() => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      
      const mockUser = {
        uid: `sandbox-usr-${Date.now()}`,
        email: "alex.demo@gmail.com",
        displayName: "Alex",
        isSimulated: true,
        emailVerified: true
      };
      
      onAuthSuccess(mockUser);
    }, 2400);
  };

  return (
    <div className="bg-[#050608] text-white min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
      {/* Space Backdrop meshes */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020305] via-[#0b0c15] to-[#040e14] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />

      {/* Futuristic ambient color glows */}
      <div className="absolute top-[15%] left-[20%] w-[450px] h-[450px] bg-[#3b82f6] opacity-[0.08] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] bg-[#00f2ff] opacity-[0.07] blur-[150px] rounded-full pointer-events-none" />

      <main className="relative z-10 w-full max-w-md px-6 flex flex-col items-center py-12">
        {/* Animated Brand Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-6"
        >
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3 select-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#3b82f6] to-[#00f2ff] opacity-20 rounded-2xl border border-[#3b82f6]/40 rotate-45 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-1.5 bg-gradient-to-bl from-[#050608] to-[#14161a]/95 rounded-2xl border border-white/5 rotate-45" />
            <span className="relative font-display text-4xl text-[#3b82f6] font-black tracking-tighter drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">N</span>
          </div>

          <h1 className="text-2xl font-bold uppercase tracking-[0.16em] text-white">TaskNova</h1>
          <p className="text-[10px] font-mono text-[#3b82f6] tracking-widest mt-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00f2ff] animate-pulse" />
            SECURED GOOGLE AUTHORIZATION
          </p>
        </motion.div>

        {/* Outer Authentication Framework Card */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[30px] p-7 shadow-3xl relative flex flex-col gap-6 overflow-hidden"
        >
          {/* Quick Informational Notice */}
          {trialExpired ? (
            <div className="flex bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl gap-2.5 items-center">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
              <div className="text-[10px] uppercase font-mono tracking-wider text-red-300 leading-normal">
                ⚠️ <strong className="text-red-400">GUEST TRIAL EXPIRED:</strong> The 2-minute sandbox guest trial has expired. Bypassing registration has been locked. Please authenticate with Google.
              </div>
            </div>
          ) : (
            <div className="flex bg-[#3b82f6]/5 border border-[#3b82f6]/10 p-3 rounded-xl gap-2 items-center">
              <Sparkles className="w-4 h-4 text-[#3c8bf2] shrink-0" />
              <div className="text-[10px] uppercase font-mono tracking-wider text-white/70 leading-normal">
                Authentication relies solely on <strong className="text-[#3b82f6]">Google Sign-In</strong>. Fast, passwordless, and direct.
              </div>
            </div>
          )}

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

          {/* Dynamic Active Step Status Monitor */}
          {loading && progressStep && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3.5 py-2.5 bg-white/[0.04] border border-[#3b82f6]/30 text-blue-300 rounded-xl flex items-center gap-3 font-mono text-[10px]"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00f2ff] shrink-0" />
              <span className="uppercase tracking-widest text-white/80 animate-pulse">{progressStep}</span>
            </motion.div>
          )}

          {/* Standard Authentication Section */}
          <div className="space-y-4">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-4 bg-white/5 border border-white/10 hover:border-[#3b82f6]/40 hover:bg-white/[0.08] text-white font-mono text-xs rounded-xl flex items-center justify-center gap-3 active:scale-98 transition-all duration-200 cursor-pointer text-center font-bold shadow-md"
            >
              {loading ? (
                <RefreshCw className="w-4.5 h-4.5 animate-spin text-[#3b82f6]" />
              ) : (
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.01c2.34-2.16 3.69-5.32 3.69-8.75z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.01-3.13c-1.11.75-2.53 1.19-3.92 1.19-3.02 0-5.58-2.04-6.5-4.78H1.31v3.24C3.29 21.6 7.37 24 12 24z" />
                  <path fill="#FBBC05" d="M5.5 14.37a7.19 7.19 0 0 1 0-4.74V6.39H1.31a11.97 11.97 0 0 1 0 11.22l4.19-3.24z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.24 0 12 0 7.37 0 3.29 2.4 1.31 6.39l4.19 3.24c.92-2.74 3.48-4.78 6.5-4.78z" />
                </svg>
              )}
              {loading ? "INITIALIZING SECURE PROTOCOL..." : "SIGN IN WITH GOOGLE"}
            </button>
          </div>

          {!trialExpired ? (
            <>
              {/* Sandbox Bypass section */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleTriggerSandboxFlow}
                  className="w-full py-3 bg-[#00f2ff]/5 hover:bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-[#00f2ff] font-mono text-[10px] rounded-xl text-center cursor-pointer font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,242,255,0.06)]"
                >
                  <Zap className="w-3.5 h-3.5 text-[#00f2ff]" />
                  Bypass to Sandbox Simulator (Simulate Google User)
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 font-mono text-[9px] text-white/25 select-none py-1">
                <div className="h-[1px] flex-grow bg-white/5" />
                <span>OR OFFLINE SANDBOX</span>
                <div className="h-[1px] flex-grow bg-white/5" />
              </div>

              {/* Skip option */}
              <button
                type="button"
                disabled={loading}
                onClick={onSkipAuth}
                className="w-full py-3 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/15 hover:border-[#3b82f6]/40 text-[#3b82f6] border border-[#3b82f6]/20 font-mono text-xs rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all duration-200 cursor-pointer text-center font-bold"
              >
                <LogIn className="w-4 h-4" />
                BYPASS TO OFFLINE SANDBOX GUEST
              </button>
            </>
          ) : (
            <div className="border border-red-500/25 bg-red-950/10 p-4.5 rounded-[22px] text-center space-y-1 mt-1">
              <p className="text-[10px] font-mono tracking-widest text-red-400 font-bold uppercase flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                No More Free Trials Allowed
              </p>
              <p className="text-[9.5px] font-sans text-white/50 leading-relaxed max-w-xs mx-auto">
                Your 2-minute temporary guest connection has expired. Sandbox guest bypass is permanently disabled for this device to maintain integrity. Please synchronize using Google login to register.
              </p>
            </div>
          )}

        </motion.div>

        {/* Footer block */}
        <footer className="mt-8 text-center text-[10px] uppercase font-mono tracking-[0.2em] text-white/25 leading-relaxed">
          <p>PROTECTED BY MAINFRAME SYSTEMS</p>
          <p className="mt-0.5 text-[#3b82f6]/50 font-bold">Bhavesh Rudra • Operational Link</p>
        </footer>
      </main>
    </div>
  );
}
