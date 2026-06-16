"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
import { formatVND } from "@/lib/pricing";
import { api } from "@/lib/api";
import {
  DollarSign,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  Tag,
  Eye,
  BarChart3,
  AlertCircle
} from "lucide-react";

interface StatsData {
  totalRevenue: number;
  activeEnrollments: number;
  totalCourses: number;
  totalUsers: number;
}

export default function AdminDashboardPage() {
  const { isDark } = useTheme();
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/api/admin/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStatsData(data.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const STATS = [
    {
      id: "stat-revenue",
      label: "Tổng doanh thu",
      value: statsData ? formatVND(statsData.totalRevenue) : "0 ₫",
      trend: "Hoạt động",
      trendUp: true,
      icon: DollarSign,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
    },
    {
      id: "stat-students",
      label: "Tổng số học viên",
      value: statsData ? statsData?.totalUsers?.toString() ?? "0" : "0",
      trend: "Hoạt động",
      trendUp: true,
      icon: Users,
      iconBg: "bg-indigo-500/15",
      iconColor: "text-indigo-500",
    },
    {
      id: "stat-courses",
      label: "Khóa học",
      value: statsData ? statsData?.totalCourses?.toString() ?? "0" : "0",
      trend: "Hoạt động",
      trendUp: true,
      icon: BookOpen,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-500",
    },
    {
      id: "stat-enrollments",
      label: "Lượt đăng ký active",
      value: statsData ? statsData?.activeEnrollments?.toString() ?? "0" : "0",
      trend: "Hoạt động",
      trendUp: true,
      icon: Star,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
    },
  ];



  // ─── Theme Tokens ───────────────────────────────────────────────────────────
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const sectionHdr = isDark ? "bg-[#13151f]" : "bg-slate-50";

  const statusBadge = (status: string) => {
    if (status === "Hoàn thành") return "bg-emerald-500/15 text-emerald-500";
    if (status === "Chờ xử lý") return "bg-amber-400/15 text-amber-400";
    return "bg-rose-500/15 text-rose-500";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-7">

        {/* ── Header Row ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Bảng điều khiển</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            id="export-report-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>

        {/* ── Stats Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map(({ id, label, value, trend, trendUp, icon: Icon, iconBg, iconColor }) => (
            <div key={id} id={id} className={`border rounded-2xl p-5 transition-all ${card}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? "text-emerald-500" : "text-rose-500"}`}>
                  {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                </div>
              </div>
              <p className={`text-2xl font-extrabold tracking-tight ${text}`}>{value}</p>
              <p className={`text-xs mt-1 ${muted}`}>{label}</p>
              <p className={`text-xs mt-1 font-semibold ${trendUp ? "text-emerald-500" : "text-rose-500"}`}>{trend}</p>
            </div>
          ))}
        </div>



        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <div className={`border rounded-2xl p-5 ${card}`}>
          <h2 className={`text-sm font-bold mb-4 ${text}`}>Thao tác nhanh</h2>
          <div className="flex flex-wrap gap-3">
            <a
              id="quick-add-course"
              href="/admin/courses"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Thêm khóa học mới
            </a>
            <a
              id="quick-create-coupon"
              href="/admin/coupons"
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                isDark
                  ? "border-[#252840] text-[#e2e8f0] hover:border-indigo-500/40 hover:bg-[#1a1d2e]"
                  : "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
              }`}
            >
              <Tag className="w-4 h-4" /> Tạo mã giảm giá
            </a>
            <a
              id="quick-view-users"
              href="/admin/users"
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                isDark
                  ? "border-[#252840] text-[#e2e8f0] hover:border-indigo-500/40 hover:bg-[#1a1d2e]"
                  : "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" /> Xem tất cả người dùng
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
