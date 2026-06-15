"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "@/components/ui/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  CheckCircle, AlertTriangle, BookOpen, ArrowRight,
  RefreshCw, Loader2, Home, Receipt
} from "lucide-react";
import Link from "next/link";

const VNPAY_ERROR_CODES: Record<string, string> = {
  "07": "Trừ tiền thành công (nghi ngờ giao dịch gian lận)",
  "09": "Giao dịch không thành công: Thẻ/Tài khoản chưa đăng ký InternetBanking",
  "10": "Giao dịch không thành công: Xác thực thông tin thẻ/tài khoản quá 3 lần",
  "11": "Giao dịch không thành công: Đã hết hạn chờ thanh toán",
  "12": "Giao dịch không thành công: Thẻ/Tài khoản bị khóa",
  "13": "Giao dịch không thành công: Sai mật khẩu xác thực OTP",
  "24": "Giao dịch bị hủy bởi người dùng",
  "51": "Giao dịch không thành công: Tài khoản không đủ số dư",
  "65": "Giao dịch không thành công: Tài khoản đã vượt hạn mức giao dịch trong ngày",
  "75": "Ngân hàng thanh toán đang bảo trì",
  "79": "Giao dịch không thành công: Nhập sai mật khẩu quá số lần quy định",
  "99": "Lỗi không xác định từ cổng thanh toán",
};

