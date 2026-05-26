"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Menu, X, GraduationCap } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

const NAV_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/profile", label: "My Learning" },
];

export default function Header() {
  const { isDark, toggle } = useTheme();
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
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle */}
          <button
            id="global-theme-toggle"
            onClick={toggle}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
            <Link
              href="/auth/login"
              className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? "text-[#7a87a1] hover:text-[#e2e8f0] hover:bg-[#22263a]"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm shadow-indigo-600/20"
            >
              Sign up
            </Link>
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
          <div
            className={`flex gap-2 pt-2 border-t ${
              isDark ? "border-[#1e2235]" : "border-slate-100"
            }`}
          >
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className={`flex-1 text-center text-sm font-medium py-2.5 rounded-lg border transition-colors ${
                isDark
                  ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center text-sm font-semibold py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
