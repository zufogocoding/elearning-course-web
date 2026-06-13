"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { calculateCoursePricing } from "@/lib/pricing";
import { useTheme } from "@/components/ui/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import {
  CheckCircle, Clock, Shield, Smartphone, Award,
  Copy, TimerIcon, RefreshCw, Tag
} from "lucide-react";

/* ─── Mock course data lookup ─────────────────────────────── */
const coursesMap: Record<string, { title: string; instructor: string; rating: number; price: number; originalPrice: number; gradient: string }> = {
  "1": { title: "UI/UX Design Masterclass", instructor: "Jane Doe", rating: 4.8, price: 89.99, originalPrice: 149.99, gradient: "from-violet-500 via-purple-500 to-indigo-600" },
  "2": { title: "Advanced React Patterns", instructor: "John Smith", rating: 4.9, price: 129.99, originalPrice: 199.99, gradient: "from-cyan-500 via-blue-500 to-indigo-600" },
  "3": { title: "Digital Marketing 2026", instructor: "Sarah Jenkins", rating: 4.7, price: 94.99, originalPrice: 159.99, gradient: "from-rose-500 via-pink-500 to-fuchsia-600" },
  "4": { title: "Python for Data Science", instructor: "Mike Chen", rating: 4.8, price: 74.99, originalPrice: 124.99, gradient: "from-emerald-500 via-teal-500 to-cyan-600" },
  "5": { title: "Node.js & Express Backend", instructor: "Alex Rivera", rating: 4.6, price: 109.99, originalPrice: 179.99, gradient: "from-amber-500 via-orange-500 to-red-500" },
  "6": { title: "Figma UI Design", instructor: "Emma Wilson", rating: 4.9, price: 69.99, originalPrice: 119.99, gradient: "from-sky-500 via-blue-400 to-indigo-500" },
  "7": { title: "AWS Cloud Practitioner", instructor: "David Lee", rating: 4.7, price: 149.99, originalPrice: 249.99, gradient: "from-orange-500 via-amber-500 to-yellow-400" },
  "8": { title: "Business Strategy MBA", instructor: "Rachel Kim", rating: 4.8, price: 199.99, originalPrice: 299.99, gradient: "from-indigo-500 via-violet-500 to-purple-600" },
};

const defaultCourse = {
  title: "Course Title",
  instructor: "Instructor",
  rating: 4.8,
  price: 89.99,
  originalPrice: 149.99,
  gradient: "from-violet-500 via-purple-500 to-indigo-600",
};

