"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTheme } from "@/components/ui/ThemeProvider";
import { api } from "@/lib/api";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
  Clock
} from "lucide-react";
import Link from "next/link";

interface CertificateData {
  id: number;
  certificateCode: string;
  issuedAt: string;
  courseVersion: number;
  user: {
    username: string;
    email: string;
  };
  course: {
    title: string;
  };
}

export default function CertificateVerificationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { isDark } = useTheme();
  
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Theme styling tokens
  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const cardBg = isDark ? "bg-[#13151f] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";

  useEffect(() => {
    const fetchVerification = async () => {
      // TODO: Check API URL
      try {
        const res = await api.get(`/api/certificates/verify/${code}`);
        if (res.ok) {
          const data = await res.json();
          setCertificate(data.certificate);
        } else {
          const errData = await res.json();
          setErrorMsg(errData.message || "Chứng chỉ không tồn tại hoặc đã bị thu hồi.");
        }
      } catch (err) {
        console.error("Lỗi xác minh chứng chỉ:", err);
        setErrorMsg("Không thể kết nối tới máy chủ để xác minh.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [code]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${bg}`}>
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
        <div className="mb-6">
          <Link
            href="/courses"
            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${muted} hover:${text}`}
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khóa học
          </Link>
        </div>

        {loading ? (
          <div className={`border rounded-3xl p-12 text-center shadow-lg ${cardBg}`}>
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className={`text-sm font-semibold ${muted}`}>Đang xác minh thông tin chứng chỉ...</p>
          </div>
        ) : errorMsg ? (
          <div className={`border rounded-3xl p-10 text-center shadow-lg space-y-4 ${cardBg}`}>
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className={`text-2xl font-extrabold tracking-tight ${text}`}>Xác minh thất bại</h2>
            <p className={`text-sm ${muted} max-w-md mx-auto leading-relaxed`}>
              {errorMsg}
            </p>
          </div>
        ) : certificate ? (
          <div className={`border rounded-3xl overflow-hidden shadow-xl ${cardBg}`}>
            {/* Top Verified Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 text-white flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                  Hệ thống Elevate
                </span>
                <h2 className="text-lg font-extrabold leading-normal mt-0.5">Chứng chỉ đã được xác minh</h2>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Khóa học</span>
                <h3 className={`text-xl font-extrabold leading-snug ${text}`}>{certificate.course.title}</h3>
              </div>

              <div className={`border-t ${divider} pt-6 grid sm:grid-cols-2 gap-6`}>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Học viên sở hữu</span>
                    <p className={`text-sm font-bold flex items-center gap-2 ${text}`}>
                      <User className="w-4 h-4 text-indigo-500" />
                      {certificate.user.username}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Email đăng ký</span>
                    <p className={`text-sm font-medium ${muted}`}>{certificate.user.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Ngày phát hành</span>
                    <p className={`text-sm font-bold flex items-center gap-2 ${text}`}>
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {formatDate(certificate.issuedAt)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Mã xác thực</span>
                    <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-indigo-500 px-2 py-1 rounded-md">
                      {certificate.certificateCode}
                    </code>
                  </div>
                </div>
              </div>

              <div className={`border-t ${divider} pt-6 flex flex-wrap items-center justify-between gap-4 text-xs ${muted}`}>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>Phiên bản khóa học: {certificate.courseVersion}.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Chữ ký số hợp lệ và bảo mật</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
