"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ui/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import {
  CheckCircle, Clock, Shield, Smartphone, Award,
  Tag, Loader2, ExternalLink, BookOpen,
  CreditCard, Lock, ChevronRight, X, Ticket
} from "lucide-react";

import { formatVND } from "@/lib/pricing";

/* ─── Main Page ────────────────────────────────────────────── */
export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // id is the slug
  const { isDark } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courseDetail, setCourseDetail] = useState<any>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountType, setDiscountType] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"vietqr" | "vnpay">("vietqr");

  // Theme
  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const subtle = isDark ? "text-[#4a5568]" : "text-slate-400";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const inputCls = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40 focus:border-indigo-500"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40 focus:border-indigo-400";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/checkout/${id}`);
      return;
    }

    const loadData = async () => {
      try {
        const res = await api.get(`/api/courses/${id}`);
        if (!res.ok) {
          router.push("/courses");
          return;
        }
        const data = await res.json();
        setCourseDetail(data.data);

        // Check if already enrolled → redirect to learn
        const myRes = await api.get("/api/learning/my-courses");
        if (myRes.ok) {
          const myData = await myRes.json();
          const enrolled = (myData.data || []).some((c: any) => c.courseId === data.data.id);
          if (enrolled) {
            router.push(`/courses/${id}/learn`);
            return;
          }
        }

        // Auto-apply coupon from URL
        const urlCoupon = searchParams.get("coupon");
        if (urlCoupon) {
          setCouponCode(urlCoupon.toUpperCase());
          await applyCouponCode(urlCoupon.trim(), data.data.id);
        }
      } catch (err) {
        console.error("Error loading checkout details", err);
      } finally {
        setLoadingCourse(false);
      }
    };

    if (user) loadData();
  }, [user, authLoading, id]);

  const applyCouponCode = async (code: string, cId?: number) => {
    setCouponError(null);
    setCouponLoading(true);
    const targetCourseId = cId || courseDetail?.id;
    try {
      const url = targetCourseId
        ? `/api/enrollments/coupon/${code.trim().toUpperCase()}?courseId=${targetCourseId}`
        : `/api/enrollments/coupon/${code.trim().toUpperCase()}`;
      const res = await api.get(url);
      if (res.ok) {
        const result = await res.json();
        const { discountType: type, discountValue: val } = result.coupon;
        setDiscountType(type);
        setDiscountValue(Number(val));
        setCouponApplied(true);
      } else {
        const errorData = await res.json();
        setCouponError(errorData.error || "Mã giảm giá không hợp lệ.");
        setCouponApplied(false);
      }
    } catch {
      setCouponError("Lỗi kết nối khi kiểm tra mã giảm giá.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim() || !courseDetail) return;
    applyCouponCode(couponCode, courseDetail.id);
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setDiscountType(null);
    setDiscountValue(0);
    setCouponError(null);
  };

  const handleCheckout = async () => {
    if (!courseDetail) return;
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const res = await api.post("/api/enrollments/checkout", {
        courseId: courseDetail.id,
        couponCode: couponApplied ? couponCode.trim().toUpperCase() : undefined,
        paymentMethod: paymentMethod,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isFree) {
          // Free course → redirect to learn page directly
          router.push(`/courses/${id}/learn`);
        } else if (data.paymentUrl) {
          // Paid course → redirect to payment gateway
          window.location.href = data.paymentUrl;
        }
      } else {
        const errorData = await res.json();
        setCheckoutError(errorData.error || "Không thể khởi tạo giao dịch. Vui lòng thử lại.");
      }
    } catch {
      setCheckoutError("Lỗi kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Pricing Calculation ──
  const rawPrice = courseDetail?.price ? Number(courseDetail.price) : 0;
  const basePrice = courseDetail?.discountPrice ? Number(courseDetail.discountPrice) : rawPrice;
  const displayOriginalPrice = courseDetail?.discountPrice ? rawPrice : Math.round(rawPrice * 1.35);

  let couponDiscount = 0;
  if (couponApplied && discountType) {
    if (discountType.toLowerCase() === "percent") {
      couponDiscount = (basePrice * discountValue) / 100;
    } else {
      couponDiscount = discountValue;
    }
  }
  const finalPrice = Math.max(0, basePrice - couponDiscount);
  const isFree = finalPrice === 0;

  const mockGradients = [
    "from-violet-500 via-purple-500 to-indigo-600",
    "from-cyan-500 via-blue-500 to-indigo-600",
    "from-rose-500 via-pink-500 to-fuchsia-600",
    "from-emerald-500 via-teal-500 to-cyan-600",
    "from-amber-500 via-orange-500 to-red-500",
  ];
  const gradient = courseDetail?.id
    ? mockGradients[courseDetail.id % mockGradients.length]
    : "from-violet-500 via-purple-500 to-indigo-600";

  if (authLoading || loadingCourse) {
    return (
      <div className={`min-h-screen ${bg} font-sans flex flex-col`}>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className={`text-sm font-semibold ${muted}`}>Đang tải thông tin thanh toán...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} font-sans`}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className={`flex items-center gap-1.5 text-xs ${muted} mb-6`}>
          <Link href="/courses" className="hover:text-indigo-500 transition-colors">Khóa học</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/courses/${id}`} className="hover:text-indigo-500 transition-colors truncate max-w-[200px]">
            {courseDetail?.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className={text}>Thanh toán</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ─── LEFT: Course Info + Coupon ─────────────────────── */}
          <div className="w-full lg:flex-1 space-y-5">

            {/* Course Card */}
            <div className={`border ${divider} rounded-2xl overflow-hidden ${sectionBg} shadow-sm`}>
              <div className={`px-5 py-4 border-b ${divider} flex items-center gap-2`}>
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h2 className={`font-bold text-sm ${text}`}>Thông tin khóa học</h2>
              </div>
              <div className="p-5 flex gap-4">
                {courseDetail?.thumbnailUrl ? (
                  <img
                    src={courseDetail.thumbnailUrl}
                    alt={courseDetail.title}
                    className="w-20 h-14 object-cover rounded-xl shrink-0 shadow-md"
                  />
                ) : (
                  <div className={`w-20 h-14 bg-gradient-to-br ${gradient} rounded-xl shrink-0 shadow-md`} />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base leading-snug ${text} line-clamp-2`}>
                    {courseDetail?.title}
                  </h3>
                  <p className={`text-xs mt-1 ${muted}`}>
                    bởi <span className="font-semibold">{courseDetail?.creator?.username || "Giảng viên"}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}>
                      {courseDetail?.level || "beginner"}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${muted}`}>
                      <Clock className="w-3 h-3" />
                      Truy cập trọn đời
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon Section */}
            <div className={`border ${divider} rounded-2xl ${sectionBg} shadow-sm`}>
              <div className={`px-5 py-4 border-b ${divider} flex items-center gap-2`}>
                <Ticket className="w-4 h-4 text-indigo-500" />
                <h2 className={`font-bold text-sm ${text}`}>Mã giảm giá</h2>
              </div>
              <div className="p-5">
                {couponApplied ? (
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Tag className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-500">{couponCode.toUpperCase()}</p>
                        <p className={`text-xs ${muted}`}>
                          Giảm {discountType?.toLowerCase() === "percent" ? `${discountValue}%` : formatVND(discountValue)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className={`p-1.5 rounded-full transition-all ${isDark ? "hover:bg-[#22263a] text-[#7a87a1]" : "hover:bg-slate-100 text-slate-500"}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        id="coupon-code-input"
                        type="text"
                        placeholder="Nhập mã giảm giá (VD: SUMMER2026)"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        className={`flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all ${inputCls}`}
                      />
                      <button
                        id="apply-coupon-btn"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-rose-500 font-medium mt-2 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            {!isFree && (
              <div className={`border ${divider} rounded-2xl ${sectionBg} shadow-sm overflow-hidden`}>
                <div className={`px-5 py-4 border-b ${divider} flex items-center gap-2`}>
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <h2 className={`font-bold text-sm ${text}`}>Phương thức thanh toán</h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* VietQR Option */}
                  <div
                    onClick={() => setPaymentMethod("vietqr")}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "vietqr"
                        ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500"
                        : `border-transparent ${isDark ? "bg-[#1a1d2e] hover:bg-[#22263a]" : "bg-slate-50 hover:bg-slate-100"}`
                    }`}
                  >
                    <div className="flex items-center justify-center mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "vietqr" ? "border-indigo-600" : "border-slate-400"
                      }`}>
                        {paymentMethod === "vietqr" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-bold text-sm ${text}`}>Chuyển khoản VietQR (PayOS)</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Khuyên dùng
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          Miễn phí
                        </span>
                      </div>
                      <p className={`text-xs ${muted} mt-1.5`}>
                        Quét mã QR bằng App Ngân hàng bất kỳ để chuyển khoản tự động. Kích hoạt học ngay tức thì sau khi chuyển thành công.
                      </p>
                    </div>
                  </div>

                  {/* VNPAY Option */}
                  <div
                    onClick={() => setPaymentMethod("vnpay")}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "vnpay"
                        ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500"
                        : `border-transparent ${isDark ? "bg-[#1a1d2e] hover:bg-[#22263a]" : "bg-slate-50 hover:bg-slate-100"}`
                    }`}
                  >
                    <div className="flex items-center justify-center mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "vnpay" ? "border-indigo-600" : "border-slate-400"
                      }`}>
                        {paymentMethod === "vnpay" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className={`font-bold text-sm ${text}`}>Cổng thanh toán VNPAY</span>
                      <p className={`text-xs ${muted} mt-1.5`}>
                        Thanh toán bằng ví điện tử VNPAY, ứng dụng ngân hàng liên kết, thẻ ATM nội địa hoặc thẻ quốc tế Visa, Mastercard, JCB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guarantees */}
            <div className={`border ${divider} rounded-2xl p-5 ${sectionBg} shadow-sm`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${subtle} mb-3`}>Cam kết khi mua</h3>
              <div className="space-y-2.5">
                {[
                  { icon: Shield, label: "Bảo hành hoàn tiền trong 30 ngày" },
                  { icon: Award, label: "Chứng chỉ hoàn thành có giá trị" },
                  { icon: Clock, label: "Truy cập trọn đời, không hết hạn" },
                  { icon: Smartphone, label: "Học trên mọi thiết bị" },
                  { icon: Lock, label: "Thanh toán bảo mật, an toàn" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className={`flex items-center gap-3 text-sm ${muted}`}>
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Order Summary + Checkout Button ─────────── */}
          <div className="w-full lg:w-[380px] shrink-0 space-y-5">

            {/* Price Summary Card */}
            <div className={`border ${divider} rounded-2xl overflow-hidden shadow-sm ${sectionBg}`}>
              <div className={`px-5 py-4 border-b ${divider} flex items-center gap-2`}>
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <h2 className={`font-bold text-sm ${text}`}>Tóm tắt đơn hàng</h2>
              </div>

              <div className="p-5 space-y-4">
                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${muted}`}>Giá gốc</span>
                    <span className={`text-sm ${basePrice < displayOriginalPrice ? `line-through ${subtle}` : `font-semibold ${text}`}`}>
                      {formatVND(displayOriginalPrice)}
                    </span>
                  </div>

                  {basePrice < displayOriginalPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-500 font-medium">Giảm giá khóa học</span>
                      <span className="text-sm text-emerald-500 font-semibold">
                        −{formatVND(displayOriginalPrice - basePrice)}
                      </span>
                    </div>
                  )}

                  {couponApplied && couponDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Mã {couponCode.toUpperCase()}
                      </span>
                      <span className="text-sm text-emerald-500 font-semibold">
                        −{discountType?.toLowerCase() === "percent" ? `${discountValue}%` : formatVND(couponDiscount)}
                      </span>
                    </div>
                  )}

                  <div className={`border-t ${divider} pt-3 flex justify-between items-center`}>
                    <span className={`font-bold text-base ${text}`}>Tổng cộng</span>
                    <div className="text-right">
                      <p className={`text-2xl font-extrabold ${isFree ? "text-emerald-500" : text}`}>
                        {isFree ? "Miễn phí" : formatVND(finalPrice)}
                      </p>
                      {couponApplied && couponDiscount > 0 && (
                        <p className="text-xs text-emerald-500 font-medium mt-0.5">
                          Tiết kiệm {formatVND(displayOriginalPrice - finalPrice)}!
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {checkoutError && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-500 font-medium">{checkoutError}</p>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  id="confirm-payment-btn"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className={`w-full py-4 font-bold rounded-xl text-base transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg ${
                    isFree
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 hover:shadow-emerald-600/40"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5"
                  }`}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : isFree ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Đăng ký miễn phí
                    </>
                  ) : paymentMethod === "vietqr" ? (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      Thanh toán VietQR (PayOS)
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      Thanh toán qua VNPAY
                    </>
                  )}
                </button>

                {!isFree && (
                  <div className={`flex items-center justify-center gap-2 text-xs ${subtle}`}>
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      {paymentMethod === "vietqr"
                        ? "Thanh toán VietQR an toàn qua cổng PayOS"
                        : "Chuyển đến cổng thanh toán VNPAY an toàn (sandbox)"}
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <Link
                    href={`/courses/${id}`}
                    id="cancel-order-link"
                    className={`text-sm ${muted} hover:text-rose-500 transition-colors`}
                  >
                    ← Quay lại khóa học
                  </Link>
                </div>
              </div>
            </div>

            {/* Dynamic Payment Info Box */}
            {!isFree && (
              paymentMethod === "vietqr" ? (
                <div className={`border ${divider} rounded-2xl p-4 ${sectionBg} shadow-sm`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-extrabold text-xs leading-tight text-center">Viet{"\n"}QR</span>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${text}`}>Thanh toán chuyển khoản VietQR</p>
                      <p className={`text-xs ${muted}`}>Kênh PayOS • Miễn phí dịch vụ • Kích hoạt tức thì</p>
                    </div>
                  </div>
                  <div className={`space-y-1.5 text-xs ${muted}`}>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-[#22263a]" : "bg-slate-50"}`}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Nhận thông tin chuyển khoản chính xác qua mã QR tự động
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-[#22263a]" : "bg-slate-50"}`}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Không cần nhập số tài khoản và số tiền thủ công
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-[#22263a]" : "bg-slate-50"}`}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Kích hoạt khóa học ngay sau khi giao dịch thành công
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`border ${divider} rounded-2xl p-4 ${sectionBg} shadow-sm`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-extrabold text-xs leading-tight text-center">VN{"\n"}PAY</span>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${text}`}>Thanh toán qua VNPAY</p>
                      <p className={`text-xs ${muted}`}>Hỗ trợ ATM, Visa, MasterCard, QR Code</p>
                    </div>
                  </div>
                  <div className={`space-y-1.5 text-xs ${muted}`}>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-[#22263a]" : "bg-slate-50"}`}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Mã hóa SSL 256-bit, PCI DSS compliant
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-[#22263a]" : "bg-slate-50"}`}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Xác nhận thanh toán tức thì từ cổng giao dịch
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? "bg-[#22263a]" : "bg-slate-50"}`}>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Sandbox testing – không trừ tiền thật của tài khoản
                    </div>
                  </div>
                </div>
              )
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
