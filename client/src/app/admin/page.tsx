"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
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
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STATS = [
  {
    id: "stat-revenue",
    label: "Total Revenue",
    value: "$48,392",
    trend: "+12.5% this month",
    trendUp: true,
    icon: DollarSign,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
  },
  {
    id: "stat-students",
    label: "Total Students",
    value: "1,284",
    trend: "+8.3% this month",
    trendUp: true,
    icon: Users,
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-500",
  },
  {
    id: "stat-courses",
    label: "Active Courses",
    value: "24",
    trend: "+2 new this week",
    trendUp: true,
    icon: BookOpen,
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-500",
  },
  {
    id: "stat-rating",
    label: "Avg. Rating",
    value: "4.8",
    trend: "⭐ Excellent",
    trendUp: true,
    icon: Star,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500",
  },
];

const REVENUE_BARS = [
  { month: "Jan", value: 6200, height: 55 },
  { month: "Feb", value: 5800, height: 50 },
  { month: "Mar", value: 7900, height: 70 },
  { month: "Apr", value: 8400, height: 74 },
  { month: "May", value: 9100, height: 80 },
  { month: "Jun", value: 11100, height: 100 },
];

const ENROLLMENTS = [
  { date: "Jun 12", student: "Alice Wang", course: "UI/UX Design Masterclass", amount: "$89.99", status: "Completed" },
  { date: "Jun 11", student: "Brian Torres", course: "Advanced React Patterns", amount: "$74.99", status: "Completed" },
  { date: "Jun 11", student: "Clara Singh", course: "Digital Marketing Strategy", amount: "$59.99", status: "Pending" },
  { date: "Jun 10", student: "David Kim", course: "Python for Data Science", amount: "$99.99", status: "Completed" },
  { date: "Jun 09", student: "Emma Davis", course: "Intro to AI & ML", amount: "$89.99", status: "Refunded" },
];

const TOP_COURSES = [
  { rank: 1, title: "UI/UX Design Masterclass", students: 312, revenue: "$28,009" },
  { rank: 2, title: "Advanced React Patterns", students: 241, revenue: "$18,064" },
  { rank: 3, title: "Python for Data Science", students: 198, revenue: "$19,702" },
  { rank: 4, title: "Digital Marketing Strategy", students: 187, revenue: "$11,215" },
  { rank: 5, title: "Intro to AI & ML", students: 156, revenue: "$14,010" },
];

export default function AdminDashboardPage() {
  const { isDark } = useTheme();

  // ─── Theme Tokens ───────────────────────────────────────────────────────────
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const sectionHdr = isDark ? "bg-[#13151f]" : "bg-slate-50";

  const statusBadge = (status: string) => {
    if (status === "Completed") return "bg-emerald-500/15 text-emerald-500";
    if (status === "Pending") return "bg-amber-400/15 text-amber-400";
    return "bg-rose-500/15 text-rose-500";
  };

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-7">

        {/* ── Header Row ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Dashboard</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            id="export-report-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" /> Export Report
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

        {/* ── Revenue Chart ─────────────────────────────────────────── */}
        <div className={`border rounded-2xl p-5 ${card}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h2 className={`text-sm font-bold ${text}`}>Monthly Revenue</h2>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}>
              Jan – Jun 2024
            </span>
          </div>
          <div className="flex items-end gap-3 h-40 px-2">
            {REVENUE_BARS.map((bar) => (
              <div key={bar.month} className="flex-1 flex flex-col items-center gap-2">
                <span className={`text-[10px] font-semibold ${muted}`}>
                  ${(bar.value / 1000).toFixed(1)}k
                </span>
                <div className="w-full flex items-end" style={{ height: "100px" }}>
                  <div
                    className="w-full rounded-t-lg bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-default relative group"
                    style={{ height: `${bar.height}%` }}
                  >
                    <div className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isDark ? "bg-[#22263a] text-white" : "bg-slate-800 text-white"}`}>
                      ${bar.value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-medium ${muted}`}>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-Column Section ────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Recent Enrollments */}
          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${divider} ${sectionHdr}`}>
              <h2 className={`text-sm font-bold ${text}`}>Recent Enrollments</h2>
              <a href="#" className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors flex items-center gap-1">
                View all <Eye className="w-3 h-3" />
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${divider}`}>
                    {["Date", "Student", "Course", "Amount", "Status"].map((h) => (
                      <th key={h} className={`text-left px-4 py-3 font-semibold ${muted}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ENROLLMENTS.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b last:border-0 transition-colors ${divider} ${isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"}`}
                    >
                      <td className={`px-4 py-3 whitespace-nowrap ${muted}`}>{row.date}</td>
                      <td className={`px-4 py-3 font-medium whitespace-nowrap ${text}`}>{row.student}</td>
                      <td className={`px-4 py-3 max-w-[120px] truncate ${muted}`}>{row.course}</td>
                      <td className={`px-4 py-3 font-semibold whitespace-nowrap ${text}`}>{row.amount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Courses */}
          <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${divider} ${sectionHdr}`}>
              <h2 className={`text-sm font-bold ${text}`}>Top Courses</h2>
              <a href="/admin/courses" className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors flex items-center gap-1">
                Manage <Eye className="w-3 h-3" />
              </a>
            </div>
            <div className="p-2">
              {TOP_COURSES.map((course) => (
                <div
                  key={course.rank}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"}`}
                >
                  <span className={`text-xs font-black w-5 text-center shrink-0 ${
                    course.rank === 1 ? "text-yellow-500" : course.rank === 2 ? "text-slate-400" : course.rank === 3 ? "text-amber-700" : muted
                  }`}>
                    #{course.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${text}`}>{course.title}</p>
                    <p className={`text-[10px] mt-0.5 ${muted}`}>{course.students} students</p>
                  </div>
                  <span className={`text-xs font-bold text-emerald-500 shrink-0`}>{course.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ─────────────────────────────────────────── */}
        <div className={`border rounded-2xl p-5 ${card}`}>
          <h2 className={`text-sm font-bold mb-4 ${text}`}>Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a
              id="quick-add-course"
              href="/admin/courses"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Add New Course
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
              <Tag className="w-4 h-4" /> Create Coupon
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
              <Users className="w-4 h-4" /> View All Users
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
