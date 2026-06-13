"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "@/components/ui/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { CheckCircle, AlertTriangle, BookOpen, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

function PaymentResultContent() {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [checking, setChecking] = useState(true);
  const [successState, setSuccessState] = useState(false);
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [txnRef, setTxnRef] = useState<string>("");

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const card = isDark ? "bg-[#1a1d2e]/80 border-[#252840] backdrop-blur-md" : "bg-white/80 border-slate-200 backdrop-blur-md";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";

  // Parse callback details
  const responseCode = searchParams.get("vnp_ResponseCode");
  const rawAmount = searchParams.get("vnp_Amount");
  const orderInfo = searchParams.get("vnp_OrderInfo");
  const transactionNo = searchParams.get("vnp_TransactionNo") || "";
  const txnId = searchParams.get("vnp_TxnRef") || "";

  useEffect(() => {
    const verifyTransaction = async () => {
      // VNPAY response code '00' indicates successful payment transaction
      const isOk = responseCode === "00";
      setSuccessState(isOk);
      setTxnRef(transactionNo || txnId || "—");

      if (rawAmount) {
        // VNPay returns amount multiplied by 100 in VND
        const vnd = Number(rawAmount) / 100;
        setAmountPaid(vnd.toLocaleString("vi-VN") + " VND");
      }

      if (!isOk) {
        setChecking(false);
        return;
      }

      // If successful, extract course ID from orderInfo (format: "Thanh toan khoa hoc <courseId>")
      let courseId: number | null = null;
      if (orderInfo) {
        const match = orderInfo.match(/(\d+)$/);
        if (match) {
          courseId = parseInt(match[1], 10);
        }
      }

      // Wait 1.5 seconds for VNPAY background IPN webhook call to finish processing on the server
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        // Retrieve current active courses to verify the enrollment activation and extract slug
        const res = await api.get("/api/learning/my-courses");
        if (res.ok) {
          const result = await res.json();
          const coursesList = result.data || [];
          
          let matchedCourse = null;
          if (courseId) {
            matchedCourse = coursesList.find((c: any) => c.courseId === courseId);
          } else {
            // fallback: get the latest enrolled course
            matchedCourse = coursesList[0];
          }

          if (matchedCourse) {
            setCourseSlug(matchedCourse.slug);
            setCourseTitle(matchedCourse.title);
          } else {
            // If the IPN is slightly delayed, fallback to retrieving details of the course by ID directly
            if (courseId) {
              const courseRes = await api.get(`/api/courses`);
              if (courseRes.ok) {
                const allCourses = await courseRes.json();
                const found = allCourses.find((c: any) => c.id === courseId);
                if (found) {
                  setCourseSlug(found.slug);
                  setCourseTitle(found.title);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error verifying payment transaction completion:", err);
      } finally {
        setChecking(false);
      }
    };

    verifyTransaction();
  }, [responseCode, rawAmount, orderInfo, transactionNo, txnId]);

  if (checking) {
    return (
      <main className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin mx-auto mb-6" />
        <h2 className={`text-xl font-bold ${text} mb-2`}>Đang xác nhận giao dịch</h2>
        <p className={`${muted} text-sm`}>Vui lòng giữ kết nối. Chúng tôi đang kiểm tra dữ liệu thanh toán từ VNPAY...</p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16 sm:py-24">
      <div className={`border ${divider} rounded-3xl p-8 sm:p-10 shadow-2xl ${card} text-center`}>
        {successState ? (
          <>
            {/* Success Visual */}
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/10">
              <CheckCircle className="w-10 h-10 text-emerald-500 fill-emerald-500/20" />
            </div>

            <h1 className={`text-3xl font-extrabold tracking-tight ${text} mb-3`}>
              Thanh toán thành công!
            </h1>
            <p className={`text-base ${muted} mb-8`}>
              Cảm ơn bạn đã mua hàng. Đơn đăng ký học tập của bạn đã được kích hoạt thành công trên hệ thống.
            </p>

            {/* Receipt Table */}
            <div className={`border ${divider} rounded-2xl p-5 ${isDark ? "bg-[#13151f]/50" : "bg-slate-50/50"} text-left mb-8 space-y-3`}>
              {courseTitle && (
                <div className="flex justify-between items-start gap-4">
                  <span className={`text-sm ${muted} shrink-0`}>Khóa học</span>
                  <span className={`text-sm font-semibold ${text} text-right`}>{courseTitle}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className={`text-sm ${muted}`}>Số tiền thanh toán</span>
                <span className="text-sm font-bold text-emerald-500">{amountPaid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${muted}`}>Mã giao dịch cổng</span>
                <span className={`text-xs font-mono ${text}`}>{txnRef}</span>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={courseSlug ? `/courses/${courseSlug}/learn` : "/profile"}
              id="start-learning-redirect-btn"
              className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center text-base transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5" />
              Bắt đầu học ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            {/* Failure Visual */}
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-500/10">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>

            <h1 className={`text-3xl font-extrabold tracking-tight text-rose-500 mb-3`}>
              Thanh toán thất bại
            </h1>
            <p className={`text-base ${muted} mb-8`}>
              Giao dịch của bạn đã bị hủy hoặc gặp lỗi trong quá trình xử lý từ ngân hàng/cổng thanh toán.
            </p>

            <div className={`border ${divider} rounded-2xl p-5 ${isDark ? "bg-[#13151f]/50" : "bg-slate-50/50"} text-left mb-8 space-y-3`}>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${muted}`}>Mã giao dịch</span>
                <span className={`text-xs font-mono ${text}`}>{txnId || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${muted}`}>Lý do</span>
                <span className="text-sm font-semibold text-rose-500">
                  {responseCode === "24" ? "Khách hàng hủy giao dịch" : `Lỗi cổng thanh toán (Mã ${responseCode})`}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/courses"
                id="back-to-catalog-btn"
                className={`flex-1 py-3.5 border ${divider} text-sm font-bold rounded-xl text-center ${text} ${isDark ? "bg-[#22263a] hover:bg-[#2a2d3e]" : "bg-slate-100 hover:bg-slate-200"} transition-all`}
              >
                Về danh sách khóa học
              </Link>
              <button
                id="retry-payment-btn"
                onClick={() => router.back()}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                Thử thanh toán lại
              </button>
            </div>
          </>
        )}
      </div>
    </main>
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
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Đang tải...</p>
          </div>
        }>
          <PaymentResultContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
