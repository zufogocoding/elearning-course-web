"use client";

import Link from "next/link";
import { useTheme } from "@/components/ui/ThemeProvider";

const LINKS = [
  { href: "/courses", label: "Khóa học" },
  { href: "/profile", label: "Khóa học của tôi" },
  { href: "/auth/login", label: "Đăng nhập" },
  { href: "/auth/register", label: "Đăng ký" },
];

export default function Footer() {
  const { isDark } = useTheme();

  return (
    <footer
      className={`border-t py-12 px-6 transition-colors duration-300 ${
        isDark
          ? "bg-[#13151f] border-[#1e2235]"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30">
                <span className="text-white font-extrabold text-sm leading-none">E</span>
              </div>
              <span
                className={`font-extrabold text-lg ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Elevate
              </span>
            </div>
            <p
              className={`text-xs max-w-xs text-center md:text-left ${
                isDark ? "text-[#4a5568]" : "text-slate-400"
              }`}
            >
              Nền tảng học tập tập trung dành cho những học viên đầy tham vọng.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  isDark
                    ? "text-[#7a87a1] hover:text-indigo-400"
                    : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p
            className={`text-sm font-medium ${
              isDark ? "text-[#4a5568]" : "text-slate-400"
            }`}
          >
            © 2026 Elevate Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
