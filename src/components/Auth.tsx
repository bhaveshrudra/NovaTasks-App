import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../utils/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut
} from "firebase/auth";
import { Sparkles, Phone, Lock, ChevronRight, RefreshCw, LogIn, AlertCircle, ArrowLeft } from "lucide-react";

interface AuthProps {
  onAuthSuccess: () => void;
  onSkipAuth: () => void;
}

export function Auth({ onAuthSuccess, onSkipAuth }: AuthProps) {
  const [authMode, setAuthMode] = useState<"options" | "phone">("options");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Countdown timer for re-sending OTP
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onAuthSuccess();
    } catch (err: any) {
      console.error("Google login failed", err);
      // Clean up common auth errors
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in popup closed before completion.");
      } else {
        setErrorMsg(err.message || "Failed to authenticate with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Setup ReCAPTCHA Verifier
  const setupRecaptcha = () => {
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }

      // Check if container exists
      const container = document.getElementById("recaptcha-container");
      if (!container) {
        // Create an element dynamically if it doesn't exist
        const newDiv = document.createElement("div");
        newDiv.id = "recaptcha-container";
        document.body.appendChild(newDiv);
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("ReCAPTCHA verification solved.");
        },
        "expired-callback": () => {
          setErrorMsg("ReCAPTCHA expired, please request OTP again.");
        }
      });
    } catch (err: any) {
      console.error("Error setting up ReCAPTCHA", err);
      setErrorMsg("Failed to initiate security validation. Please try again.");
    }
  };

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  // Handle Sending OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMsg("Please enter a valid phone number with country code.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      setupRecaptcha();
      if (!recaptchaVerifierRef.current) {
        throw new Error("ReCAPTCHA verifier could not be established.");
      }

      // Format number if missing country code (defaulting to user-assumed code or prompt)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith("+")) {
        // Assume +91 or typical country code from previous session region asia-southeast1,
        // but prompt indicating they should input with +
        if (formattedPhone.startsWith("0")) {
          setErrorMsg("Please include country code starting with '+' (e.g. +1... or +91...) instead of leading '0'.");
          setLoading(false);
          return;
        }
        setErrorMsg("Phone number must include your country code starting with '+' (e.g., +919876543210).");
        setLoading(false);
        return;
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setTimer(60); // 60s cooldown
    } catch (err: any) {
      console.error("Failed to send SMS", err);
      if (err.code === "auth/invalid-phone-number") {
        setErrorMsg("Invalid phone number format. Please check and retry.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMsg("Too many authentication attempts with this number. Please wait before retrying.");
      } else {
        setErrorMsg(err.message || "Failed to trigger phone verification OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Code Verification Submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrorMsg("Please enter the 6-digit verification code.");
      return;
    }

    if (!confirmationResult) {
      setErrorMsg("Verification window expired. Please request a new OTP code.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await confirmationResult.confirm(verificationCode.trim());
      onAuthSuccess();
    } catch (err: any) {
      console.error("OTP verification failed", err);
      if (err.code === "auth/invalid-verification-code") {
        setErrorMsg("Incorrect verification code. Please check and try again.");
      } else {
        setErrorMsg(err.message || "Failed to match verification OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#050608] text-white min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
      {/* Immersive high-tech animated stars and space backdrop meshes */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020305] via-[#0d091a] to-[#040e14] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />

      {/* Dynamic ambient color glows */}
      <div className="absolute top-[20%] left-[25%] w-[380px] h-[380px] bg-[#3b82f6] opacity-[0.06] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[25%] w-[380px] h-[380px] bg-[#00f2ff] opacity-[0.05] blur-[120px] rounded-full pointer-events-none" />

      {/* Recaptcha invisible anchor point */}
      <div id="recaptcha-container" className="invisible"></div>

      <main className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        {/* Animated Brand Node Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4 select-none">
            {/* Spinning background diamond */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#3b82f6] to-[#00f2ff] opacity-15 rounded-2xl border border-[#3b82f6]/40 rotate-45 animate-[spin_16s_linear_infinite]" />
            <div className="absolute inset-1.5 bg-gradient-to-bl from-[#050608] to-[#16181b]/90 rounded-2xl border border-white/5 rotate-45" />
            <span className="relative font-display text-4xl text-[#3b82f6] font-black tracking-tighter drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">N</span>
          </div>

          <h1 className="text-2xl font-bold uppercase tracking-[0.16em] text-white">TaskNova</h1>
          <p className="text-[10px] font-mono text-[#3b82f6] tracking-widest mt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00f2ff] animate-pulse" />
            SECURED AUTHORIZATION
          </p>
        </motion.div>

        {/* Central Auth Interface Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="w-full bg-[#ffffff03] backdrop-blur-xl border border-white/10 rounded-[32px] p-8 relative overflow-hidden shadow-2xl flex flex-col gap-6"
        >
          {errorMsg && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-red-950/25 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2.5 font-sans"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400 animate-pulse" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Standard Login Option Grid */}
            {authMode === "options" && (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <h2 className="text-sm font-semibold tracking-wide text-white/80">Command Gateway</h2>
                  <p className="text-[11px] font-mono text-white/40 mt-0.5">Initialize mission authorization token</p>
                </div>

                {/* Google Sign In option */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-4 bg-white/5 border border-white/10 hover:border-[#3b82f6]/40 hover:bg-white/[0.08] text-white font-mono text-xs rounded-xl flex items-center justify-center gap-3 active:scale-98 transition-all duration-200 cursor-pointer text-center font-semibold"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#3b82f6]" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.01c2.34-2.16 3.69-5.32 3.69-8.75z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.01-3.13c-1.11.75-2.53 1.19-3.92 1.19-3.02 0-5.58-2.04-6.5-4.78H1.31v3.24C3.29 21.6 7.37 24 12 24z" />
                      <path fill="#FBBC05" d="M5.5 14.37a7.19 7.19 0 0 1 0-4.74V6.39H1.31a11.97 11.97 0 0 1 0 11.22l4.19-3.24z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.24 0 12 0 7.37 0 3.29 2.4 1.31 6.39l4.19 3.24c.92-2.74 3.48-4.78 6.5-4.78z" />
                    </svg>
                  )}
                  {loading ? "AUTHENTICATING..." : "AUTHORIZE WITH GOOGLE"}
                </button>

                {/* Phone number OTP Switch button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setAuthMode("phone")}
                  className="w-full py-3 px-4 bg-white/5 border border-white/10 hover:border-[#3b82f6]/40 hover:bg-white/[0.08] text-white font-mono text-xs rounded-xl flex items-center justify-center gap-3 active:scale-98 transition-all duration-200 cursor-pointer text-center font-semibold"
                >
                  <Phone className="w-4 h-4 text-white/50" />
                  AUTHORIZE WITH PHONE SMS
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 font-mono text-[9px] text-white/20 select-none py-1.5">
                  <div className="h-[1px] flex-grow bg-white/5" />
                  <span>OR</span>
                  <div className="h-[1px] flex-grow bg-white/5" />
                </div>

                {/* Skip option */}
                <button
                  type="button"
                  onClick={onSkipAuth}
                  className="w-full py-3 px-4 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/15 hover:border-[#3b82f6]/40 text-[#3b82f6] border border-[#3b82f6]/20 font-mono text-xs rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all duration-200 cursor-pointer text-center font-bold"
                >
                  <LogIn className="w-4 h-4" />
                  BYPASS TO GUEST SANDBOX
                </button>
              </motion.div>
            )}

            {/* Phone Login and OTP verification segment */}
            {authMode === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    onClick={() => {
                      setAuthMode("options");
                      setOtpSent(false);
                      setPhoneNumber("");
                      setVerificationCode("");
                      setConfirmationResult(null);
                      setErrorMsg(null);
                    }}
                    className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-sm font-semibold text-white/80 leading-none">Phone Verification</h2>
                    <p className="text-[10px] font-mono text-white/40 mt-1">Request digital secure passcode</p>
                  </div>
                </div>

                {!otpSent ? (
                  /* Phone number Form */
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 uppercase mb-1 font-semibold">Phone Number (with Country Code)</label>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-3.5 w-4 h-4 text-white/30" />
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. +919876543210 or +16505550100"
                          disabled={loading}
                          className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-white/20 font-mono"
                        />
                      </div>
                      <p className="text-[9px] font-mono text-white/30 italic mt-1.5 leading-relaxed">
                        Tip: SMS Gateway is verified under Firebase. Include &quot;+&quot; country code explicitly.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm uppercase font-bold transition-all cursor-pointer"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : "REQUEST OTP SMS"}
                    </button>
                  </form>
                ) : (
                  /* Code Submission Form */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-mono text-white/40 uppercase font-semibold">Verification Code (6-digit OTP)</label>
                        <span className="text-[10px] font-mono text-[#00f2ff]">{phoneNumber}</span>
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="000000"
                          disabled={loading}
                          className="w-full bg-white/5 border border-white/10 focus:border-[#3b82f6]/30 focus:outline-none rounded-xl py-2.5 pl-10 pr-3 text-base tracking-[0.6em] text-center font-bold text-[#00f2ff] placeholder-white/10 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={loading || timer > 0}
                        onClick={handleSendOtp}
                        className="py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white font-mono text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all text-center whitespace-nowrap cursor-pointer"
                      >
                        {timer > 0 ? `RESEND (${timer}s)` : "RESEND OTP"}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-sm transition-all cursor-pointer"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : "CONFIRM CODE"}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer info block */}
        <footer className="mt-8 text-center text-[10px] uppercase font-mono tracking-[0.2em] text-white/20 leading-relaxed">
          <p>PROTECTED BY MAIN FRAME SYSTEMS</p>
          <p className="mt-0.5 text-[#3b82f6]/40 font-bold">Bhavesh Rudra • Operational Link</p>
        </footer>
      </main>
    </div>
  );
}
