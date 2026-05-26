"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, Send } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function ForgotPasswordPage() {
  const { isDark } = useTheme();

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const input = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40 focus:border-indigo-500/60"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40 focus:border-indigo-400";
  const iconColor = isDark ? "text-[#4a5568]" : "text-slate-400";
  const labelColor = isDark ? "text-[#a0aec0]" : "text-slate-600";
  const successBg = isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200";

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1800);
  };

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center px-4 py-12 relative overflow-hidden`}>
      {/* Decorative blurred circles */}
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 group" id="forgot-logo-link">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-lg">E</span>
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${text}`}>Elevate</span>
          </Link>
        </div>

        {/* Card */}
        <div className={`border rounded-2xl shadow-xl p-8 ${card} transition-all`}>
          {submitted ? (
            /* Success State */
            <div className="text-center py-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${successBg} border mb-5 mx-auto`}>
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>Check your email!</h2>
              <p className={`text-sm ${muted} mb-2`}>
                We&apos;ve sent a password reset link to
              </p>
              <p className="text-sm font-semibold text-indigo-500 mb-5">{email}</p>
              <p className={`text-xs ${muted} mb-8`}>
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  id="forgot-resend-btn"
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors underline underline-offset-2"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/auth/login"
                id="forgot-success-back-btn"
                className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Header */}
              <div className="mb-6 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isDark ? "bg-indigo-500/20" : "bg-indigo-50"}`}>
                  <Send className="w-5 h-5 text-indigo-500" />
                </div>
                <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>Reset your password</h1>
                <p className={`text-sm ${muted}`}>
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="forgot-email" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              {/* Back link */}
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  id="forgot-back-link"
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${muted} hover:text-indigo-500 transition-colors`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
