"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { updateMeSchema } from "@/lib/validation";
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
  Loader2,
  LogOut,
  Settings,
  Shield,
  X,
  Upload
} from "lucide-react";

// Enrolled courses will be loaded from real API in component state

type Tab = "learning" | "settings" | "purchases";

export default function ProfilePage() {
  const { isDark } = useTheme();
  const { user, isLoading, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("learning");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    promotions: false,
    newsletter: true,
    achievements: true,
  });

  // Settings form states
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // UX modes
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Enrolled courses state
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" /> Thành công
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Clock className="w-3 h-3" /> Đang chờ
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <X className="w-3 h-3" /> Thất bại
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  // Sync state with user data
  useEffect(() => {
    if (user && !isEditingProfile) {
      setUsername(user.username || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user, isEditingProfile]);

  // Fetch enrolled courses from backend API
  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!user) return;
      try {
        const res = await api.get("/api/learning/my-courses");
        if (res.ok) {
          const result = await res.json();
          setEnrolledCourses(result.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch my courses:", err);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchMyCourses();
  }, [user]);

  // Fetch transactions from backend API
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user || activeTab !== "purchases") return;
      setTransactionsLoading(true);
      try {
        const res = await api.get("/api/users/me/transactions");
        if (res.ok) {
          const result = await res.json();
          setTransactions(result.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [user, activeTab]);

  // Auth Guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center ${isDark ? "bg-[#0d0f1a]" : "bg-slate-50"}`}>
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className={`mt-4 text-sm font-semibold ${isDark ? "text-[#7a87a1]" : "text-slate-500"}`}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setFieldErrors({});

    const validation = updateMeSchema.safeParse({
      username,
      bio: bio || undefined,
      avatarUrl: avatarUrl || undefined,
    });

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

    setIsUpdatingProfile(true);
    try {
      const body: any = { username, bio, avatarUrl };

      const res = await api.put("/api/users/me", body);
      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "Cập nhật thất bại");
        return;
      }

      showToast("success", "Cập nhật thông tin tài khoản thành công!");
      await refreshUser();
      setIsEditingProfile(false);
    } catch {
      showToast("error", "Lỗi kết nối đến máy chủ");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    setFieldErrors({});
    if (!currentPassword || !newPassword) {
      setFieldErrors({
        currentPassword: !currentPassword ? "Vui lòng nhập mật khẩu hiện tại" : "",
        newPassword: !newPassword ? "Vui lòng nhập mật khẩu mới" : "",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const body: any = { currentPassword, newPassword };
      const res = await api.put("/api/users/me", body);
      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "Đổi mật khẩu thất bại");
        return;
      }

      showToast("success", "Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setIsEditingPassword(false);
    } catch {
      showToast("error", "Lỗi kết nối đến máy chủ");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "Kích thước ảnh không được vượt quá 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Theme Tokens
  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const cardHover = isDark ? "hover:border-indigo-500/30" : "hover:border-indigo-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const subtle = isDark ? "text-[#4a5568]" : "text-slate-400";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const inputTheme = isDark
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

  const usernameInitials = user.username.slice(0, 2).toUpperCase() || "US";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${bg}`}>
      <Header />

      <main className="flex-1">
        {/* Profile Hero */}
        <section className={`border-b ${divider} ${sectionBg} transition-colors duration-300`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-24 h-24 rounded-2xl object-cover shadow-xl border-2 border-indigo-500/40"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
                    <span className="text-3xl font-extrabold text-white tracking-tight">{usernameInitials}</span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>{user.username}</h1>
                <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5 text-sm ${muted}`}>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Vai trò: {user.role}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                  {[
                    { icon: BookOpen, label: "Khóa học", value: enrolledCourses.length.toString() },
                    { icon: Award, label: "Chứng chỉ", value: enrolledCourses.filter(c => c.progressPercent === 100).length.toString() },
                    { icon: Star, label: "Đánh giá", value: enrolledCourses.length > 0 ? "4.8" : "0.0" },
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

              {/* Logout Button */}
              <button
                onClick={logout}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                  isDark
                    ? "border-rose-900/30 text-rose-400 hover:bg-rose-950/20"
                    : "border-rose-100 text-rose-600 hover:bg-rose-50"
                }`}
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-8 overflow-x-auto pb-px">
              <button onClick={() => setActiveTab("learning")} className={tabBtnClass("learning")}>
                Việc học của tôi
              </button>
              <button onClick={() => setActiveTab("settings")} className={tabBtnClass("settings")}>
                Hồ sơ & Cài đặt
              </button>
              <button onClick={() => setActiveTab("purchases")} className={tabBtnClass("purchases")}>
                Lịch sử mua hàng
              </button>
            </div>
          </div>
        </section>

        {/* Tab Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* My Learning */}
          {activeTab === "learning" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className={`text-lg font-bold ${text}`}>Khóa học đã đăng ký</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${pill}`}>
                  {enrolledCourses.length} khóa học
                </span>
              </div>
              
              {coursesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className={`text-center py-16 border border-dashed rounded-2xl ${card} flex flex-col items-center gap-3`}>
                  <BookOpen className={`w-12 h-12 ${muted}`} />
                  <h3 className={`text-base font-bold ${text}`}>Chưa đăng ký khóa học nào</h3>
                  <p className={`text-sm max-w-sm ${muted}`}>
                    Bạn chưa đăng ký bất kỳ khóa học nào trên hệ thống. Hãy bắt đầu nâng cấp kỹ năng ngay!
                  </p>
                  <button
                    onClick={() => router.push("/courses")}
                    className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-indigo-600/20"
                  >
                    Khám phá khóa học
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {enrolledCourses.map((course) => {
                    const gradientColors = [
                      "from-violet-500 to-indigo-600",
                      "from-cyan-500 to-blue-600",
                      "from-emerald-500 to-teal-600"
                    ];
                    const bgGradient = course.thumbnailUrl 
                      ? "" 
                      : gradientColors[course.courseId % gradientColors.length];
                    const isCompleted = course.progressPercent === 100;

                    return (
                      <Link
                        key={course.courseId}
                        href={`/courses/${course.courseId}/learn`}
                        className={`border rounded-2xl overflow-hidden transition-all ${card} ${cardHover} group block`}
                      >
                        {/* Thumbnail */}
                        <div 
                          className="h-32 relative flex items-end p-3 bg-cover bg-center"
                          style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : {}}
                        >
                          {!course.thumbnailUrl && <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`} />}
                          <span className={`relative z-10 text-[10px] font-bold px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm`}>
                            {course.shortDescription ? course.shortDescription.slice(0, 20) + "..." : "Khóa học"}
                          </span>
                          {isCompleted && (
                            <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1 z-10">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className={`text-sm font-bold leading-snug mb-1 truncate ${text}`} title={course.title}>
                            {course.title}
                          </h3>
                          <p className={`text-xs mb-3 ${muted}`}>bởi {course.instructor?.username || "Giảng viên"}</p>

                          {/* Progress */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-xs ${muted}`}>
                                {course.completedLessons}/{course.totalLessons} bài học
                              </span>
                              <span className={`text-xs font-bold ${isCompleted ? "text-emerald-500" : "text-indigo-500"}`}>
                                {course.progressPercent}%
                              </span>
                            </div>
                            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-[#22263a]" : "bg-slate-100"}`}>
                              <div
                                className={`h-full rounded-full transition-all ${isCompleted ? "bg-emerald-500" : "bg-indigo-600"}`}
                                style={{ width: `${course.progressPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`text-xs flex items-center gap-1 ${muted}`}>
                              <Clock className="w-3 h-3" /> {new Date(course.enrolledAt).toLocaleDateString("vi-VN")}
                            </span>
                            {isCompleted ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                                <Award className="w-3 h-3" /> Đã hoàn thành
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-semibold text-indigo-500">
                                <Play className="w-3 h-3" /> Vào học tiếp
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Account Settings */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Personal Info */}
              <div className="lg:col-span-7 space-y-6">
                <div className={`border rounded-2xl p-6 ${card} shadow-sm transition-all duration-300`}>
                  {!isEditingProfile ? (
                    // Display Mode
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className={`text-lg font-bold flex items-center gap-2 ${text}`}>
                            <User className="w-5 h-5 text-indigo-500" /> Thông tin cá nhân
                          </h3>
                          <p className={`text-xs mt-1 ${muted}`}>Quản lý thông tin hồ sơ của bạn</p>
                        </div>
                        <button 
                          onClick={() => {
                            setUsername(user.username || "");
                            setBio(user.bio || "");
                            setAvatarUrl(user.avatarUrl || "");
                            setFieldErrors({});
                            setIsEditingProfile(true);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm ${isDark ? "bg-[#22263a] text-[#e2e8f0] hover:bg-indigo-600 hover:text-white" : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"}`}
                        >
                          <Edit3 className="w-4 h-4" /> Chỉnh sửa
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center gap-5 pb-6 border-b border-dashed border-slate-200 dark:border-[#252840]">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-[#252840] shadow-md">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-2xl">
                                  {usernameInitials}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Tên hiển thị</p>
                            <p className={`text-xl font-extrabold ${text}`}>{user.username}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-dashed border-slate-200 dark:border-[#252840]">
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${muted}`}>Địa chỉ Email</p>
                            <p className={`text-sm font-bold ${text} flex items-center gap-2`}>
                              {user.email}
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã xác thực"></span>
                            </p>
                          </div>
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${muted}`}>Vai trò tài khoản</p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold capitalize ${isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>Tiểu sử cá nhân</p>
                          <p className={`text-sm leading-relaxed ${user.bio ? text : subtle}`}>
                            {user.bio || "Chưa có thông tin tiểu sử. Thêm tiểu sử để mọi người biết thêm về bạn!"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className={`text-lg font-bold flex items-center gap-2 ${text}`}>
                            <Edit3 className="w-5 h-5 text-indigo-500" /> Cập nhật thông tin
                          </h3>
                        </div>
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className={`p-2 rounded-full transition-all ${isDark ? "hover:bg-[#22263a] text-[#7a87a1]" : "hover:bg-slate-100 text-slate-500"}`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label htmlFor="profile-username" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Tên hiển thị mới</label>
                          <input
                            id="profile-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium ${
                              fieldErrors.username ? "border-rose-500 focus:ring-rose-500/20" : inputTheme
                            }`}
                          />
                          {fieldErrors.username && (
                            <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.username}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Ảnh đại diện</label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-[#252840] shadow-sm">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-100 dark:bg-[#22263a] flex items-center justify-center text-slate-400">
                                  <User className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-dashed rounded-xl cursor-pointer transition-all text-sm font-semibold ${isDark ? "border-[#4a5568] hover:border-indigo-400 hover:bg-indigo-500/10 text-indigo-400" : "border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-600"}`}>
                                <Upload className="w-4 h-4" />
                                Tải ảnh lên (Max 5MB)
                                <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileChange} />
                              </label>
                              <input
                                type="text"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="Hoặc dán URL ảnh vào đây..."
                                className={`w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 transition-all text-xs ${
                                  fieldErrors.avatarUrl ? "border-rose-500 focus:ring-rose-500/20" : inputTheme
                                }`}
                              />
                            </div>
                          </div>
                          {fieldErrors.avatarUrl && (
                            <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.avatarUrl}</p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="profile-bio" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Giới thiệu về bản thân</label>
                          <textarea
                            id="profile-bio"
                            rows={4}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Chia sẻ một chút về kinh nghiệm và mục tiêu học tập của bạn..."
                            className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm resize-none ${
                              fieldErrors.bio ? "border-rose-500 focus:ring-rose-500/20" : inputTheme
                            }`}
                          />
                          {fieldErrors.bio && (
                            <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.bio}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 pt-5 border-t border-slate-100 dark:border-[#252840]">
                        <button 
                          onClick={handleSaveProfile} 
                          disabled={isUpdatingProfile}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
                        >
                          {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Lưu thông tin
                        </button>
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          disabled={isUpdatingProfile}
                          className={`w-full sm:w-auto px-6 py-2.5 font-bold rounded-xl transition-all ${isDark ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#e2e8f0]" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Settings & Security Group */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Security Section */}
                <div className={`border rounded-2xl p-6 ${card} shadow-sm overflow-hidden relative`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Shield className="w-24 h-24 text-indigo-500" />
                  </div>
                  
                  {!isEditingPassword ? (
                    // Password Read Mode
                    <div className="relative z-10 animate-in fade-in">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className={`text-base font-bold flex items-center gap-2 ${text}`}>
                          <Shield className="w-5 h-5 text-indigo-500" /> Bảo mật & Mật khẩu
                        </h3>
                      </div>
                      
                      <div className={`flex items-center gap-3 px-4 py-3 mb-5 rounded-xl border ${isDark ? "bg-[#22263a]/50 border-[#252840]" : "bg-emerald-50/50 border-emerald-100"}`}>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${text}`}>Mật khẩu đã được thiết lập</p>
                          <p className={`text-[11px] ${muted}`}>Tài khoản của bạn đang được bảo vệ an toàn</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setCurrentPassword("");
                          setNewPassword("");
                          setFieldErrors({});
                          setIsEditingPassword(true);
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all border ${isDark ? "border-[#252840] bg-[#22263a] text-[#e2e8f0] hover:bg-[#2a2d3e]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                      >
                        <Lock className="w-4 h-4" /> Yêu cầu đổi mật khẩu
                      </button>
                    </div>
                  ) : (
                    // Password Edit Mode
                    <div className="relative z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className={`text-base font-bold flex items-center gap-2 ${text}`}>
                          <Lock className="w-5 h-5 text-indigo-500" /> Cập nhật mật khẩu
                        </h3>
                        <button 
                          onClick={() => setIsEditingPassword(false)}
                          className={`p-1.5 rounded-full transition-all ${isDark ? "hover:bg-[#22263a] text-[#7a87a1]" : "hover:bg-slate-100 text-slate-500"}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                        <div className="relative">
                          <label htmlFor="current-password" className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${muted}`}>Mật khẩu hiện tại</label>
                          <input
                            id="current-password"
                            type={showPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu cũ"
                            className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium pr-10 ${
                              fieldErrors.currentPassword ? "border-rose-500 focus:ring-rose-500/20" : inputTheme
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-3 top-[1.85rem] ${muted} hover:text-indigo-500 transition-colors`}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {fieldErrors.currentPassword && (
                            <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.currentPassword}</p>
                          )}
                        </div>
                        
                        <div className="relative">
                          <label htmlFor="new-password" className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${muted}`}>Mật khẩu mới</label>
                          <input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới"
                            className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium pr-10 ${
                              fieldErrors.newPassword ? "border-rose-500 focus:ring-rose-500/20" : inputTheme
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className={`absolute right-3 top-[1.85rem] ${muted} hover:text-indigo-500 transition-colors`}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {fieldErrors.newPassword && (
                            <p className="text-xs text-rose-500 font-semibold mt-1">{fieldErrors.newPassword}</p>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleSavePassword} 
                        disabled={isUpdatingPassword}
                        className="w-full flex justify-center items-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 text-sm"
                      >
                        {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận đổi mật khẩu"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifications Section */}
                <div className={`border rounded-2xl p-6 ${card} shadow-sm`}>
                  <h3 className={`text-base font-bold mb-5 flex items-center gap-2 ${text}`}>
                    <Bell className="w-5 h-5 text-indigo-500" /> Tùy chọn thông báo
                  </h3>
                  <div className="space-y-1">
                    {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, value]) => {
                      const labels: Record<keyof typeof notifications, { title: string, desc: string }> = {
                        courseUpdates: { title: "Cập nhật khóa học", desc: "Thông báo khi có bài giảng mới" },
                        promotions: { title: "Khuyến mãi & Ưu đãi", desc: "Nhận tin về các mã giảm giá" },
                        newsletter: { title: "Bản tin hàng tuần", desc: "Tin tức mới nhất về nền tảng" },
                        achievements: { title: "Thông báo thành tích", desc: "Khi bạn hoàn thành bài tập, khóa học" },
                      };
                      return (
                        <label
                          key={key}
                          htmlFor={`notif-${key}`}
                          className={`flex items-center justify-between cursor-pointer group p-3 rounded-xl transition-colors ${isDark ? "hover:bg-[#22263a]" : "hover:bg-slate-50"}`}
                        >
                          <div>
                            <p className={`text-sm font-bold ${text}`}>{labels[key].title}</p>
                            <p className={`text-[11px] ${muted} mt-0.5`}>{labels[key].desc}</p>
                          </div>
                          <div className="relative shrink-0 ml-4">
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
                              className={`w-10 rounded-full transition-colors duration-300 ${
                                value ? "bg-indigo-600" : isDark ? "bg-[#2a2d3e]" : "bg-slate-300"
                              }`}
                              style={{ height: "22px" }}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform duration-300 ${
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
                
              </div>
            </div>
          )}

          {/* Purchase History */}
          {activeTab === "purchases" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className={`text-lg font-bold ${text}`}>Lịch sử giao dịch</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${pill}`}>
                  {transactions.length} đơn hàng
                </span>
              </div>
              
              {transactionsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className={`text-center py-16 border border-dashed rounded-2xl ${card} flex flex-col items-center gap-3`}>
                  <Receipt className={`w-12 h-12 ${muted}`} />
                  <h3 className={`text-base font-bold ${text}`}>Chưa có giao dịch nào</h3>
                  <p className={`text-sm max-w-sm ${muted}`}>
                    Bạn chưa thực hiện giao dịch mua khóa học nào trên hệ thống.
                  </p>
                </div>
              ) : (
                <div className={`border rounded-2xl overflow-hidden ${card} shadow-sm`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${divider} ${isDark ? "bg-[#13151f]" : "bg-slate-50"}`}>
                          {["Mã giao dịch", "Ngày", "Sản phẩm", "Số tiền", "Trạng thái", "Hành động"].map((h) => (
                            <th key={h} className={`text-left px-5 py-4 text-xs font-bold uppercase tracking-wider ${muted}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((row) => {
                          const courseTitle = row.enrollment?.course?.title || "Khóa học";
                          const amountFormatted = Number(row.amount).toLocaleString("vi-VN") + " ₫";
                          const dateFormatted = new Date(row.createdAt).toLocaleDateString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "numeric",
                            year: "numeric"
                          });
                          const txCode = row.gatewayTransactionId || `TX-${row.id}`;

                          return (
                            <tr
                              key={row.id}
                              className={`border-b last:border-0 transition-colors ${divider} ${
                                isDark ? "hover:bg-[#13151f]/50" : "hover:bg-slate-50/50"
                              }`}
                            >
                              <td className="px-5 py-4">
                                <button
                                  onClick={() => setSelectedTx(row)}
                                  className="text-xs font-mono font-bold text-indigo-500 hover:text-indigo-600 hover:underline transition-all"
                                >
                                  {txCode}
                                </button>
                              </td>
                              <td className={`px-5 py-4 whitespace-nowrap text-xs font-medium ${muted}`}>{dateFormatted}</td>
                              <td className={`px-5 py-4 font-bold ${text}`}>{courseTitle}</td>
                              <td className={`px-5 py-4 font-bold ${text}`}>{amountFormatted}</td>
                              <td className="px-5 py-4">
                                {getStatusBadge(row.status)}
                              </td>
                              <td className="px-5 py-4">
                                <button
                                  onClick={() => setSelectedTx(row)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Xem chi tiết
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTx(null)}
          />

          {/* Modal Container */}
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border ${card} animate-in fade-in zoom-in duration-200`}>
            {/* Header */}
            <div className={`px-6 py-5 border-b ${divider} flex items-center justify-between`}>
              <h3 className={`text-lg font-bold tracking-tight ${text}`}>Chi tiết đơn hàng</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className={`p-1.5 rounded-lg transition-all ${isDark ? "hover:bg-[#22263a] text-[#7a87a1]" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className={`text-xs font-semibold ${muted}`}>Mã giao dịch</span>
                <span className={`text-xs font-mono font-bold text-indigo-500`}>
                  {selectedTx.gatewayTransactionId || `TX-${selectedTx.id}`}
                </span>
              </div>
              
              <div className="flex flex-col gap-1 py-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className={`text-xs font-semibold ${muted}`}>Khóa học</span>
                <span className={`text-sm font-bold ${text}`}>{selectedTx.enrollment?.course?.title || "Khóa học"}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className={`text-xs font-semibold ${muted}`}>Ngày giao dịch</span>
                <span className={`text-xs font-medium ${text}`}>
                  {new Date(selectedTx.createdAt).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "numeric",
                    month: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className={`text-xs font-semibold ${muted}`}>Phương thức</span>
                <span className={`text-xs font-semibold capitalize ${text}`}>
                  {selectedTx.paymentMethod === "free" ? "Miễn phí" : "VNPay"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className={`text-xs font-semibold ${muted}`}>Số tiền</span>
                <span className={`text-sm font-black text-indigo-600 dark:text-indigo-400`}>
                  {Number(selectedTx.amount).toLocaleString("vi-VN")} ₫
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className={`text-xs font-semibold ${muted}`}>Trạng thái</span>
                <div>{getStatusBadge(selectedTx.status)}</div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t ${divider} ${isDark ? "bg-[#13151f]/50" : "bg-slate-50/50"}`}>
              <button
                onClick={() => setSelectedTx(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  isDark
                    ? "border-[#252840] hover:bg-[#22263a] text-slate-300"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                Đóng
              </button>
              {selectedTx.status.toLowerCase() === "pending" && selectedTx.enrollment?.course?.slug && (
                <Link
                  href={`/checkout/${selectedTx.enrollment.course.slug}`}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20"
                >
                  Thanh toán ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
