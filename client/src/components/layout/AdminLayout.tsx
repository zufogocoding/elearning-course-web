"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Tag,
  Settings,
  LogOut,
  GraduationCap,
  BarChart3,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

const NAV_ITEMS = [
  { href: "/admin", label: "Bảng điều khiển", Icon: LayoutDashboard },
  { href: "/admin/courses", label: "Khóa học", Icon: BookOpen },
  { href: "/admin/users", label: "Người dùng", Icon: Users },
  { href: "/admin/coupons", label: "Mã giảm giá", Icon: Tag },
  { href: "/admin/reports", label: "Báo cáo", Icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isDark, toggle } = useTheme();
  const pathname = usePathname();

  const sidebar = isDark
    ? "bg-[#13151f] border-[#1e2235]"
    : "bg-white border-slate-200";
  const root = isDark ? "bg-[#0d0f1a] text-[#e2e8f0]" : "bg-[#f4f6fb] text-slate-900";
  const activeLink = "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30";
  const inactiveLink = isDark
    ? "text-[#7a87a1] hover:bg-[#1a1d2e] hover:text-[#e2e8f0]"
    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${root}`}>
      {/* Sidebar */}
      <aside
        className={`w-60 shrink-0 flex flex-col border-r transition-colors duration-300 ${sidebar}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center px-5 border-b gap-3 ${isDark ? "border-[#1e2235]" : "border-slate-200"}`}>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className={`font-extrabold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
              Elevate
            </span>
          </Link>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ml-auto ${
              isDark
                ? "bg-indigo-500/20 text-indigo-300"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            QUẢN TRỊ
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? activeLink : inactiveLink
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={`p-3 border-t ${isDark ? "border-[#1e2235]" : "border-slate-200"} space-y-0.5`}>
          <button
            onClick={toggle}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${inactiveLink}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? "Chế độ sáng" : "Chế độ tối"}
          </button>
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${inactiveLink}`}
          >
            <Settings className="w-4 h-4" />
            Cài đặt
          </Link>
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-rose-500 ${
              isDark ? "hover:bg-rose-500/10" : "hover:bg-rose-50"
            }`}
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
