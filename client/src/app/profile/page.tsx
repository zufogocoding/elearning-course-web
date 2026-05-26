"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTheme } from "@/components/ui/ThemeProvider";
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  Award,
  Edit3,
  CheckCircle,
  Clock,
  Play,
  Download,
  Bell,
  Lock,
  ChevronRight,
  Star,
  Receipt,
  RefreshCcw,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ENROLLED_COURSES = [
  {
    id: "ui-ux-design",
    title: "UI/UX Design Masterclass",
    category: "Design",
    progress: 65,
    totalLessons: 48,
    completedLessons: 31,
    thumbnail: "from-violet-500 to-indigo-600",
    instructor: "Sarah Chen",
    lastAccessed: "2 days ago",
    completed: false,
  },
  {
    id: "react-patterns",
    title: "Advanced React Patterns",
    category: "Development",
    progress: 20,
    totalLessons: 36,
    completedLessons: 7,
    thumbnail: "from-cyan-500 to-blue-600",
    instructor: "Alex Rivera",
    lastAccessed: "1 week ago",
    completed: false,
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing Strategy",
    category: "Marketing",
    progress: 100,
    totalLessons: 52,
    completedLessons: 52,
    thumbnail: "from-emerald-500 to-teal-600",
    instructor: "Jordan Lee",
    lastAccessed: "3 weeks ago",
    completed: true,
  },
];

const PURCHASE_HISTORY = [
  {
    id: "INV-2024-001",
    date: "Jan 15, 2024",
    course: "UI/UX Design Masterclass",
    amount: "$89.99",
    status: "Completed",
  },
  {
    id: "INV-2024-002",
    date: "Feb 03, 2024",
    course: "Advanced React Patterns",
    amount: "$74.99",
    status: "Completed",
  },
  {
    id: "INV-2024-003",
    date: "Mar 20, 2024",
    course: "SEO Fundamentals",
    amount: "$49.99",
    status: "Refunded",
  },
];

type Tab = "learning" | "settings" | "purchases";

