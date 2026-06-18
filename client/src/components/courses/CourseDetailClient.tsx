"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { calculateCoursePricing, formatVND } from "@/lib/pricing";
import { useTheme } from "@/components/ui/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import {
  PlayCircle,
  Star,
  ShieldCheck,
  Clock,
  FileText,
  MonitorPlay,
  CheckCircle,
  ChevronDown,
  Lock,
  Users,
  Globe,
  RefreshCw,
  Smartphone,
} from "lucide-react";

interface DbLesson {
  id: number;
  title: string;
  durationSeconds?: number | null;
  isPreview: boolean;
}

interface DbSection {
  id: number;
  title: string;
  lessons?: DbLesson[];
}

interface DbCourseDetail {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string | null;
  price: number;
  discountPrice?: number | null;
  thumbnailUrl?: string | null;
  level: string;
  creator: { username: string; avatarUrl?: string | null };
  sections?: DbSection[];
}

interface CourseDetailClientProps {
  courseDetail: DbCourseDetail | null;
}



export default function CourseDetailClient({ courseDetail }: CourseDetailClientProps) {
  const { isDark } = useTheme();

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const subtle = isDark ? "text-[#4a5568]" : "text-slate-400";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const input = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";

  const [activeTab, setActiveTab] = useState("description");
  const [couponCode, setCouponCode] = useState("");
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);

  const { user } = useAuth();
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);


  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !courseDetail) {
        setIsEnrolled(false);
        setCheckingEnrollment(false);
        return;
      }
      try {
        const res = await api.get('/api/learning/my-courses');
        if (res.ok) {
          const result = await res.json();
          const coursesList = result.data || [];
          const enrolled = coursesList.some((c: any) => c.courseId === courseDetail.id);
          setIsEnrolled(enrolled);
        }
      } catch (err) {
        console.error("Error checking enrollment status", err);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    const fetchReviews = async () => {
      if (!courseDetail?.id) return;
      try {
        const res = await api.get(`/api/courses/${courseDetail.id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching reviews", err);
      } finally {
        setReviewsLoading(false);
      }
    };

    checkEnrollment();
    fetchReviews();
  }, [user, courseDetail]);

  const handleEnrollClick = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/courses/${courseDetail?.slug || ""}`);
      return;
    }
    if (isEnrolled) {
      router.push(`/courses/${courseDetail?.slug}/learn`);
    } else {
      const couponQuery = couponSuccess ? `?coupon=${couponCode}` : "";
      router.push(`/checkout/${courseDetail?.slug}${couponQuery}`);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!user) {
      setCouponError("Vui lòng đăng nhập để áp dụng mã giảm giá.");
      return;
    }
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const res = await api.get(`/api/enrollments/coupon/${couponCode.trim()}`);
      if (res.ok) {
        const result = await res.json();
        const { discountType: type, discountValue: val } = result.coupon;
        setDiscountType(type);
        setDiscountValue(Number(val));
        setCouponSuccess(`Áp dụng mã ${couponCode.toUpperCase()} thành công!`);
      } else {
        const errorData = await res.json();
        setCouponError(errorData.error || "Mã giảm giá không hợp lệ.");
      }
    } catch {
      setCouponError("Lỗi kết nối khi kiểm tra mã giảm giá.");
    }
  };



  const toggleModule = (idx: number) => {
    setExpandedModules((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (!courseDetail) {
    return (
      <div className={`min-h-screen ${bg} font-sans flex flex-col`}>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className={`text-3xl font-bold mb-4 ${text}`}>Không tìm thấy khóa học</h1>
          <p className={`${muted} mb-8`}>Khóa học này không tồn tại hoặc đã bị gỡ bỏ.</p>
          <Link href="/courses" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
            Quay lại danh mục
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const title = courseDetail.title;
  const subtitle = courseDetail.shortDescription;
  const fullDesc = courseDetail.fullDescription || "Đang cập nhật nội dung chi tiết...";
  const instructor = courseDetail.creator?.username || "Admin";
  const {
    rawOriginalPrice: rawPrice,
    originalPrice,
    finalPrice: price
  } = calculateCoursePricing(courseDetail, discountType, discountValue, !!discountType, courseDetail.price || 0);
  const level = courseDetail.level ? courseDetail.level.charAt(0).toUpperCase() + courseDetail.level.slice(1) : "Beginner";
  const reviewsCount = reviews.length;
  const rating = reviewsCount > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1) : 0;
  const students = 0;
  const language = "Vietnamese";

  // Map database curriculum or default fallback
  const curriculumData = courseDetail.sections && courseDetail.sections.length > 0
    ? courseDetail.sections.map((section) => ({
        module: section.title,
        lessons: section.lessons?.map((lesson) => {
          const duration = lesson.durationSeconds
            ? `${Math.floor(lesson.durationSeconds / 60)}:${(lesson.durationSeconds % 60).toString().padStart(2, "0")}`
            : "00:00";
          return {
            title: lesson.title,
            duration,
            isPreview: lesson.isPreview,
          };
        }) || [],
      }))
    : [];

  const totalLessons = curriculumData.reduce((acc, curr) => acc + curr.lessons.length, 0);

  const tabs = ["mô tả", "chương trình", "đánh giá"];

  return (
    <div className={`min-h-screen ${bg} font-sans`}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left Column */}
          <div className="flex-1 lg:max-w-3xl xl:max-w-4xl space-y-8">

            {/* Title & Meta */}
            <div className="space-y-4">
              <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight ${text}`}>
                {title}
              </h1>
              <p className={`text-lg ${muted}`}>{subtitle}</p>

              <div className={`flex flex-wrap items-center gap-4 text-sm font-medium ${muted}`}>
                <div className="flex items-center text-amber-400">
                  <Star className="w-5 h-5 fill-current mr-1.5" />
                  <span className={`font-bold ${text} mr-1`}>{rating}</span>
                  <span className={subtle}>({reviewsCount} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className={`${text} font-semibold`}>{students}</span>
                  <span>học viên</span>
                </div>
                <div>
                  Được tạo bởi{" "}
                  <span className="text-indigo-500 font-semibold">{instructor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Trình độ: {level}
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {language}
                </div>
              </div>
            </div>

            {/* Video Player */}
            <div className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden relative shadow-lg group cursor-pointer">
              {courseDetail?.thumbnailUrl ? (
                <img
                  src={courseDetail.thumbnailUrl}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 opacity-80" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  id="play-preview-btn"
                  className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all group-hover:scale-110 shadow-lg"
                >
                  <PlayCircle className="w-10 h-10 text-white fill-white/30" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white text-sm font-medium">
                <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg">Xem trước khóa học này</span>
                <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg">02:45</span>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className={`border-b ${divider}`}>
              <nav className="flex gap-0">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    id={`tab-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-sm font-semibold border-b-2 transition-colors capitalize ${
                      activeTab === tab
                        ? "border-indigo-500 text-indigo-500"
                        : `border-transparent ${muted} hover:${text} ${isDark ? "hover:border-[#252840]" : "hover:border-slate-300"}`
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="py-2 min-h-[400px]">

              {/* Description Tab */}
              {activeTab === "mô tả" && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3 className={`text-2xl font-bold ${text}`}>Về khóa học này</h3>
                    <p className={`${muted} leading-relaxed text-base whitespace-pre-line`}>
                      {fullDesc}
                    </p>
                  </div>

                  <div className={`${isDark ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-100"} rounded-2xl p-6 sm:p-8`}>
                    <h4 className={`text-xl font-bold ${text} mb-6`}>Bạn sẽ học được gì</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Build wireframes, prototypes, and high-fidelity mockups.",
                        "Understand human-centered design principles.",
                        "Master Figma and its advanced features.",
                        "Create a professional portfolio to land jobs.",
                        "Design responsive layouts for web and mobile.",
                        "Apply color theory and typography best practices.",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <span className={`text-sm font-medium ${muted}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Curriculum Tab */}
              {activeTab === "chương trình" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-2xl font-bold ${text}`}>Chương trình khóa học</h3>
                    <span className={`text-sm font-medium ${subtle} hidden sm:block`}>
                      {curriculumData.length} phần · {totalLessons} bài học tổng cộng
                    </span>
                  </div>

                  <div className="space-y-3">
                    {curriculumData.map((section, idx) => (
                      <div
                        key={idx}
                        className={`border ${divider} rounded-2xl overflow-hidden`}
                      >
                        <button
                          id={`module-toggle-${idx}`}
                          onClick={() => toggleModule(idx)}
                          className={`w-full ${isDark ? "bg-[#13151f] hover:bg-[#1a1d2e]" : "bg-slate-50 hover:bg-slate-100"} px-6 py-4 border-b ${divider} flex justify-between items-center transition-colors`}
                        >
                          <h4 className={`font-bold text-sm ${text} text-left`}>{section.module}</h4>
                          <ChevronDown
                            className={`w-5 h-5 ${muted} transition-transform shrink-0 ${
                              expandedModules.includes(idx) ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expandedModules.includes(idx) && (
                          <div className={`divide-y ${divider}`}>
                            {section.lessons.map((lesson, lIdx) => (
                              <div
                                key={lIdx}
                                className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between transition-colors gap-3 ${isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"}`}
                              >
                                <div className="flex items-center">
                                  {lesson.isPreview ? (
                                    <MonitorPlay className="w-5 h-5 text-indigo-500 mr-4 shrink-0" />
                                  ) : (
                                    <Lock className={`w-4 h-4 ${subtle} mr-4 shrink-0`} />
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      lesson.isPreview ? "text-indigo-500" : muted
                                    }`}
                                  >
                                    {lesson.title}
                                  </span>
                                </div>
                                  <div className="flex items-center gap-4 ml-9 sm:ml-0">
                                  {lesson.isPreview && (
                                    <span className="text-xs font-bold uppercase tracking-wide text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg">
                                      Xem trước
                                    </span>
                                  )}
                                  <span className={`text-sm font-medium ${subtle}`}>
                                    {lesson.duration}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "đánh giá" && (
                <div className="space-y-8">
                  <h3 className={`text-2xl font-bold ${text}`}>Đánh giá của học viên</h3>

                  {/* Rating Summary */}
                  <div className={`flex flex-col sm:flex-row items-center gap-6 p-6 border ${divider} rounded-2xl ${sectionBg}`}>
                    <div className="text-center w-full sm:w-auto shrink-0">
                      <div className={`text-5xl font-extrabold ${text}`}>{rating}</div>
                      <div className="flex justify-center text-amber-400 my-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(rating)) ? "fill-current" : ""}`} />
                        ))}
                      </div>
                      <div className={`text-sm font-medium ${muted}`}>{reviewsCount} đánh giá</div>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      {[5, 4, 3, 2, 1].map((star, i) => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const percent = reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
                        return (
                          <div key={star} className={`flex items-center text-sm font-medium ${muted}`}>
                            <span className="w-12">{star} sao</span>
                            <div className={`flex-1 h-2 mx-3 ${isDark ? "bg-[#1e2235]" : "bg-slate-100"} rounded-full overflow-hidden`}>
                              <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="w-10 text-right">{Math.round(percent)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Items */}
                  <div className="space-y-6">
                    {reviewsLoading ? (
                      <p className={`text-sm ${muted}`}>Đang tải đánh giá...</p>
                    ) : reviewsCount === 0 ? (
                      <p className={`text-sm ${muted} italic`}>Chưa có đánh giá nào cho khóa học này.</p>
                    ) : (
                      reviews.map((r) => (
                        <div key={r.id} className={`p-5 rounded-xl border ${divider} ${sectionBg}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-500">
                                {r.user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className={`font-bold text-sm ${text}`}>{r.user.username}</h4>
                                <div className="flex text-amber-400 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-current" : ""}`} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className={`text-xs ${muted}`}>
                              {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          {r.comment && (
                            <p className={`mt-3 text-sm leading-relaxed ${text}`}>
                              {r.comment}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className={`sticky top-24 border ${divider} rounded-3xl p-6 sm:p-8 shadow-xl ${isDark ? "shadow-black/30 bg-[#13151f]" : "shadow-slate-200/60 bg-white"}`}>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-3 mb-2">
                  <span className={`text-4xl font-extrabold ${text}`}>{formatVND(price)}</span>
                  {originalPrice > price && (
                    <span className={`text-lg line-through mb-1 ${subtle}`}>{formatVND(originalPrice)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                    Giảm 40% — thời gian có hạn
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3 mb-8">
                <button
                  id="enroll-now-btn"
                  onClick={handleEnrollClick}
                  disabled={!courseDetail && !checkingEnrollment}
                  className="w-full block py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center text-base transition-all shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingEnrollment ? "Đang tải..." : isEnrolled ? "Vào học ngay" : "Đăng ký ngay"}
                </button>
                <p className={`text-center text-xs font-medium ${subtle}`}>
                  Cam kết hoàn tiền trong 30 ngày
                </p>
              </div>

              {/* Course Includes */}
              <div className="space-y-4 mb-8">
                <h4 className={`font-bold text-sm ${text}`}>Khóa học này bao gồm:</h4>
                <ul className="space-y-3">
                  {[
                    { icon: MonitorPlay, label: "12 giờ video theo yêu cầu" },
                    { icon: FileText, label: "15 bài viết & tài liệu" },
                    { icon: RefreshCw, label: "Quyền truy cập trọn đời" },
                    { icon: Smartphone, label: "Truy cập trên điện thoại & máy tính" },
                    { icon: ShieldCheck, label: "Chứng chỉ hoàn thành" },
                    { icon: CheckCircle, label: "Cam kết hoàn tiền trong 30 ngày" },
                  ].map(({ icon: Icon, label }, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm font-medium ${muted}`}>
                      <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coupon */}
              <div className={`pt-6 border-t ${divider}`}>
                <label
                  htmlFor="coupon-input"
                  className={`block text-sm font-bold ${text} mb-2`}
                >
                  Áp dụng mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon-input"
                    type="text"
                    placeholder="Nhập mã"
                    className={`flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all uppercase placeholder:normal-case ${input}`}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!couponSuccess}
                  />
                  <button
                    id="apply-coupon-btn"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || !!couponSuccess}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    Áp dụng
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-rose-500 mt-2 font-medium">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-xs text-emerald-500 mt-2 font-medium">{couponSuccess}</p>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
