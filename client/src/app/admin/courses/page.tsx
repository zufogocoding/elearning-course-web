"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
import { api } from "@/lib/api";
import Link from "next/link";
import { formatVND } from "@/lib/pricing";
import {
  Plus,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  BookOpen,
  RefreshCcw,
  EyeOff,
  Globe,
  Loader2,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Course {
  id: number;
  title: string;
  slug: string;
  shortDescription: string | null;
  price: string | number;
  discountPrice: string | number | null;
  status: "published" | "draft" | "archived";
  level: string;
  thumbnailUrl: string | null;
  category: { id: number; name: string } | null;
  updatedAt: string;
  _count: { sections: number; enrollments: number };
}

function slugify(text: string) {
  return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
}

export default function AdminCoursesPage() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [form, setForm] = useState({ title: "", slug: "" });
  const [formErrors, setFormErrors] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "All") params.set("status", statusFilter);

      const res = await api.get(`/api/courses/admin/all?${params}`);
      if (!res.ok) {
        setError("Lỗi tải khóa học");
        setCourses([]);
        return;
      }
      const data = await res.json();
      setCourses(data.data || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      setError("");
    } catch {
      setError("Lỗi mạng. Không thể tải khóa học.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setPage(1), 400);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const openAddModal = () => {
    setForm({ title: "", slug: "" });
    setFormErrors("");
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setForm({ title: "", slug: "" });
    setFormErrors("");
  };

  const autoSlug = (title: string) => {
    setForm({ title, slug: slugify(title) });
  };

  const handleCreate = async () => {
    setFormErrors("");
    if (!form.title.trim()) {
      setFormErrors("Vui lòng nhập tên khóa học");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/api/courses", {
        title: form.title,
        slug: form.slug || slugify(form.title),
        status: "draft",
        level: "beginner"
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErrors(data.error || "Failed to create course");
        return;
      }
      closeModal();
      router.push(`/admin/courses/${data.course?.id || data.id}`);
    } catch {
      setFormErrors("Lỗi mạng.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/api/courses/${id}`);
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchCourses();
      }
    } catch {}
  };

  const toggleStatus = async (course: Course) => {
    const newStatus = course.status === "published" ? "draft" : "published";
    try {
      const res = await api.put(`/api/courses/${course.id}`, { status: newStatus });
      if (res.ok) fetchCourses();
    } catch {}
  };

  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const sectionHdr = isDark ? "bg-[#13151f]" : "bg-slate-50";
  const input = isDark
      ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";
  const iconBtn = isDark
      ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#a0aec0] hover:text-white"
      : "bg-slate-100 hover:bg-slate-200 text-slate-600";

  const statusBadge = (status: string) => {
    if (status === "published") return "bg-emerald-500/15 text-emerald-500";
    if (status === "draft") return "bg-amber-400/15 text-amber-400";
    return isDark ? "bg-[#22263a] text-[#7a87a1]" : "bg-slate-100 text-slate-500";
  };

  const levelBadge = (level: string) => {
    if (level === "beginner") return "bg-emerald-500/10 text-emerald-500";
    if (level === "intermediate") return "bg-amber-500/10 text-amber-500";
    return "bg-rose-500/10 text-rose-500";
  };

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Khóa học</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>{pagination.total} khóa học</p>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={() => fetchCourses()}
                className={`p-2.5 rounded-xl border text-sm transition-all ${iconBtn}`}
                title="Refresh"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Thêm khóa học
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input
                type="text"
                placeholder="Tìm kiếm khóa học theo tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
            />
          </div>
          <div className="relative">
            <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className={`appearance-none px-4 py-2.5 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium ${input}`}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
          </div>
        </div>

        {error && <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{error}</div>}

        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className={`ml-3 text-sm font-medium ${muted}`}>Đang tải dữ liệu...</span>
              </div>
          ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                    <tr className={`border-b ${divider} ${sectionHdr}`}>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Khóa học</th>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Cấp độ</th>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Giá</th>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Đã đăng ký</th>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Trạng thái</th>
                      <th className={`text-right px-4 py-3 text-xs font-semibold ${muted}`}>Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {courses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={`px-4 py-16 text-center text-sm ${muted}`}>
                            <div className="flex flex-col items-center gap-2">
                              <BookOpen className="w-10 h-10 opacity-30" />
                              <p>Không có dữ liệu</p>
                              <button onClick={openAddModal} className="text-indigo-500 hover:text-indigo-400 font-semibold text-xs">Tạo khóa học đầu tiên</button>
                            </div>
                          </td>
                        </tr>
                    ) : (
                        courses.map((course) => (
                            <tr key={course.id} className={`border-b last:border-0 transition-colors ${divider} ${deleteConfirmId === course.id ? isDark ? "bg-rose-900/20" : "bg-rose-50" : isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"}`}>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${course.status === "published" ? "from-indigo-500 to-violet-600" : "from-slate-400 to-slate-500"} shrink-0 flex items-center justify-center shadow-sm`}>
                                    <BookOpen className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className={`font-semibold text-sm leading-tight ${text}`}>{course.title}</p>
                                    <p className={`text-xs mt-0.5 ${muted}`}>{course.category?.name || "Chưa phân loại"} · {course._count.sections} chương</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelBadge(course.level)}`}>{course.level === "beginner" ? "Cơ bản" : course.level === "intermediate" ? "Trung bình" : "Nâng cao"}</span></td>
                              <td className={`px-4 py-3.5 font-semibold ${text}`}>
                                {formatVND(course.price)}
                                {course.discountPrice && <span className={`ml-1.5 text-xs line-through ${muted}`}>{formatVND(course.discountPrice)}</span>}
                              </td>
                              <td className={`px-4 py-3.5 ${text}`}>{course._count.enrollments}</td>
                              <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(course.status)}`}>{course.status === "published" ? "Đã xuất bản" : course.status === "draft" ? "Bản nháp" : "Lưu trữ"}</span></td>
                              <td className="px-4 py-3.5">
                                {deleteConfirmId === course.id ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <span className={`text-xs flex items-center gap-1 ${isDark ? "text-rose-400" : "text-rose-600"}`}><AlertTriangle className="w-3 h-3" />Xoá?</span>
                                      <button onClick={() => handleDelete(course.id)} className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all"><Check className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setDeleteConfirmId(null)} className={`p-1.5 rounded-lg transition-all ${iconBtn}`}><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button onClick={() => toggleStatus(course)} className={`p-1.5 rounded-lg transition-all ${course.status === "published" ? (isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-600") : (isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600")}`}>
                                        {course.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                                      </button>
                                      <Link href={`/admin/courses/${course.id}`} className={`p-1.5 rounded-lg transition-all ${iconBtn}`}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </Link>
                                      <button onClick={() => setDeleteConfirmId(course.id)} className={`p-1.5 rounded-lg transition-all ${isDark ? "bg-[#22263a] hover:bg-rose-500/20 text-[#a0aec0] hover:text-rose-400" : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-500"}`}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                )}
                              </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                  </table>
                </div>
                {pagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${divider} ${sectionHdr}`}>
                      <span className={`text-xs ${muted}`}>Trang {pagination.page} / {pagination.totalPages}</span>
                      <div className="flex gap-1">
                        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${page <= 1 ? "opacity-40 cursor-not-allowed" : iconBtn}`}>Trước</button>
                        <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${page >= pagination.totalPages ? "opacity-40 cursor-not-allowed" : iconBtn}`}>Tiếp</button>
                      </div>
                    </div>
                )}
              </>
          )}
        </div>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            <div className={`w-full max-w-md overflow-hidden rounded-2xl shadow-2xl border ${isDark ? "bg-[#13151f] border-[#252840]" : "bg-white border-slate-200"}`}>
              <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
                <h3 className={`text-base font-bold ${text}`}>Thêm khóa học mới</h3>
                <button onClick={closeModal} className={`p-1.5 rounded-lg transition-all ${iconBtn}`}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-5">
                {formErrors && <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{formErrors}</div>}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Tên khóa học *</label>
                  <input
                      type="text"
                      placeholder="VD: Khóa học NextJS"
                      value={form.title}
                      onChange={(e) => autoSlug(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                  />
                </div>
              </div>
              <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${divider}`}>
                <button onClick={closeModal} className={`px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${isDark ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>Hủy</button>
                <button onClick={handleCreate} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tạo khóa học
                </button>
              </div>
            </div>
          </div>
      )}
    </AdminLayout>
  );
}