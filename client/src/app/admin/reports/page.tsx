"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/components/ui/ThemeProvider";
import { formatVND } from "@/lib/pricing";
import {
  Search,
  ChevronDown,
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertCircle,
  RefreshCcw,
  Printer,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

interface Transaction {
  id: number;
  gatewayTransactionId: string | null;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
  enrollment?: {
    course?: {
      title: string;
    };
  };
}

interface Stats {
  totalRevenue: number;
  completedCount: number;
  refundedCount: number;
  pendingCount: number;
  averageValue: number;
}

export default function AdminReportsPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    completedCount: 0,
    refundedCount: 0,
    pendingCount: 0,
    averageValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");

  // Fetch transactions and calculate statistics
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all transactions for generating comprehensive reports (we fetch with a large limit to build stats)
      const res = await api.get("/api/admin/transactions?limit=100");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/auth/login";
          return;
        }
        throw new Error("Lỗi tải dữ liệu báo cáo");
      }
      const data = await res.json();
      const txs: Transaction[] = data.transactions;
      setTransactions(txs);

      // Compute statistics locally based on all retrieved transactions
      const completed = txs.filter((t) => t.status === "completed");
      const refunded = txs.filter((t) => t.status === "refunded");
      const pending = txs.filter((t) => t.status === "pending");

      const totalRevenue = completed.reduce((sum, t) => sum + Number(t.amount), 0);
      const averageValue = completed.length > 0 ? totalRevenue / completed.length : 0;

      setStats({
        totalRevenue,
        completedCount: completed.length,
        refundedCount: refunded.length,
        pendingCount: pending.length,
        averageValue,
      });
    } catch (error) {
      console.error(error);
      showToast("error", "Lỗi tải dữ liệu báo cáo doanh thu");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Filtering transactions for presentation
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.gatewayTransactionId && t.gatewayTransactionId.toLowerCase().includes(search.toLowerCase())) ||
      (t.user && t.user.username.toLowerCase().includes(search.toLowerCase())) ||
      (t.user && t.user.email.toLowerCase().includes(search.toLowerCase())) ||
      (t.enrollment?.course?.title && t.enrollment.course.title.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesMethod =
      methodFilter === "All" ||
      t.paymentMethod.toLowerCase() === methodFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Export CSV functionality
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast("info", "Không có dữ liệu để xuất");
      return;
    }

    const headers = ["ID Giao dịch", "Học viên", "Email", "Khóa học", "Số tiền (VND)", "Phương thức", "Trạng thái", "Ngày tạo"];
    const rows = filteredTransactions.map((t) => [
      t.gatewayTransactionId || `TX-${t.id}`,
      t.user.username,
      t.user.email,
      t.enrollment?.course?.title || "N/A",
      t.amount,
      t.paymentMethod,
      t.status,
      new Date(t.createdAt).toLocaleDateString("vi-VN")
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bao_cao_doanh_thu_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Xuất file báo cáo thành công!");
  };

  const printReport = () => {
    window.print();
  };

  // ─── Theme Tokens ───────────────────────────────────────────────────────────
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const sectionHdr = isDark ? "bg-[#13151f]" : "bg-slate-50";
  const input = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";

  // Group course stats for visual chart representation
  const courseEnrollments: Record<string, { count: number; revenue: number }> = {};
  transactions.forEach((tx) => {
    if (tx.status === "completed" && tx.enrollment?.course?.title) {
      const title = tx.enrollment.course.title;
      if (!courseEnrollments[title]) {
        courseEnrollments[title] = { count: 0, revenue: 0 };
      }
      courseEnrollments[title].count += 1;
      courseEnrollments[title].revenue += Number(tx.amount);
    }
  });

  const topCourses = Object.entries(courseEnrollments)
    .map(([title, val]) => ({ title, ...val }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-7 print:p-0 print:space-y-4">
        
        {/* ── Header Row ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Báo cáo doanh thu</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>
              Xem và phân tích hiệu suất doanh thu, lịch sử mua hàng và thanh toán.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={printReport}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                isDark
                  ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Printer className="w-4 h-4" /> In báo cáo
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" /> Xuất file CSV
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center border-b pb-4 mb-6">
          <h1 className="text-3xl font-extrabold">ELEVATE LMS - BÁO CÁO DOANH THU HỆ THỐNG</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ngày lập báo cáo: {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* ── Stats Grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: "Tổng doanh thu",
              value: formatVND(stats.totalRevenue),
              icon: DollarSign,
              iconBg: "bg-emerald-500/15 text-emerald-500",
              desc: "Các giao dịch hoàn tất"
            },
            {
              label: "Giá trị đơn trung bình",
              value: formatVND(stats.averageValue),
              icon: TrendingUp,
              iconBg: "bg-indigo-500/15 text-indigo-500",
              desc: "Trên mỗi học viên"
            },
            {
              label: "Giao dịch thành công",
              value: stats.completedCount.toString(),
              icon: CheckCircle2,
              iconBg: "bg-teal-500/15 text-teal-500",
              desc: "Đã cấp quyền truy cập"
            },
            {
              label: "Giao dịch hoàn tiền",
              value: stats.refundedCount.toString(),
              icon: RefreshCcw,
              iconBg: "bg-rose-500/15 text-rose-500",
              desc: "Đã thu hồi chứng chỉ & khóa học"
            }
          ].map(({ label, value, icon: Icon, iconBg, desc }, i) => (
            <div key={i} className={`border rounded-2xl p-5 ${card} shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold ${muted}`}>{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className={`text-2xl font-extrabold tracking-tight ${text}`}>{value}</p>
              <p className={`text-[10px] mt-1 ${muted}`}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ── Custom Interactive Dashboard Charts ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Selling Courses */}
          <div className={`border rounded-2xl p-5 lg:col-span-2 ${card}`}>
            <h3 className={`text-sm font-bold mb-4 ${text} flex items-center gap-2`}>
              <BarChart3 className="w-4.5 h-4.5 text-indigo-500" /> Doanh thu theo khóa học hàng đầu
            </h3>

            {loading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            ) : topCourses.length === 0 ? (
              <div className={`h-60 flex flex-col items-center justify-center text-sm ${muted}`}>
                <AlertCircle className="w-8 h-8 mb-2 text-slate-400" />
                Không có dữ liệu khóa học đã bán.
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {topCourses.map((c, i) => {
                  const maxRevenue = Math.max(...topCourses.map(x => x.revenue));
                  const percentage = maxRevenue > 0 ? (c.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className={`font-semibold ${text} truncate max-w-[70%]`}>{c.title}</span>
                        <div className="space-x-2 shrink-0">
                          <span className={muted}>{c.count} lượt bán</span>
                          <span className="font-bold text-indigo-500">{formatVND(c.revenue)}</span>
                        </div>
                      </div>
                      <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? "bg-[#22263a]" : "bg-slate-100"}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Methods Breakdown */}
          <div className={`border rounded-2xl p-5 ${card}`}>
            <h3 className={`text-sm font-bold mb-4 ${text} flex items-center gap-2`}>
              <Briefcase className="w-4.5 h-4.5 text-indigo-500" /> Phương thức thanh toán
            </h3>

            {loading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full space-y-4 pb-4">
                {["VietQR", "MoMo", "VNPAY"].map((method) => {
                  const methodCompleted = transactions.filter(
                    (t) =>
                      t.status === "completed" &&
                      t.paymentMethod.toLowerCase() === method.toLowerCase()
                  );
                  const methodTotal = methodCompleted.reduce((sum, t) => sum + Number(t.amount), 0);
                  const totalCompleted = stats.totalRevenue;
                  const share = totalCompleted > 0 ? (methodTotal / totalCompleted) * 100 : 0;

                  let color = "bg-indigo-500";
                  if (method === "MoMo") color = "bg-pink-500";
                  if (method === "VNPAY") color = "bg-blue-500";

                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className={text}>{method}</span>
                        <span className={muted}>{share.toFixed(1)}% ({formatVND(methodTotal)})</span>
                      </div>
                      <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? "bg-[#22263a]" : "bg-slate-100"}`}>
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Filter Bar ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input
              type="text"
              placeholder="Tìm theo ID giao dịch, tên, email học viên hoặc khóa học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`appearance-none px-4 py-2.5 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium ${input}`}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="completed">Thành công</option>
              <option value="refunded">Đã hoàn tiền</option>
              <option value="pending">Chờ thanh toán</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
          </div>
          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className={`appearance-none px-4 py-2.5 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium ${input}`}
            >
              <option value="All">Tất cả phương thức</option>
              <option value="VietQR">VietQR</option>
              <option value="MoMo">MoMo</option>
              <option value="VNPAY">VNPAY</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
          </div>
        </div>

        {/* ── Transaction List ──────────────────────────────────────── */}
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className={`px-5 py-4 border-b ${divider} flex items-center justify-between`}>
            <h3 className={`text-sm font-bold ${text}`}>Lịch sử giao dịch chi tiết</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-[#22263a]" : "bg-slate-100"} ${muted}`}>
              {filteredTransactions.length} kết quả
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${divider} ${sectionHdr}`}>
                  {["ID Giao dịch", "Học viên", "Khóa học", "Số tiền", "Phương thức", "Trạng thái", "Ngày tạo"].map((h) => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className={`px-4 py-12 text-center text-sm ${muted}`}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredTransactions.map((tx) => (
                  <tr key={tx.id} className={`border-b last:border-0 transition-colors ${divider} ${isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"}`}>
                    <td className={`px-4 py-3.5 font-mono text-xs ${text}`}>
                      {tx.gatewayTransactionId || `TX-${tx.id}`}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className={`font-semibold text-xs leading-none ${text}`}>{tx.user.username}</p>
                      <span className={`text-[10px] ${muted}`}>{tx.user.email}</span>
                    </td>
                    <td className={`px-4 py-3.5 text-xs font-medium max-w-[200px] truncate ${text}`}>
                      {tx.enrollment?.course?.title || "N/A"}
                    </td>
                    <td className={`px-4 py-3.5 font-bold text-xs ${text}`}>
                      {formatVND(tx.amount)}
                    </td>
                    <td className={`px-4 py-3.5 text-xs font-semibold ${muted}`}>
                      {tx.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                        tx.status === "completed"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : tx.status === "refunded"
                          ? "bg-rose-500/15 text-rose-500"
                          : "bg-amber-500/15 text-amber-500"
                      }`}>
                        {tx.status === "completed" ? (
                          <><CheckCircle2 className="w-3 h-3" /> Thành công</>
                        ) : tx.status === "refunded" ? (
                          <><XCircle className="w-3 h-3" /> Đã hoàn tiền</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Chờ xử lý</>
                        )}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-xs whitespace-nowrap ${muted}`}>
                      {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </td>
                  </tr>
                ))}
                {!loading && filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className={`px-4 py-12 text-center text-sm ${muted}`}>
                      Không tìm thấy giao dịch nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
