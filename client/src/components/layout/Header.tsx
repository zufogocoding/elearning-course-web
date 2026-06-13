"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Menu, X, GraduationCap, LogOut, User as UserIcon } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { href: "/courses", label: "Khóa học" },
  { href: "/profile", label: "Khóa học của tôi" },
];

export default function Header() {
  const { isDark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = usePathname();

  const surface = isDark
    ? "bg-[#13151f]/95 border-[#1e2235]"
    : "bg-white/95 border-slate-200/80";

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      path === href || path.startsWith(href + "/")
        ? "text-indigo-600 dark:text-indigo-400"
        : isDark
        ? "text-[#7a87a1] hover:text-[#e2e8f0]"
        : "text-slate-600 hover:text-slate-900"
    }`;

  const iconBtn = isDark
    ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#a0aec0] hover:text-white"
    : "bg-slate-100 hover:bg-slate-200 text-slate-600";

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-lg transition-colors duration-300 ${surface}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span
            className={`font-extrabold text-lg tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Elevate
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin/courses" className={linkClass("/admin")}>
              Quản trị
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Admin Panel Link */}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              id="global-admin-shortcut"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-xl transition-all shadow-sm ${
                isDark
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Quản lý hệ thống
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            id="global-theme-toggle"
            onClick={toggle}
            title={isDark ? "Chuyển sang nền sáng" : "Chuyển sang nền tối"}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${iconBtn}`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Auth Buttons – Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className={`flex items-center gap-2.5 text-sm font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                    isDark
                      ? "border-[#252840] bg-[#1a1d2e] text-[#e2e8f0] hover:border-indigo-500/50 hover:bg-[#22263a]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-[10px]">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{user.username}</span>
                </Link>
                <button
                  id="header-logout-btn"
                  onClick={logout}
                  title="Đăng xuất"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isDark
                      ? "bg-[#22263a] hover:bg-rose-950/20 text-[#a0aec0] hover:text-rose-400 border border-transparent hover:border-rose-900/30"
                      : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-transparent hover:border-rose-100"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    isDark
                      ? "text-[#7a87a1] hover:text-[#e2e8f0] hover:bg-[#22263a]"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm shadow-indigo-600/20"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-all ${iconBtn}`}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className={`md:hidden border-t px-4 py-3 space-y-1 ${
            isDark
              ? "bg-[#13151f] border-[#1e2235]"
              : "bg-white border-slate-100"
          }`}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? "text-[#7a87a1] hover:bg-[#1a1d2e] hover:text-[#e2e8f0]"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin/courses"
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isDark
                  ? "text-indigo-400 hover:bg-[#1a1d2e] hover:text-indigo-300"
                  : "text-indigo-600 hover:bg-slate-50 hover:text-indigo-700"
              }`}
            >
              Quản trị (Admin)
            </Link>
          )}
          <div
            className={`flex gap-2 pt-2 border-t ${
              isDark ? "border-[#1e2235]" : "border-slate-100"
            }`}
          >
            {user ? (
              <div className="flex flex-col gap-2 w-full">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    isDark ? "text-indigo-400 hover:bg-[#1a1d2e]" : "text-indigo-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{user.username} ({user.email})</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className={`w-full text-center text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isDark
                      ? "bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100"
                  }`}
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className={`flex-1 text-center text-sm font-medium py-2.5 rounded-lg border transition-colors ${
                    isDark
                      ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-sm font-semibold py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