function PaymentResultContent() {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [checking, setChecking] = useState(true);
  const [successState, setSuccessState] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [txnRef, setTxnRef] = useState<string>("");
  const [txnTime, setTxnTime] = useState<string>("");

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const rowBg = isDark ? "bg-[#13151f]/60" : "bg-slate-50/80";

  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const rawAmount = searchParams.get("vnp_Amount");
  const orderInfo = searchParams.get("vnp_OrderInfo");
  const transactionNo = searchParams.get("vnp_TransactionNo") || "";
  const txnId = searchParams.get("vnp_TxnRef") || "";
  const payDate = searchParams.get("vnp_PayDate") || "";

  // PayOS query parameter fallbacks
  const payosCode = searchParams.get("code");
  const payosCancel = searchParams.get("cancel");
  const payosOrderCode = searchParams.get("orderCode");

  const isSuccess = vnpResponseCode 
    ? vnpResponseCode === "00" 
    : (payosCode === "00" && payosCancel !== "true");

  const finalTxnRef = transactionNo || txnId || payosOrderCode || "—";
  const responseCode = vnpResponseCode || payosCode;

  useEffect(() => {
    const verifyTransaction = async () => {
      setSuccessState(isSuccess);
      setTxnRef(finalTxnRef);

      if (rawAmount) {
        const vnd = Number(rawAmount) / 100;
        setAmountPaid(vnd.toLocaleString("vi-VN") + " ₫");
      }

      // Format payment time
      if (payDate && payDate.length >= 14) {
        const y = payDate.slice(0, 4);
        const mo = payDate.slice(4, 6);
        const d = payDate.slice(6, 8);
        const h = payDate.slice(8, 10);
        const mi = payDate.slice(10, 12);
        setTxnTime(`${h}:${mi} ngày ${d}/${mo}/${y}`);
      }

      if (!isSuccess) {
        setChecking(false);
        return;
      }

      // Extract courseId from orderInfo  
      // Hỗ trợ 2 format: "courseId:X" (mới) hoặc "... X" (cũ)
      let cId: number | null = null;
      if (orderInfo) {
        const newFormat = orderInfo.match(/courseId:(\d+)/);
        const oldFormat = orderInfo.match(/(\d+)$/);
        if (newFormat) cId = parseInt(newFormat[1], 10);
        else if (oldFormat) cId = parseInt(oldFormat[1], 10);
      }
      setCourseId(cId);

      // Wait for IPN webhook to finish
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const res = await api.get("/api/learning/my-courses");
        if (res.ok) {
          const result = await res.json();
          const coursesList = result.data || [];

          let matched = null;
          if (cId) matched = coursesList.find((c: any) => c.courseId === cId);
          if (!matched && coursesList.length > 0) matched = coursesList[coursesList.length - 1];

          if (matched) {
            setCourseTitle(matched.title);
            setCourseSlug(matched.slug || null);
          }
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
      } finally {
        setChecking(false);
      }
    };

    verifyTransaction();
  }, [responseCode, rawAmount, orderInfo, transactionNo, txnId]);

  const errorMessage = responseCode ? (VNPAY_ERROR_CODES[responseCode] || `Lỗi cổng thanh toán (Mã: ${responseCode})`) : "Giao dịch không thành công";

  if (checking) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
        <h2 className={`text-xl font-bold ${text} mb-2`}>Đang xác nhận giao dịch</h2>
        <p className={`${muted} text-sm`}>Vui lòng giữ kết nối. Chúng tôi đang xác thực kết quả thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 sm:py-20">
      <div className={`border ${divider} rounded-3xl shadow-2xl overflow-hidden ${isDark ? "bg-[#13151f]" : "bg-white"}`}>
        {/* Top band */}
        <div className={`h-1.5 w-full ${successState ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-rose-400 to-rose-600"}`} />

        <div className="p-8 sm:p-10 text-center">
          {successState ? (
            <>
              {/* Success Icon */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
                <div className="relative w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center ring-8 ring-emerald-500/10">
                  <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>
              </div>

              <h1 className={`text-2xl font-extrabold tracking-tight ${text} mb-2`}>
                Thanh toán thành công! 🎉
              </h1>
              <p className={`text-sm ${muted} mb-8`}>
                Đơn đăng ký học tập của bạn đã được kích hoạt. Chúc bạn học tốt!
              </p>

              {/* Receipt */}
              <div className={`border ${divider} rounded-2xl text-left mb-8 overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${divider} ${rowBg} flex items-center gap-2`}>
                  <Receipt className="w-4 h-4 text-indigo-500" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Chi tiết giao dịch</span>
                </div>
                <div className="divide-y divide-dashed" style={{ borderColor: isDark ? "#1e2235" : "#e2e8f0" }}>
                  {courseTitle && (
                    <div className="flex justify-between items-start gap-4 px-4 py-3">
                      <span className={`text-sm ${muted} shrink-0`}>Khóa học</span>
                      <span className={`text-sm font-semibold ${text} text-right`}>{courseTitle}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className={`text-sm ${muted}`}>Số tiền</span>
                    <span className="text-sm font-bold text-emerald-500">{amountPaid}</span>
                  </div>
                  {txnTime && (
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className={`text-sm ${muted}`}>Thời gian</span>
                      <span className={`text-sm font-medium ${text}`}>{txnTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className={`text-sm ${muted}`}>Mã giao dịch</span>
                    <span className={`text-xs font-mono ${text} bg-slate-100 dark:bg-[#22263a] px-2 py-1 rounded-lg`}>{txnRef}</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Link
                href={courseSlug ? `/courses/${courseSlug}/learn` : "/profile"}
                id="start-learning-redirect-btn"
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:-translate-y-0.5 mb-3"
              >
                <BookOpen className="w-5 h-5" />
                Bắt đầu học ngay
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/profile" className={`text-sm ${muted} hover:text-indigo-500 transition-colors`}>
                Xem tất cả khóa học của tôi →
              </Link>
            </>
          ) : (
            <>
              {/* Failure Icon */}
              <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-500/10">
                <AlertTriangle className="w-12 h-12 text-rose-500" />
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-rose-500 mb-2">
                Thanh toán không thành công
              </h1>
              <p className={`text-sm ${muted} mb-8`}>
                Giao dịch của bạn chưa được hoàn tất. Bạn có thể thử lại hoặc liên hệ hỗ trợ.
              </p>

              {/* Error Details */}
              <div className={`border ${divider} rounded-2xl mb-8 overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${divider} ${rowBg} flex items-center gap-2`}>
                  <Receipt className="w-4 h-4 text-rose-500" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Chi tiết lỗi</span>
                </div>
                <div className="divide-y divide-dashed" style={{ borderColor: isDark ? "#1e2235" : "#e2e8f0" }}>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className={`text-sm ${muted}`}>Mã tham chiếu</span>
                    <span className={`text-xs font-mono ${text}`}>{txnId || "—"}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4 px-4 py-3">
                    <span className={`text-sm ${muted} shrink-0`}>Nguyên nhân</span>
                    <span className="text-sm font-semibold text-rose-500 text-right">{errorMessage}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="retry-payment-btn"
                  onClick={() => router.back()}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Thử lại
                </button>
                <Link
                  href="/courses"
                  id="back-to-catalog-btn"
                  className={`flex-1 py-3.5 border ${divider} text-sm font-bold rounded-xl text-center ${text} ${isDark ? "bg-[#22263a] hover:bg-[#2a2d3e]" : "bg-slate-100 hover:bg-slate-200"} transition-all flex items-center justify-center gap-1.5`}
                >
                  <Home className="w-4 h-4" />
                  Về trang chủ
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  const { isDark } = useTheme();
  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";

  return (
    <div className={`min-h-screen ${bg} font-sans flex flex-col`}>
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <Suspense fallback={
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Đang tải kết quả...</p>
          </div>
        }>
          <PaymentResultContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