export default function ProfilePage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("learning");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    promotions: false,
    newsletter: true,
    achievements: true,
  });

  // ─── Theme Tokens ───────────────────────────────────────────────────────────
  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const cardHover = isDark ? "hover:border-indigo-500/30" : "hover:border-indigo-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const input = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";
  const pill = isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700";

  const tabBtnClass = (t: Tab) =>
    `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      activeTab === t
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
        : isDark
        ? "text-[#7a87a1] hover:text-[#e2e8f0] hover:bg-[#1a1d2e]"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${bg}`}>
      <Header />

      <main className="flex-1">
        {/* ── Profile Hero ─────────────────────────────────────────────── */}
        <section className={`border-b ${divider} ${sectionBg} transition-colors duration-300`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
                  <span className="text-3xl font-extrabold text-white tracking-tight">JD</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>John Doe</h1>
                <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-sm ${muted}`}>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> john.doe@email.com
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Joined January 2024
                  </span>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                  {[
                    { icon: BookOpen, label: "Courses Enrolled", value: "3" },
                    { icon: Award, label: "Certificates Earned", value: "1" },
                    { icon: Star, label: "Avg Rating Given", value: "4.8" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${card}`}
                    >
                      <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <p className={`text-xs ${muted}`}>{label}</p>
                        <p className={`text-sm font-bold ${text}`}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Button */}
              <button
                id="edit-profile-btn"
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                  isDark
                    ? "border-[#252840] text-[#e2e8f0] hover:border-indigo-500/50 hover:bg-[#1a1d2e]"
                    : "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-8 overflow-x-auto pb-px">
              <button id="tab-learning" onClick={() => setActiveTab("learning")} className={tabBtnClass("learning")}>
                My Learning
              </button>
              <button id="tab-settings" onClick={() => setActiveTab("settings")} className={tabBtnClass("settings")}>
                Account Settings
              </button>
              <button id="tab-purchases" onClick={() => setActiveTab("purchases")} className={tabBtnClass("purchases")}>
                Purchase History
              </button>
            </div>
          </div>
        </section>

        {/* ── Tab Content ──────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* My Learning */}
          {activeTab === "learning" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className={`text-lg font-bold ${text}`}>Enrolled Courses</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${pill}`}>
                  {ENROLLED_COURSES.length} courses
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {ENROLLED_COURSES.map((course) => (
                  <div
                    key={course.id}
                    className={`border rounded-2xl overflow-hidden transition-all ${card} ${cardHover} group`}
                  >
                    {/* Thumbnail */}
                    <div className={`h-32 bg-gradient-to-br ${course.thumbnail} relative flex items-end p-3`}>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-black/30 text-white backdrop-blur-sm`}>
                        {course.category}
                      </span>
                      {course.completed && (
                        <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className={`text-sm font-bold leading-snug mb-1 ${text}`}>{course.title}</h3>
                      <p className={`text-xs mb-3 ${muted}`}>by {course.instructor}</p>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs ${muted}`}>{course.completedLessons}/{course.totalLessons} lessons</span>
                          <span className={`text-xs font-bold ${course.completed ? "text-emerald-500" : "text-indigo-500"}`}>
                            {course.progress}%
                          </span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-[#22263a]" : "bg-slate-100"}`}>
                          <div
                            className={`h-full rounded-full transition-all ${course.completed ? "bg-emerald-500" : "bg-indigo-600"}`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-xs flex items-center gap-1 ${muted}`}>
                          <Clock className="w-3 h-3" /> {course.lastAccessed}
                        </span>
                        {course.completed ? (
                          <a
                            href="/certificates"
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                          >
                            <Award className="w-3 h-3" /> View Certificate
                          </a>
                        ) : (
                          <a
                            href={`/courses/${course.id}/learn`}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                          >
                            <Play className="w-3 h-3" /> Continue
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              {/* Personal Info */}
              <div className={`border rounded-2xl p-5 ${card}`}>
                <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${text}`}>
                  <User className="w-4 h-4 text-indigo-500" /> Personal Information
                </h3>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="profile-first-name" className={`block text-xs font-semibold mb-1.5 ${muted}`}>First Name</label>
                      <input
                        id="profile-first-name"
                        type="text"
                        defaultValue="John"
                        className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="profile-last-name" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Last Name</label>
                      <input
                        id="profile-last-name"
                        type="text"
                        defaultValue="Doe"
                        className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="profile-email" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Email Address</label>
                    <input
                      id="profile-email"
                      type="email"
                      defaultValue="john.doe@email.com"
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-bio" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Bio</label>
                    <textarea
                      id="profile-bio"
                      rows={3}
                      defaultValue="Passionate about design and technology. Currently upskilling in UI/UX and front-end development."
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm resize-none ${input}`}
                    />
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className={`border rounded-2xl p-5 ${card}`}>
                <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${text}`}>
                  <Lock className="w-4 h-4 text-indigo-500" /> Change Password
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <label htmlFor="current-password" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Current Password</label>
                    <input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm pr-10 ${input}`}
                    />
                    <button
                      id="toggle-current-password"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-[2.15rem] ${muted} hover:text-indigo-500 transition-colors`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <label htmlFor="new-password" className={`block text-xs font-semibold mb-1.5 ${muted}`}>New Password</label>
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm pr-10 ${input}`}
                    />
                    <button
                      id="toggle-new-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3 top-[2.15rem] ${muted} hover:text-indigo-500 transition-colors`}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className={`border rounded-2xl p-5 ${card}`}>
                <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${text}`}>
                  <Bell className="w-4 h-4 text-indigo-500" /> Notification Preferences
                </h3>
                <div className="space-y-3">
                  {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, value]) => {
                    const labels: Record<keyof typeof notifications, string> = {
                      courseUpdates: "Course Updates",
                      promotions: "Promotions & Deals",
                      newsletter: "Weekly Newsletter",
                      achievements: "Achievement Alerts",
                    };
                    return (
                      <label
                        key={key}
                        htmlFor={`notif-${key}`}
                        className="flex items-center justify-between cursor-pointer group"
                      >
                        <span className={`text-sm font-medium ${text}`}>{labels[key]}</span>
                        <div className="relative">
                          <input
                            id={`notif-${key}`}
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))
                            }
                            className="sr-only"
                          />
                          <div
                            className={`w-10 h-5.5 rounded-full transition-all ${
                              value ? "bg-indigo-600" : isDark ? "bg-[#2a2d3e]" : "bg-slate-200"
                            }`}
                            style={{ height: "22px" }}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                                value ? "translate-x-[18px]" : "translate-x-0"
                              }`}
                              style={{ width: "18px", height: "18px" }}
                            />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                id="save-profile-settings"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}

          {/* Purchase History */}
          {activeTab === "purchases" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className={`text-lg font-bold ${text}`}>Purchase History</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${pill}`}>
                  {PURCHASE_HISTORY.length} transactions
                </span>
              </div>
              <div className={`border rounded-2xl overflow-hidden ${card}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${divider} ${isDark ? "bg-[#13151f]" : "bg-slate-50"}`}>
                        {["Date", "Course", "Amount", "Status", "Invoice"].map((h) => (
                          <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PURCHASE_HISTORY.map((row, i) => (
                        <tr
                          key={row.id}
                          className={`border-b last:border-0 transition-colors ${divider} ${
                            isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className={`px-4 py-3.5 whitespace-nowrap ${muted}`}>{row.date}</td>
                          <td className={`px-4 py-3.5 font-medium ${text}`}>{row.course}</td>
                          <td className={`px-4 py-3.5 font-semibold ${text}`}>{row.amount}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                row.status === "Completed"
                                  ? "bg-emerald-500/15 text-emerald-500"
                                  : "bg-rose-500/15 text-rose-500"
                              }`}
                            >
                              {row.status === "Refunded" ? (
                                <span className="flex items-center gap-1">
                                  <RefreshCcw className="w-3 h-3" /> {row.status}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> {row.status}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              id={`download-invoice-${i}`}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                isDark
                                  ? "border-[#252840] text-[#a0aec0] hover:border-indigo-500/40 hover:text-indigo-400"
                                  : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                              }`}
                            >
                              <Download className="w-3 h-3" /> {row.id}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
