'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Eye, EyeOff, User, Loader2, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import OtpInput from '@/components/ui/OtpInput';
import { registerSchema } from '@/lib/validation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function PasswordStrengthBar({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    if (pwd.length === 0) return 0;
    if (pwd.length < 6) return 1;
    if (pwd.length < 10) return 2;
    let score = 2;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9!@#$%^&*]/.test(pwd)) score++;
    return Math.min(score, 4);
  };

  const strength = getStrength(password);
  const labels = ['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
  const colors = ['', 'bg-rose-500', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
  const textColors = ['', 'text-rose-500', 'text-amber-400', 'text-yellow-500', 'text-emerald-500'];

  if (password.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength ? colors[strength] : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[strength]}`}>{labels[strength]}</p>
    </div>
  );
}

export default function RegisterPage() {
  const { isDark } = useTheme();
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [userId, setUserId] = useState<number | null>(null);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const hiddenFormRef = useRef<HTMLFormElement>(null);

  // Countdown timer
  useEffect(() => {
    if (step !== 'otp') return;
    setCountdown(60);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate using Zod
    const validation = registerSchema.safeParse({ username, email, password, confirmPassword });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Đăng ký thất bại');
        return;
      }

      setUserId(data.userId);

      // Browser save-password signal: submit hidden form before step change
      if (hiddenFormRef.current) {
        hiddenFormRef.current.dispatchEvent(new Event('submit', { bubbles: true }));
      }

      setStep('otp');
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, otp: otpStr }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || 'Mã OTP không đúng');
        if (data.code === 'OTP_EXPIRED') setCanResend(true);
        return;
      }

      login(data.accessToken, data.user);
      showToast('success', 'Đăng ký thành công! Chào mừng bạn đến với Elevate 🎉');
      router.push('/profile');
    } catch {
      setOtpError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !userId) return;
    setCanResend(false);
    setCountdown(60);
    setOtpError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || 'Không thể gửi lại OTP');
        setCanResend(true);
        return;
      }

      showToast('success', 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setOtpError('Lỗi kết nối. Vui lòng thử lại.');
      setCanResend(true);
    }
  };

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center px-4 py-12 relative overflow-hidden`}>
      {/* Decorative blurred circles */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden form for browser save-password signal */}
      <form
        ref={hiddenFormRef}
        style={{ display: 'none' }}
        onSubmit={(e) => e.preventDefault()}
        autoComplete="on"
      >
        <input type="text" name="username" autoComplete="username" value={username} readOnly />
        <input type="password" name="password" autoComplete="current-password" value={password} readOnly />
      </form>

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 group" id="register-logo-link">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-lg">E</span>
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${text}`}>Elevate</span>
          </Link>
        </div>

        {/* STEP 1: Registration Form */}
        {step === 'form' && (
          <div className={`border rounded-2xl shadow-xl p-8 ${card} transition-all`}>
            <div className="mb-6 text-center">
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
                isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
              }`}>
                🎓 Tham gia cùng 50.000+ học viên
              </span>
              <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-1`}>Tạo tài khoản của bạn</h1>
              <p className={`text-sm ${muted}`}>Bắt đầu hành trình học tập của bạn hôm nay.</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4" autoComplete="on">
              {/* Username */}
              <div>
                <label htmlFor="register-username" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                  Tên người dùng
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                  <input
                    id="register-username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nguyenvana"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${
                      fieldErrors.username
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : input
                    }`}
                  />
                </div>
                {fieldErrors.username && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="register-email" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                  Địa chỉ email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${
                      fieldErrors.email
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : input
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="register-password" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tạo một mật khẩu mạnh"
                    className={`w-full pl-4 pr-11 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${
                      fieldErrors.password
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : input
                    }`}
                  />
                  <button
                    id="register-toggle-password"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor} hover:text-indigo-500 transition-colors`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.password}</p>
                )}
                <PasswordStrengthBar password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="register-confirm-password" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu của bạn"
                    className={`w-full pl-4 pr-11 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${
                      fieldErrors.confirmPassword
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : input
                    }`}
                  />
                  <button
                    id="register-toggle-confirm-password"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconColor} hover:text-indigo-500 transition-colors`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-rose-500 mt-1">{fieldErrors.confirmPassword}</p>
                )}
                {!fieldErrors.confirmPassword && confirmPassword && confirmPassword === password && (
                  <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Mật khẩu khớp
                  </p>
                )}
              </div>

              {/* Terms */}
              <label htmlFor="register-terms" className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  id="register-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="w-4 h-4 mt-0.5 rounded accent-indigo-600 cursor-pointer flex-shrink-0"
                />
                <span className={`text-sm ${muted}`}>
                  Tôi đồng ý với{' '}
                  <Link href="/terms" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link href="/privacy" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                    Chính sách bảo mật
                  </Link>
                </span>
              </label>

              {/* Submit */}
              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 mt-2 text-sm"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo tài khoản...</>
                ) : (
                  'Tạo tài khoản'
                )}
              </button>
            </form>

            <p className={`mt-6 text-center text-sm ${muted}`}>
              Đã có tài khoản?{' '}
              <Link href="/auth/login" id="register-login-link" className="text-indigo-500 hover:text-indigo-400 font-semibold transition-colors">
                Đăng nhập
              </Link>
            </p>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'otp' && (
          <div className={`border rounded-2xl shadow-xl p-8 ${card} transition-all`}>
            {/* Back button */}
            <button
              onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); setOtpError(''); }}
              className={`flex items-center gap-1.5 text-sm mb-6 ${muted} hover:text-indigo-500 transition-colors`}
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại đăng ký
            </button>

            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'
              }`}>
                <ShieldCheck className="w-8 h-8 text-indigo-500" />
              </div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>Xác minh email của bạn</h1>
              <p className={`text-sm ${muted}`}>
                Chúng tôi đã gửi mã gồm 6 chữ số đến{' '}
                <span className={`font-semibold ${isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}>{email}</span>
              </p>
              <p className={`text-xs mt-1 ${muted}`}>Kiểm tra console server nếu email chưa được cấu hình.</p>
            </div>

            {otpError && (
              <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm text-center">
                {otpError}
              </div>
            )}

            <OtpInput value={otp} onChange={setOtp} isDark={isDark} disabled={otpLoading} />

            {/* Countdown */}
            <p className={`text-center text-sm mt-4 ${muted}`}>
              {canResend ? (
                <button
                  onClick={handleResendOtp}
                  className="text-indigo-500 hover:text-indigo-400 font-semibold transition-colors"
                >
                  Gửi lại OTP
                </button>
              ) : (
                <>Gửi lại mã trong <span className={`font-bold ${ isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}>{countdown}s</span></>
              )}
            </p>

            <button
              id="otp-verify-btn"
              onClick={handleVerifyOtp}
              disabled={otpLoading || otp.join('').length < 6}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 mt-6 text-sm"
            >
              {otpLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang xác minh...</>
              ) : (
                'Xác minh & Đăng nhập'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
