"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  AlertCircle,
  Loader2,
  FolderTree,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/admin", label: "Bảng điều khiển", Icon: LayoutDashboard },
  { href: "/admin/courses", label: "Khóa học", Icon: BookOpen },
  { href: "/admin/categories", label: "Danh mục", Icon: FolderTree },
  { href: "/admin/users", label: "Người dùng", Icon: Users },
  { href: "/admin/coupons", label: "Mã giảm giá", Icon: Tag },
  { href: "/admin/reports", label: "Báo cáo", Icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isDark, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, login, logout, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleAdminAutoLogin = async () => {
    // Chỉ chạy trong môi trường dev
    if (process.env.NODE_ENV === 'production') return;
    
    try {
      const res = await fetch('/api/auth/dev-auto-login', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Đăng nhập tự động thất bại.");
        return;
      }

      const data = await res.json();
      login(data.accessToken, data.user, data.refreshToken);
      router.refresh();
    } catch {
      alert("Lỗi kết nối server.");
    }
  };

  const sidebar = isDark
      ? "bg-[#13151f] border-[#1e2235]"
      : "bg-white border-slate-200";

  const root = isDark
      ? "bg-[#0d0f1a] text-[#e2e8f0]"
      : "bg-[#f4f6fb] text-slate-900";

  const activeLink = "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30";

  const inactiveLink = isDark
      ? "text-[#7a87a1] hover:bg-[#1a1d2e] hover:text-[#e2e8f0]"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  if (isLoading) {
    return (
        <div
            className={`min-h-screen flex items-center justify-center ${
                isDark ? "bg-[#0d0f1a]" : "bg-[#f4f6fb]"
            }`}
        >
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
        <div
            className={`min-h-screen flex items-center justify-center p-6 ${
                isDark ? "bg-[#0d0f1a]" : "bg-[#f4f6fb]"
            }`}
        >
          <div
              className={`w-full max-w-md border rounded-2xl p-8 text-center shadow-xl ${
                  isDark
                      ? "bg-[#1a1d2e] border-[#252840]"
                      : "bg-white border-slate-200"
              }`}
          >
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />

            <h2
                className={`text-lg font-bold mb-2 ${
                    isDark ? "text-white" : "text-slate-900"
                }`}
            >
              Yêu cầu quyền truy cập
            </h2>

            <p
                className={`text-sm mb-6 ${
                    isDark ? "text-[#7a87a1]" : "text-slate-500"
                }`}
            >
              Bạn cần quyền quản trị viên (Admin) để truy cập Bảng điều khiển này.
            </p>

            <div className="flex flex-col gap-3">
              <button
                  onClick={handleAdminAutoLogin}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                Đăng nhập nhanh với tài khoản Admin
              </button>

              <Link
                  href="/"
                  className={`w-full py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                      isDark
                          ? "border-[#252840] text-[#e2e8f0] hover:bg-[#22263a]"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                Quay lại Trang chủ
              </Link>
            </div>
          </div>
        </div>
    );
  }

  const sidebarContent = (
    <>
      <div className={`h-16 flex items-center px-5 border-b gap-3 ${isDark ? "border-[#1e2235]" : "border-slate-200"}`}>
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileSidebarOpen(false)}>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className={`font-extrabold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Elevate</span>
        </Link>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ml-auto ${
          isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600"
        }`}>QUẢN TRỊ</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? activeLink : inactiveLink}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className={`p-3 border-t ${isDark ? "border-[#1e2235]" : "border-slate-200"} space-y-0.5`}>
        <button onClick={toggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${inactiveLink}`}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? "Chế độ sáng" : "Chế độ tối"}
        </button>
        <Link href="/admin/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${inactiveLink}`}>
          <Settings className="w-4 h-4" />
          Cài đặt
        </Link>
        <button onClick={async () => { await logout(); router.push("/"); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-rose-500 ${isDark ? "hover:bg-rose-500/10" : "hover:bg-rose-50"}`}>
          <LogOut className="w-4 h-4 shrink-0" />
          Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${root}`}>
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex w-60 shrink-0 flex-col border-r transition-colors duration-300 ${sidebar}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className={`absolute left-0 top-0 h-full w-60 max-w-[80vw] shadow-2xl flex flex-col transition-colors duration-300 ${sidebar}`}>
            <div className="flex justify-end p-2 border-b">
              <button onClick={() => setMobileSidebarOpen(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "hover:bg-[#22263a] text-[#a0aec0]" : "hover:bg-slate-100 text-slate-600"}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center h-14 px-4 border-b gap-3 shrink-0">
          <button onClick={() => setMobileSidebarOpen(true)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#a0aec0]" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className={`font-extrabold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Elevate</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ml-2 ${
              isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600"
            }`}>ADMIN</span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}