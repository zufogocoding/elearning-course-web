'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { loginSchema } from '@/lib/validation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function LoginForm() {
  const { isDark } = useTheme();
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const bg = isDark ? 'bg-[#0d0f1a]' : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50';
  const card = isDark ? 'bg-[#1a1d2e] border-[#252840]' : 'bg-white border-slate-200';
  const text = isDark ? 'text-[#e2e8f0]' : 'text-slate-900';
  const muted = isDark ? 'text-[#7a87a1]' : 'text-slate-500';
  const input = isDark
    ? 'bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40 focus:border-indigo-500/60'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40 focus:border-indigo-400';
  const divider = isDark ? 'border-[#252840]' : 'border-slate-200';
  const iconColor = isDark ? 'text-[#4a5568]' : 'text-slate-400';
  const labelColor = isDark ? 'text-[#a0aec0]' : 'text-slate-600';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const validation = loginSchema.safeParse({ email, password });
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
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Đăng nhập thất bại');
        return;
      }

      login(data.accessToken, data.user);
      showToast('success', `Chào mừng trở lại, ${data.user.username}! 👋`);

      // Redirect
      const redirectTo = searchParams.get('redirect') || (data.user.role === 'admin' ? '/admin' : '/profile');
      router.push(redirectTo);
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center px-4 py-12 relative overflow-hidden`}>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 group" id="login-logo-link">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-lg">E</span>
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${text}`}>Elevate</span>
          </Link>
        </div>

        <div className={`border rounded-2xl shadow-xl p-8 ${card} transition-all`}>
          <div className="mb-6 text-center">
            <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-1`}>Đăng nhập vào Elevate</h1>
            <p className={`text-sm ${muted}`}>Chào mừng trở lại! Vui lòng nhập thông tin của bạn.</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">
              {error}
            </div>
          )}

          <div className={`flex items-center gap-3 mb-5`}>
            <div className={`flex-1 border-t ${divider}`} />
            <span className={`text-xs font-medium ${muted}`}>đăng nhập bằng email</span>
            <div className={`flex-1 border-t ${divider}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="login-email" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                Địa chỉ email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                <input
                  id="login-email"
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

            <div>
              <label htmlFor="login-password" className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className={`w-full pl-10 pr-11 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${
                    fieldErrors.password
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : input
                  }`}
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
              {fieldErrors.password && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="login-remember" className="flex items-center gap-2 cursor-pointer group">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                />
                <span className={`text-sm ${muted}`}>Ghi nhớ đăng nhập</span>
              </label>
              <Link
                href="/auth/forgot-password"
                id="login-forgot-link"
                className="text-sm text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/30 mt-2 text-sm"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang đăng nhập...</>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <p className={`mt-6 text-center text-sm ${muted}`}>
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" id="login-register-link" className="text-indigo-500 hover:text-indigo-400 font-semibold transition-colors">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
