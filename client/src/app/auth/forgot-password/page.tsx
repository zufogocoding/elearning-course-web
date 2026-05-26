'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useToast } from '@/contexts/ToastContext';
import OtpInput from '@/components/ui/OtpInput';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function PasswordStrengthBar({ password }: { password: string }) {
  const s =
    password.length === 0
      ? 0
      : password.length < 6
      ? 1
      : password.length < 10
      ? 2
      : /[A-Z]/.test(password) && /[0-9!@#]/.test(password)
      ? 4
      : 3;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-rose-500', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
  const textColors = ['', 'text-rose-500', 'text-amber-400', 'text-yellow-500', 'text-emerald-500'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= s ? colors[s] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[s]}`}>{labels[s]}</p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    setCountdown(60);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const bg = isDark ? 'bg-[#0d0f1a]' : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50';
  const card = isDark ? 'bg-[#1a1d2e] border-[#252840]' : 'bg-white border-slate-200';
  const text = isDark ? 'text-[#e2e8f0]' : 'text-slate-900';
  const muted = isDark ? 'text-[#7a87a1]' : 'text-slate-500';
  const input = isDark
    ? 'bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40 focus:border-indigo-500/60'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40 focus:border-indigo-400';
  const iconColor = isDark ? 'text-[#4a5568]' : 'text-slate-400';
  const labelColor = isDark ? 'text-[#a0aec0]' : 'text-slate-600';

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always move to step 2 (server always returns 200 for security)
      setStep(2);
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'OTP không hợp lệ');
        if (data.code === 'OTP_EXPIRED') setCanResend(true);
        return;
      }
      setResetToken(data.resetToken);
      setStep(3);
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    try {
      await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setOtp(['', '', '', '', '', '']);
      setCanResend(false);
      setCountdown(60);
      showToast('info', 'Đã gửi lại mã OTP.');
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đặt lại mật khẩu thất bại');
        return;
      }
      showToast('success', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.');
      router.push('/auth/login');
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Step indicator
  const steps = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'Verify' },
    { num: 3, label: 'Reset' },
  ];

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center px-4 py-12 relative overflow-hidden`}>
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

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s.num
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : isDark
                      ? 'bg-[#252840] text-[#7a87a1]'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    step === s.num ? 'text-indigo-500' : step > s.num ? 'text-emerald-500' : muted
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 h-px transition-all ${
                    step > s.num
                      ? 'bg-emerald-500'
                      : isDark
                      ? 'bg-[#252840]'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className={`border rounded-2xl shadow-xl p-8 ${card} transition-all`}>
          {/* STEP 1: Enter email */}
          {step === 1 && (
            <>
              <div className="mb-6 text-center">
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'
                  }`}
                >
                  <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>Reset your password</h1>
                <p className={`text-sm ${muted}`}>
                  Enter your email and we&apos;ll send you a 6-digit verification code.
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">
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

                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 text-sm"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>

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

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <>
              <button
                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
                className={`flex items-center gap-1.5 text-sm mb-6 ${muted} hover:text-indigo-500 transition-colors`}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="text-center mb-8">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'
                  }`}
                >
                  <ShieldCheck className="w-8 h-8 text-indigo-500" />
                </div>
                <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>Check your email</h1>
                <p className={`text-sm ${muted}`}>
                  We sent a 6-digit code to{' '}
                  <span className={`font-semibold ${isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}>{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm text-center">
                  {error}
                </div>
              )}

              <OtpInput value={otp} onChange={setOtp} isDark={isDark} disabled={loading} />

              <p className={`text-center text-sm mt-4 ${muted}`}>
                {canResend ? (
                  <button
                    onClick={handleResend}
                    className="text-indigo-500 hover:text-indigo-400 font-semibold transition-colors"
                  >
                    Resend code
                  </button>
                ) : (
                  <>
                    Resend code in{' '}
                    <span className={`font-bold ${isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}>{countdown}s</span>
                  </>
                )}
              </p>

              <button
                id="forgot-verify-btn"
                onClick={handleVerifyOtp}
                disabled={loading || otp.join('').length < 6}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 mt-6 text-sm"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  'Verify Code'
                )}
              </button>
            </>
          )}

          {/* STEP 3: New Password */}
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'
                  }`}
                >
                  <Lock className="w-8 h-8 text-indigo-500" />
                </div>
                <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>Create new password</h1>
                <p className={`text-sm ${muted}`}>Your identity is verified. Set your new password below.</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="reset-new-password" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="reset-new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      minLength={6}
                      className={`w-full pl-4 pr-11 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                    />
                    <button
                      id="reset-toggle-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor} hover:text-indigo-500 transition-colors`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={newPassword} />
                </div>

                <div>
                  <label htmlFor="reset-confirm-password" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="reset-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      className={`w-full pl-4 pr-11 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input} ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-rose-400 focus:ring-rose-400/30'
                          : ''
                      }`}
                    />
                    <button
                      id="reset-toggle-confirm"
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor} hover:text-indigo-500 transition-colors`}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  id="reset-submit-btn"
                  type="submit"
                  disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 mt-2 text-sm"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Resetting password...</>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
