"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function ResetPasswordPage() {
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

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsDontMatch = confirmPassword && newPassword !== confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 1800);
  };

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center px-4 py-12 relative overflow-hidden`}>
      {/* Decorative blurred circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 group" id="reset-logo-link">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-lg">E</span>
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${text}`}>Elevate</span>
          </Link>
        </div>

        {/* Card */}
        <div className={`border rounded-2xl shadow-xl p-8 ${card} transition-all`}>
          {success ? (
            /* Success State */
            <div className="text-center py-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${successBg} border mb-5 mx-auto`}>
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>Password updated!</h2>
              <p className={`text-sm ${muted} mb-8`}>
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link
                href="/auth/login"
                id="reset-success-login-link"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 text-sm"
              >
                Sign in to Elevate
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Header */}
              <div className="mb-6 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isDark ? "bg-indigo-500/20" : "bg-indigo-50"}`}>
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                </div>
                <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>Set new password</h1>
                <p className={`text-sm ${muted}`}>
                  Choose a strong password for your account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label htmlFor="reset-new-password" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                      minLength={8}
                      className={`w-full pl-4 pr-11 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                    />
                    <button
                      id="reset-toggle-new-password"
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor} hover:text-indigo-500 transition-colors`}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-xs text-amber-400 mt-1">Password must be at least 8 characters</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="reset-confirm-password" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      className={`w-full pl-4 pr-11 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input} ${
                        passwordsDontMatch ? "border-rose-400 focus:ring-rose-400/30" : ""
                      }`}
                    />
                    <button
                      id="reset-toggle-confirm-password"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor} hover:text-indigo-500 transition-colors`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordsDontMatch && (
                    <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Password requirements hint */}
                <div className={`rounded-xl p-3 ${isDark ? "bg-[#22263a] border border-[#252840]" : "bg-slate-50 border border-slate-200"}`}>
                  <p className={`text-xs font-medium mb-2 ${labelColor}`}>Password requirements:</p>
                  <ul className="space-y-1">
                    {[
                      { label: "At least 8 characters", met: newPassword.length >= 8 },
                      { label: "Mix of letters and numbers", met: /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) },
                    ].map((req, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${req.met ? "bg-emerald-500" : isDark ? "bg-[#4a5568]" : "bg-slate-300"}`} />
                        <span className={`text-xs ${req.met ? "text-emerald-500" : muted}`}>{req.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Submit */}
                <button
                  id="reset-submit-btn"
                  type="submit"
                  disabled={isLoading || !passwordsMatch || newPassword.length < 8}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </button>
              </form>

              {/* Back link */}
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  id="reset-back-link"
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
