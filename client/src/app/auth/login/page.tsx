"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

export default function LoginPage() {
  const { isDark } = useTheme();

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const input = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40 focus:border-indigo-500/60"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40 focus:border-indigo-400";
  const divider = isDark ? "border-[#252840]" : "border-slate-200";
  const googleBtn = isDark
    ? "bg-[#22263a] border-[#252840] hover:bg-[#2a2d3e] text-[#e2e8f0]"
    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700";
  const iconColor = isDark ? "text-[#4a5568]" : "text-slate-400";
  const labelColor = isDark ? "text-[#a0aec0]" : "text-slate-600";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center px-4 py-12 relative overflow-hidden`}>
      {/* Decorative blurred circles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 group" id="login-logo-link">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-lg">E</span>
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${text}`}>Elevate</span>
          </Link>
        </div>

        {/* Card */}
        <div className={`border rounded-2xl shadow-xl p-8 ${card} transition-all`}>
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-1`}>Sign in to Elevate</h1>
            <p className={`text-sm ${muted}`}>Welcome back! Please enter your details.</p>
          </div>

          {/* Google OAuth Button */}
          <button
            id="login-google-btn"
            type="button"
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-xl font-semibold text-sm transition-all mb-5 ${googleBtn}`}
          >
            {/* Google G SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`flex-1 border-t ${divider}`} />
            <span className={`text-xs font-medium ${muted}`}>or continue with email</span>
            <div className={`flex-1 border-t ${divider}`} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                Email address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className={`w-full pl-10 pr-11 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                />
                <button
                  id="login-toggle-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor} hover:text-indigo-500 transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer group">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                />
                <span className={`text-sm ${muted} group-hover:${text} transition-colors`}>Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                id="login-forgot-link"
                className="text-sm text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 mt-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Bottom link */}
          <p className={`mt-6 text-center text-sm ${muted}`}>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              id="login-register-link"
              className="text-indigo-500 hover:text-indigo-400 font-semibold transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
