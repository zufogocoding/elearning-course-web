"use client";

import { useState, useEffect, use } from "react";
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
  const { id } = use(params);
  const { isDark } = useTheme();

  const course = coursesMap[id] ?? defaultCourse;
  const discount = parseFloat((course.originalPrice - course.price).toFixed(2));
  const orderRef = `ORDER-${id}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

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

  const [selectedMethod, setSelectedMethod] = useState<"vnpay" | "momo">("vnpay");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const finalPrice = couponApplied ? parseFloat((course.price * 0.9).toFixed(2)) : course.price;
  const totalDiscount = couponApplied
    ? parseFloat((course.originalPrice - finalPrice).toFixed(2))
    : discount;

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

  const handleApplyCoupon = () => {
    if (couponCode.trim().toLowerCase() === "elevate10") {
      setCouponApplied(true);
    }
  };

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
            Payment Received!
          </h1>
          <p className={`text-base ${muted} mb-8`}>
            Your enrollment is being confirmed. You&apos;ll receive an email shortly.
          </p>

          <div className={`border ${divider} rounded-2xl p-6 ${sectionBg} mb-8 text-left space-y-3`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${muted}`}>Course</span>
              <span className={`text-sm font-semibold ${text}`}>{course.title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${muted}`}>Amount paid</span>
              <span className="text-sm font-bold text-emerald-500">${finalPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${muted}`}>Order ID</span>
              <span className={`text-xs font-mono ${subtle}`}>{orderRef}</span>
            </div>
          </div>

          <Link
            href={`/courses/${id}/learn`}
            id="go-to-course-btn"
            className="w-full block py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center text-base transition-all shadow-md shadow-indigo-600/25 mb-4"
          >
            Start Learning →
          </Link>
          <Link href="/courses" className={`text-sm ${muted} hover:text-indigo-500 transition-colors`}>
            Browse more courses
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
          <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Checkout</h1>
          <p className={`text-sm mt-1 ${muted}`}>Complete your purchase to get instant access.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ─────────────────── LEFT: Order Summary ─────────────────── */}
          <div className="w-full lg:flex-1 space-y-5">
            <div className={`border ${divider} rounded-2xl overflow-hidden ${sectionBg}`}>
              <div className={`px-6 py-4 border-b ${divider}`}>
                <h2 className={`font-bold text-base ${text}`}>Order Summary</h2>
              </div>

              <div className="p-6 space-y-5">
                {/* Course Card */}
                <div className="flex gap-4">
                  <div className={`w-24 h-16 bg-gradient-to-br ${course.gradient} rounded-xl shrink-0 shadow-md`} />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm leading-snug ${text} line-clamp-2`}>
                      {course.title}
                    </h3>
                    <p className={`text-xs mt-1 ${muted}`}>{course.instructor}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-400 text-xs font-bold">{course.rating}</span>
                      <span className="text-amber-400 text-xs">★★★★★</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className={`space-y-3 border-t ${divider} pt-5`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${muted}`}>Original price</span>
                    <span className={`text-sm line-through ${subtle}`}>${course.originalPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-500 font-medium">Discount</span>
                    <span className="text-sm text-emerald-500 font-semibold">−${discount}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Coupon (ELEVATE10)
                      </span>
                      <span className="text-sm text-emerald-500 font-semibold">−10%</span>
                    </div>
                  )}

                  {/* Coupon Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      id="coupon-code-input"
                      type="text"
                      placeholder="Coupon code (try ELEVATE10)"
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
                      {couponApplied ? "Applied ✓" : "Apply"}
                    </button>
                  </div>

                  <div className={`border-t ${divider} pt-3`} />

                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-base ${text}`}>Total</span>
                    <div className="text-right">
                      <span className={`text-2xl font-extrabold ${text}`}>${finalPrice}</span>
                      {couponApplied && (
                        <div className="text-xs text-emerald-500 font-medium">You saved ${totalDiscount}!</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className={`border-t ${divider} pt-5 space-y-2.5`}>
                  {[
                    { icon: RefreshCw, label: "Lifetime access to course content" },
                    { icon: Award, label: "Certificate of completion" },
                    { icon: Shield, label: "30-day money-back guarantee" },
                    { icon: Smartphone, label: "Access on mobile & desktop" },
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
                    Secure checkout · SSL encrypted · PCI compliant
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────── RIGHT: Payment ─────────────────── */}
          <div className="w-full lg:w-[420px] shrink-0 space-y-5">
            <div className={`border ${divider} rounded-2xl overflow-hidden ${sectionBg}`}>
              <div className={`px-6 py-4 border-b ${divider}`}>
                <h2 className={`font-bold text-base ${text}`}>Select Payment Method</h2>
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
                    Payment expires in {formatTime(timeLeft)}
                  </span>
                  {timeLeft === 0 && (
                    <button
                      id="refresh-timer-btn"
                      onClick={() => setTimeLeft(900)}
                      className="ml-1 text-xs text-amber-500 underline"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-4">
                  <QRCodeVisual method={selectedMethod} />
                  <p className={`text-xs text-center ${muted} max-w-[200px]`}>
                    Scan with your{" "}
                    <span className="font-bold">
                      {selectedMethod === "vnpay" ? "VNPay" : "MoMo"}
                    </span>{" "}
                    app to complete payment
                  </p>
                </div>

                {/* Bank Details */}
                <div className={`space-y-2.5 p-4 rounded-xl border ${divider} ${isDark ? "bg-[#0d0f1a]" : "bg-slate-50"}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${subtle} mb-3`}>
                    {selectedMethod === "vnpay" ? "Bank Transfer Details" : "MoMo Details"}
                  </h4>
                  {[
                    {
                      label: selectedMethod === "vnpay" ? "Bank" : "Wallet",
                      value: selectedMethod === "vnpay" ? "VietcomBank" : "MoMo Wallet",
                      key: "bank",
                    },
                    {
                      label: selectedMethod === "vnpay" ? "Account No." : "Phone",
                      value: selectedMethod === "vnpay" ? "1234567890" : "0901234567",
                      key: "account",
                    },
                    { label: "Amount", value: `${finalPrice} USD`, key: "amount" },
                    { label: "Content / Note", value: orderRef, key: "ref" },
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

                {/* Confirm Button */}
                <button
                  id="confirm-payment-btn"
                  onClick={() => setPaid(true)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/40 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  I&apos;ve Completed Payment
                </button>

                <div className="text-center">
                  <Link
                    href={`/courses/${id}`}
                    id="cancel-order-link"
                    className={`text-sm ${subtle} hover:${muted} transition-colors underline underline-offset-2`}
                  >
                    Cancel Order
                  </Link>
                </div>
              </div>
            </div>

            {/* Security Badges */}
            <div className={`flex items-center justify-center gap-4 text-xs ${subtle}`}>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                SSL Encrypted
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Instant Access
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Certified
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