/* ─── QR Code Visual Component ────────────────────────────── */
function QRCodeVisual({ method }: { method: "vnpay" | "momo" }) {
  const { isDark } = useTheme();
  const borderColor = method === "vnpay" ? "border-indigo-500" : "border-pink-500";
  const badgeBg = method === "vnpay" ? "bg-indigo-600" : "bg-pink-500";
  const cellColor = isDark ? "bg-[#e2e8f0]" : "bg-slate-800";

  // Deterministic pseudo-random grid
  const grid: boolean[][] = Array.from({ length: 21 }, (_, r) =>
    Array.from({ length: 21 }, (_, c) => {
      // Finder patterns top-left (0-6), top-right (14-20), bottom-left (14-20 row)
      const inTL = r < 7 && c < 7;
      const inTR = r < 7 && c > 13;
      const inBL = r > 13 && c < 7;
      if (inTL || inTR || inBL) {
        // Outer border of finder
        if (r === 0 || r === 6 || c === 0 || c === 6) return true;
        if (r === 1 || r === 5 || c === 1 || c === 5) return false;
        return true; // inner block
      }
      // Timing patterns
      if ((r === 6 || c === 6) && !inTL && !inTR && !inBL) return (r + c) % 2 === 0;
      // Data area: pseudo-random but deterministic
      const seed = (r * 31 + c * 17 + r * c) % 7;
      return seed < 3;
    })
  );

  return (
    <div className={`relative inline-flex flex-col items-center p-3 border-4 ${borderColor} rounded-2xl ${isDark ? "bg-[#13151f]" : "bg-white"}`}>
      {/* QR Grid */}
      <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(21, 1fr)", width: 252 }}>
        {grid.map((row, r) =>
          row.map((on, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-3 h-3 rounded-sm transition-colors ${on ? cellColor : "bg-transparent"}`}
            />
          ))
        )}
      </div>
      {/* Center Logo Badge */}
      <div className={`absolute inset-0 flex items-center justify-center`}>
        <div className={`w-14 h-14 ${badgeBg} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-white font-extrabold text-xs leading-tight text-center px-1">
            {method === "vnpay" ? "VN\nPAY" : "MoMo"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // id is the slug
  const { isDark } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courseDetail, setCourseDetail] = useState<any>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState<"vnpay" | "momo">("vnpay");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/checkout/${id}`);
      return;
    }

    const loadData = async () => {
      try {
        // 1. Fetch course details
        const res = await api.get(`/api/courses/${id}`);
        if (!res.ok) {
          router.push("/courses");
          return;
        }
        const data = await res.json();
        setCourseDetail(data);
        setOrderRef(`ORDER-${data.id}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

        // 2. Check if user is already enrolled
        const myRes = await api.get("/api/learning/my-courses");
        if (myRes.ok) {
          const myData = await myRes.json();
          const coursesList = myData.data || [];
          const enrolled = coursesList.some((c: any) => c.courseId === data.id);
          if (enrolled) {
            setIsEnrolled(true);
            router.push(`/courses/${id}/learn`);
            return;
          }
        }

        // 3. Auto-apply coupon from URL if present
        const urlCoupon = searchParams.get("coupon");
        if (urlCoupon) {
          setCouponCode(urlCoupon);
          const couponRes = await api.get(`/api/enrollments/coupon/${urlCoupon.trim()}`);
          if (couponRes.ok) {
            const cResult = await couponRes.json();
            const { discountType: type, discountValue: val } = cResult.coupon;
            setDiscountType(type);
            setDiscountValue(Number(val));
            setCouponApplied(true);
            setCouponSuccess(`Áp dụng mã ${urlCoupon.toUpperCase()} thành công!`);
          }
        }
      } catch (err) {
        console.error("Error loading checkout details", err);
      } finally {
        setLoadingCourse(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, authLoading, id, router, searchParams]);

  const {
    rawOriginalPrice,
    originalPrice,
    basePrice,
    couponDiscount,
    finalPrice,
    totalDiscount,
    discount
  } = calculateCoursePricing(courseDetail, discountType, discountValue, couponApplied, 0);

  useEffect(() => {
    if (paid) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paid]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const res = await api.get(`/api/enrollments/coupon/${couponCode.trim()}`);
      if (res.ok) {
        const result = await res.json();
        const { discountType: type, discountValue: val } = result.coupon;
        setDiscountType(type);
        setDiscountValue(Number(val));
        setCouponApplied(true);
        setCouponSuccess(`Áp dụng mã ${couponCode.toUpperCase()} thành công!`);
      } else {
        const errorData = await res.json();
        setCouponError(errorData.error || "Mã giảm giá không hợp lệ.");
      }
    } catch {
      setCouponError("Lỗi kết nối khi kiểm tra mã giảm giá.");
    }
  };

  const handleCheckout = async () => {
    if (!courseDetail) return;
    setCheckoutLoading(true);
    try {
      const res = await api.post('/api/enrollments/checkout', {
        courseId: courseDetail.id,
        couponCode: couponApplied ? couponCode.trim() : undefined,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isFree) {
          setPaid(true);
        } else if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Giao dịch thanh toán thất bại.");
      }
    } catch (err) {
      console.error("Error creating payment transaction", err);
      alert("Lỗi kết nối server khi khởi tạo thanh toán.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const mockGradients = [
    "from-violet-500 via-purple-500 to-indigo-600",
    "from-cyan-500 via-blue-500 to-indigo-600",
    "from-rose-500 via-pink-500 to-fuchsia-600",
    "from-emerald-500 via-teal-500 to-cyan-600",
    "from-amber-500 via-orange-500 to-red-500",
    "from-sky-500 via-blue-400 to-indigo-500",
  ];
  const gradient = courseDetail?.id ? mockGradients[courseDetail.id % mockGradients.length] : "from-violet-500 via-purple-500 to-indigo-600";

  if (authLoading || loadingCourse) {
    return (
      <div className={`min-h-screen ${bg} font-sans`}>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className={`${muted} text-sm font-semibold`}>Đang tải thông tin thanh toán...</p>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Success Screen ── */

  if (paid) {
    return (
      <div className={`min-h-screen ${bg} font-sans`}>
        <Header />
        <main className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/30">
            <CheckCircle className="w-12 h-12 text-emerald-500 fill-emerald-500/20" />
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${text} mb-3`}>
            Đã nhận thanh toán!
          </h1>
          <p className={`text-base ${muted} mb-8`}>
            Đăng ký của bạn đang được xác nhận. Bạn sẽ nhận được email trong chốc lát.
          </p>

          <div className={`border ${divider} rounded-2xl p-6 ${sectionBg} mb-8 text-left space-y-3`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${muted}`}>Khóa học</span>
              <span className={`text-sm font-semibold ${text}`}>{courseDetail?.title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${muted}`}>Số tiền đã thanh toán</span>
              <span className="text-sm font-bold text-emerald-500">${finalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${muted}`}>Mã đơn hàng</span>
              <span className={`text-xs font-mono ${subtle}`}>{orderRef}</span>
            </div>
          </div>

          <Link
            href={`/courses/${id}/learn`}
            id="go-to-course-btn"
            className="w-full block py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center text-base transition-all shadow-md shadow-indigo-600/25 mb-4"
          >
            Bắt đầu học →
          </Link>
          <Link href="/courses" className={`text-sm ${muted} hover:text-indigo-500 transition-colors`}>
            Duyệt thêm khóa học
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Main Checkout ── */
  return (
    <div className={`min-h-screen ${bg} font-sans`}>
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Thanh toán</h1>
          <p className={`text-sm mt-1 ${muted}`}>Hoàn tất giao dịch mua để truy cập ngay.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ─────────────────── LEFT: Order Summary ─────────────────── */}
          <div className="w-full lg:flex-1 space-y-5">
            <div className={`border ${divider} rounded-2xl overflow-hidden ${sectionBg}`}>
              <div className={`px-6 py-4 border-b ${divider}`}>
                <h2 className={`font-bold text-base ${text}`}>Tóm tắt đơn hàng</h2>
              </div>

              <div className="p-6 space-y-5">
                {/* Course Card */}
                <div className="flex gap-4">
                  {courseDetail?.thumbnailUrl ? (
                    <img
                      src={courseDetail.thumbnailUrl}
                      alt={courseDetail.title}
                      className="w-24 h-16 object-cover rounded-xl shrink-0 shadow-md"
                    />
                  ) : (
                    <div className={`w-24 h-16 bg-gradient-to-br ${gradient} rounded-xl shrink-0 shadow-md`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm leading-snug ${text} line-clamp-2`}>
                      {courseDetail?.title}
                    </h3>
                    <p className={`text-xs mt-1 ${muted}`}>bởi {courseDetail?.creator?.username || "Admin"}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-400 text-xs font-bold">4.8</span>
                      <span className="text-amber-400 text-xs">★★★★★</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className={`space-y-3 border-t ${divider} pt-5`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${muted}`}>Giá gốc</span>
                    <span className={`text-sm line-through ${subtle}`}>${originalPrice.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-500 font-medium">Giảm giá khóa học</span>
                      <span className="text-sm text-emerald-500 font-semibold">−${discount.toFixed(2)}</span>
                    </div>
                  )}
                  {couponApplied && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Mã giảm giá ({couponCode.toUpperCase()})
                      </span>
                      <span className="text-sm text-emerald-500 font-semibold">
                        {discountType?.toLowerCase() === 'percent' ? `−${discountValue}%` : `−$${discountValue}`}
                      </span>
                    </div>
                  )}

                  {/* Coupon Input */}
                  <div className="space-y-1">
                    <div className="flex gap-2 pt-1">
                      <input
                        id="coupon-code-input"
                        type="text"
                        placeholder="Mã giảm giá (ví dụ SUMMER2026)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied}
                        className={`flex-1 px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 transition-all ${input} ${couponApplied ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                      <button
                        id="apply-coupon-checkout-btn"
                        onClick={handleApplyCoupon}
                        disabled={couponApplied || !couponCode.trim()}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all"
                      >
                        {couponApplied ? "Đã áp dụng ✓" : "Áp dụng"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">{couponError}</p>
                    )}
                    {couponSuccess && (
                      <p className="text-[11px] text-emerald-500 font-medium mt-1">{couponSuccess}</p>
                    )}
                  </div>

                  <div className={`border-t ${divider} pt-3`} />

                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-base ${text}`}>Tổng cộng</span>
                    <div className="text-right">
                      <span className={`text-2xl font-extrabold ${text}`}>${finalPrice.toFixed(2)}</span>
                      {couponApplied && (
                        <div className="text-xs text-emerald-500 font-medium">Bạn đã tiết kiệm ${totalDiscount.toFixed(2)}!</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className={`border-t ${divider} pt-5 space-y-2.5`}>
                  {[
                    { icon: RefreshCw, label: "Truy cập trọn đời nội dung khóa học" },
                    { icon: Award, label: "Chứng chỉ hoàn thành" },
                    { icon: Shield, label: "Cam kết hoàn tiền trong 30 ngày" },
                    { icon: Smartphone, label: "Truy cập trên điện thoại & máy tính" },
                  ].map(({ icon: Icon, label }, i) => (
                    <div key={i} className={`flex items-center gap-3 text-sm ${muted}`}>
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* SSL Notice */}
                <div className={`flex items-center justify-center gap-2 pt-2 border-t ${divider}`}>
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className={`text-xs font-medium ${subtle}`}>
                    Thanh toán an toàn · Mã hóa SSL · Tuân thủ PCI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────── RIGHT: Payment ─────────────────── */}
          <div className="w-full lg:w-[420px] shrink-0 space-y-5">
            <div className={`border ${divider} rounded-2xl overflow-hidden ${sectionBg}`}>
              <div className={`px-6 py-4 border-b ${divider}`}>
                <h2 className={`font-bold text-base ${text}`}>Chọn phương thức thanh toán</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Method Tabs */}
                <div className={`flex gap-2 p-1 ${isDark ? "bg-[#0d0f1a]" : "bg-slate-100"} rounded-xl`}>
                  {(["vnpay", "momo"] as const).map((method) => (
                    <button
                      key={method}
                      id={`method-tab-${method}`}
                      onClick={() => setSelectedMethod(method)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        selectedMethod === method
                          ? method === "vnpay"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-pink-500 text-white shadow-md shadow-pink-500/30"
                          : `${muted} hover:${text}`
                      }`}
                    >
                      {method === "vnpay" ? "VNPay QR" : "MoMo"}
                    </button>
                  ))}
                </div>

                {/* Timer */}
                <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${
                  timeLeft < 60
                    ? "bg-rose-500/10 border border-rose-500/30"
                    : isDark
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-amber-50 border border-amber-200"
                }`}>
                  <TimerIcon className={`w-4 h-4 ${timeLeft < 60 ? "text-rose-500" : "text-amber-500"}`} />
                  <span className={`text-sm font-bold ${timeLeft < 60 ? "text-rose-500" : "text-amber-500"}`}>
                    Thanh toán hết hạn trong {formatTime(timeLeft)}
                  </span>
                  {timeLeft === 0 && (
                    <button
                      id="refresh-timer-btn"
                      onClick={() => setTimeLeft(900)}
                      className="ml-1 text-xs text-amber-500 underline"
                    >
                      Làm mới
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <QRCodeVisual method={selectedMethod} />
                  <p className={`text-xs text-center ${muted} max-w-[200px]`}>
                    Quét bằng ứng dụng{" "}
                    <span className="font-bold">
                      {selectedMethod === "vnpay" ? "VNPay" : "MoMo"}
                    </span>{" "}
                    của bạn để hoàn tất thanh toán
                  </p>
                </div>

                <div className={`space-y-2.5 p-4 rounded-xl border ${divider} ${isDark ? "bg-[#0d0f1a]" : "bg-slate-50"}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${subtle} mb-3`}>
                    {selectedMethod === "vnpay" ? "Chi tiết chuyển khoản ngân hàng" : "Chi tiết MoMo"}
                  </h4>
                  {[
                    {
                      label: selectedMethod === "vnpay" ? "Ngân hàng" : "Ví",
                      value: selectedMethod === "vnpay" ? "VietcomBank" : "MoMo Wallet",
                      key: "bank",
                    },
                    {
                      label: selectedMethod === "vnpay" ? "Số tài khoản" : "Số điện thoại",
                      value: selectedMethod === "vnpay" ? "1234567890" : "0901234567",
                      key: "account",
                    },
                    { label: "Số tiền", value: `${finalPrice} USD`, key: "amount" },
                    { label: "Nội dung / Ghi chú", value: orderRef, key: "ref" },
                  ].map(({ label, value, key }) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className={`text-xs ${subtle} w-24 shrink-0`}>{label}</span>
                      <span className={`text-xs font-semibold ${text} flex-1 truncate`}>{value}</span>
                      <button
                        id={`copy-${key}-btn`}
                        onClick={() => copyToClipboard(value, key)}
                        className={`p-1.5 rounded-lg transition-all ${
                          copied === key
                            ? "bg-emerald-500/20 text-emerald-500"
                            : `${isDark ? "bg-[#1a1d2e] hover:bg-[#252840] text-[#7a87a1]" : "bg-slate-200 hover:bg-slate-300 text-slate-500"}`
                        }`}
                        title="Copy"
                      >
                        {copied === key ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  id="confirm-payment-btn"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || timeLeft === 0}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {selectedMethod === "vnpay" ? "Thanh toán qua VNPAY Sandbox" : "Thanh toán ngay"}
                </button>

                <div className="text-center">
                  <Link
                    href={`/courses/${id}`}
                    id="cancel-order-link"
                    className={`text-sm ${subtle} hover:${muted} transition-colors underline underline-offset-2`}
                  >
                    Hủy đơn hàng
                  </Link>
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-center gap-4 text-xs ${subtle}`}>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Mã hóa SSL
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Truy cập ngay lập tức
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Được chứng nhận
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
