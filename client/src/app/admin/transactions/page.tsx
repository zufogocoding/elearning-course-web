"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
import { api } from "@/lib/api";
import { formatVND } from "@/lib/pricing";
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  User,
  BookOpen,
  Calendar,
  AlertCircle,
  RefreshCcw,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2
} from "lucide-react";

interface Transaction {
  id: number;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  gatewayTransactionId: string | null;
  status: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
  enrollment: {
    course: {
      title: string;
    };
  };
}

export default function AdminTransactionsPage() {
  const { isDark } = useTheme();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [refundingId, setRefundingId] = useState<number | null>(null);

  // Group filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "",
    search: ""
  });

  // Theme styling tokens
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const tableHeader = isDark ? "bg-[#13151f] text-[#7a87a1]" : "bg-slate-50 text-slate-500";
  const cardBg = isDark ? "bg-[#13151f] border-[#252840]" : "bg-white border-slate-200";
  const inputCls = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40 focus:border-indigo-500"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40 focus:border-indigo-400";

  const fetchTransactions = async () => {
    setLoading(true);
    // TODO: Check API URL
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        status: filters.status,
        search: filters.search
      });

      const res = await api.get(`/api/admin/transactions?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Lỗi tải lịch sử giao dịch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters.page, filters.status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleRefund = async (txId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hoàn tiền cho giao dịch này? Hành động này sẽ thu hồi quyền truy cập khóa học và chứng chỉ liên quan.")) {
      return;
    }

    setRefundingId(txId);
    try {
      const res = await api.post(`/api/admin/transactions/${txId}/refund`);
      if (res.ok) {
        alert("Hoàn tiền và thu hồi quyền học thành công!");
        await fetchTransactions();
      } else {
        const errData = await res.json();
        alert(errData.error || "Lỗi khi thực hiện hoàn tiền.");
      }
    } catch (err) {
      console.error("Lỗi hoàn tiền:", err);
      alert("Lỗi kết nối khi gửi yêu cầu hoàn tiền.");
    } finally {
      setRefundingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "failed":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "refunded":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border border-slate-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Thành công";
      case "pending":
        return "Chờ xử lý";
      case "failed":
        return "Thất bại";
      case "refunded":
        return "Đã hoàn tiền";
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-7">
        
        {/* Header Title */}
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Quản lý Giao dịch</h1>
          <p className={`text-sm mt-0.5 ${muted}`}>Xem lịch sử thanh toán hóa đơn và hoàn tiền học viên</p>
        </div>

        {/* Filters and Search */}
        <div className={`border rounded-2xl p-5 ${cardBg} shadow-sm`}>
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label htmlFor="search-input" className={`block text-xs font-bold uppercase tracking-wider ${muted}`}>
                Tìm kiếm giao dịch
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="Mã giao dịch, Tên học viên, Email..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 transition-all ${inputCls}`}
                />
                <Search className={`w-4 h-4 absolute left-3.5 top-3 ${muted}`} />
              </div>
            </div>

            <div className="w-full md:w-48 space-y-2">
              <label htmlFor="status-select" className={`block text-xs font-bold uppercase tracking-wider ${muted}`}>
                Trạng thái
              </label>
              <select
                id="status-select"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
                className={`w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 transition-all ${inputCls}`}
              >
                <option value="">Tất cả</option>
                <option value="completed">Thành công</option>
                <option value="pending">Chờ xử lý</option>
                <option value="failed">Thất bại</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>

            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button
                type="submit"
                className="w-full md:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                Tìm kiếm
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters({ page: 1, limit: 10, status: "", search: "" });
                }}
                className={`w-full md:w-auto px-5 py-2 border rounded-xl text-sm font-semibold transition-all ${
                  isDark ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Đặt lại
              </button>
            </div>
          </form>
        </div>

        {/* Transactions Table Container */}
        <div className={`border rounded-2xl overflow-hidden shadow-sm ${cardBg}`}>
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className={`text-sm font-medium ${muted}`}>Đang tải dữ liệu giao dịch...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className={`w-12 h-12 ${muted} mx-auto mb-3`} />
              <p className={`text-sm font-semibold ${text}`}>Không có dữ liệu giao dịch nào khớp với bộ lọc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${divider} uppercase tracking-wider font-bold text-[10px] ${tableHeader}`}>
                    <th className="py-3.5 px-4 w-12 text-center">ID</th>
                    <th className="py-3.5 px-4">Học viên</th>
                    <th className="py-3.5 px-4">Khóa học</th>
                    <th className="py-3.5 px-4 text-right">Số tiền</th>
                    <th className="py-3.5 px-4">Phương thức</th>
                    <th className="py-3.5 px-4">Mã cổng GD</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider} ${isDark ? "bg-[#13151f]/40" : "bg-white"}`}>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className={isDark ? "hover:bg-[#1a1d2e]/50" : "hover:bg-slate-50/50"}>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-500">{tx.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-[#e2e8f0]">{tx.user?.username}</div>
                        <div className={`text-[10px] ${muted}`}>{tx.user?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium max-w-[150px] truncate" title={tx.enrollment?.course?.title}>
                        {tx.enrollment?.course?.title}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 dark:text-[#e2e8f0]">{formatVND(tx.amount)}</td>
                      <td className="py-3.5 px-4 uppercase font-semibold text-slate-700 dark:text-[#a0aec0]">
                        {tx.paymentMethod || "Mock / Free"}
                      </td>
                      <td className="py-3.5 px-4 font-mono select-all text-slate-600 dark:text-[#a0aec0]">
                        {tx.gatewayTransactionId || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(tx.status)}`}>
                          {getStatusLabel(tx.status)}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 ${muted}`}>
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {tx.status.toLowerCase() === "completed" ? (
                          <button
                            id={`refund-btn-${tx.id}`}
                            onClick={() => handleRefund(tx.id)}
                            disabled={refundingId === tx.id}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all text-[10px]"
                          >
                            {refundingId === tx.id ? "Đang xử lý..." : "Hoàn tiền"}
                          </button>
                        ) : (
                          <span className={`text-[11px] ${muted}`}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className={`px-5 py-4 border-t ${divider} flex items-center justify-between`}>
              <span className={`text-xs ${muted}`}>
                Tổng số <strong>{total}</strong> giao dịch
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={filters.page === 1}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold disabled:opacity-40 transition-all ${
                    isDark ? "border-[#252840] hover:bg-[#1a1d2e]" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Trước
                </button>
                <span className={`text-xs px-3 font-medium ${text}`}>
                  Trang {filters.page} / {totalPages}
                </span>
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
                  disabled={filters.page === totalPages}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold disabled:opacity-40 transition-all ${
                    isDark ? "border-[#252840] hover:bg-[#1a1d2e]" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
