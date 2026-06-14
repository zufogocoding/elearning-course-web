"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { formatVND } from "@/lib/pricing";

const COVER_PRESETS = [
  { name: "Web Dev", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop" },
  { name: "Data Science", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop" },
  { name: "UI/UX Design", url: "https://images.unsplash.com/photo-1561070791-26c113006238?w=800&auto=format&fit=crop" },
  { name: "Marketing", url: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&auto=format&fit=crop" },
  { name: "Business", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop" },
  { name: "Abstract Indigo", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop" },
];
import {
  Plus, Search, ChevronDown, Edit2, Trash2,
  X, Check, AlertTriangle, BookOpen,
  RefreshCcw, EyeOff, Globe, Loader2,
} from "lucide-react";

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

interface Category {
  id: number;
  name: string;
  slug: string;
  children?: { id: number; name: string; slug: string }[];
}

interface CourseForm {
  title: string;
  slug: string;
  shortDescription: string;
  price: string;
  discountPrice: string;
  level: string;
  status: "draft" | "published";
  categoryId: string;
  thumbnailUrl: string;
}

const defaultForm: CourseForm = {
  title: "", slug: "", shortDescription: "",
  price: "", discountPrice: "", level: "beginner",
  status: "draft", categoryId: "", thumbnailUrl: "",
};

const LEVELS = [
  { value: "beginner", label: "Cơ bản" },
  { value: "intermediate", label: "Trung bình" },
  { value: "advanced", label: "Nâng cao" },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function AdminCoursesPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [form, setForm] = useState<CourseForm>(defaultForm);
  const [formErrors, setFormErrors] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước tệp tin tối đa là 5MB.");
      return;
    }
    
    setUploadingImage(true);
    setFormErrors("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await api.post("/api/courses/upload", { image: base64Data });
          const data = await res.json();
          if (res.ok && data.url) {
            setForm((prev) => ({ ...prev, thumbnailUrl: data.url }));
          } else {
            setFormErrors(data.error || "Không thể tải lên ảnh bìa.");
          }
        } catch {
          setFormErrors("Lỗi kết nối khi tải lên hình ảnh.");
        } finally {
          setUploadingImage(false);
        }
      };
      reader.onerror = () => {
        setFormErrors("Lỗi đọc file ảnh.");
        setUploadingImage(false);
      };
    } catch {
      setFormErrors("Lỗi xử lý file.");
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/categories`
      );
      if (res.ok) {
        const data = await res.json();
        setCategories(data && Array.isArray(data.data) ? data.data : []);
      }
    } catch { /* optional */ }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const openAddModal = () => {
    setEditCourse(null);
    setForm(defaultForm);
    setFormErrors("");
    setShowAddModal(true);
  };

  const openEditModal = (course: Course) => {
    setEditCourse(course);
    setForm({
      title: course.title, slug: course.slug,
      shortDescription: course.shortDescription || "",
      price: String(Number(course.price) || 0),
      discountPrice: course.discountPrice ? String(Number(course.discountPrice)) : "",
      level: course.level || "beginner",
      status: course.status === "archived" ? "draft" : course.status,
      categoryId: course.category ? String(course.category.id) : "",
      thumbnailUrl: course.thumbnailUrl || "",
    });
    setFormErrors("");
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditCourse(null);
    setForm(defaultForm);
    setFormErrors("");
  };

  const autoSlug = (title: string) => {
    if (!editCourse) {
      setForm((prev) => ({ ...prev, title, slug: slugify(title) }));
    } else {
      setForm((prev) => ({ ...prev, title }));
    }
  };

  const handleSave = async () => {
    setFormErrors("");
    if (!form.title.trim()) { setFormErrors("Vui lòng nhập tên khóa học"); return; }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        shortDescription: form.shortDescription || undefined,
        level: form.level,
        price: form.price ? parseFloat(form.price) : 0,
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : undefined,
        status: form.status,
        categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
      };

      if (!editCourse) {
        body.slug = form.slug || slugify(form.title);
        const res = await api.post("/api/courses", body);
        const data = await res.json();
        if (!res.ok) { setFormErrors(data.error || "Failed"); return; }
      } else {
        const res = await api.put(`/api/courses/${editCourse.id}`, body);
        const data = await res.json();
        if (!res.ok) { setFormErrors(data.error || "Failed"); return; }
      }

      closeModal();
      fetchCourses();
    } catch {
      setFormErrors("Lỗi mạng.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/api/courses/${id}`);
      if (res.ok) { setDeleteConfirmId(null); fetchCourses(); }
    } catch { /* ignore */ }
  };

  const toggleStatus = async (course: Course) => {
    const newStatus = course.status === "published" ? "draft" : "published";
    try {
      const res = await api.put(`/api/courses/${course.id}`, { status: newStatus });
      if (res.ok) fetchCourses();
    } catch { /* ignore */ }
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

  // Auth guard is now handled centrally by AdminLayout

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Khóa học</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>{pagination.total} khóa học</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchCourses} className={`p-2.5 rounded-xl border text-sm transition-all ${iconBtn}`} title="Refresh">
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button id="open-add-course-modal" onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20">
              <Plus className="w-4 h-4" /> Thêm khóa học
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input id="course-search" type="text" placeholder="Tìm kiếm khóa học theo tên..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
          </div>
          <div className="relative">
            <select id="course-status-filter" value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className={`appearance-none px-4 py-2.5 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium ${input}`}>
              <option value="All">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Lưu trữ</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{error}</div>
        )}

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
                            <button onClick={openAddModal} className="text-indigo-500 hover:text-indigo-400 font-semibold text-xs">
                              Tạo khóa học đầu tiên
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : courses.map((course) => (
                      <tr key={course.id}
                        className={`border-b last:border-0 transition-colors ${divider} ${
                          deleteConfirmId === course.id
                            ? isDark ? "bg-rose-900/20" : "bg-rose-50"
                            : isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"
                        }`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                              course.status === "published" ? "from-indigo-500 to-violet-600"
                                : course.status === "draft" ? "from-amber-400 to-orange-500"
                                : "from-slate-400 to-slate-500"
                            } shrink-0 flex items-center justify-center shadow-sm`}>
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className={`font-semibold text-sm leading-tight ${text}`}>{course.title}</p>
                              <p className={`text-xs mt-0.5 ${muted}`}>
                                {course.category?.name || "Chưa phân loại"} · {course._count.sections} chương
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelBadge(course.level)}`}>
                            {course.level === "beginner" ? "Cơ bản" : course.level === "intermediate" ? "Trung bình" : "Nâng cao"}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 font-semibold ${text}`}>
                          {formatVND(course.price)}
                          {course.discountPrice && (
                            <span className={`ml-1.5 text-xs line-through ${muted}`}>{formatVND(course.discountPrice)}</span>
                          )}
                        </td>
                        <td className={`px-4 py-3.5 ${text}`}>{course._count.enrollments}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(course.status)}`}>
                            {course.status === "published" ? "Đã xuất bản" : course.status === "draft" ? "Bản nháp" : "Lưu trữ"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {deleteConfirmId === course.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-xs flex items-center gap-1 ${isDark ? "text-rose-400" : "text-rose-600"}`}>
                                <AlertTriangle className="w-3 h-3" /> Xoá?
                              </span>
                              <button id={`confirm-delete-${course.id}`} onClick={() => handleDelete(course.id)}
                                className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button id={`cancel-delete-${course.id}`} onClick={() => setDeleteConfirmId(null)}
                                className={`p-1.5 rounded-lg transition-all ${iconBtn}`}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button id={`pub-toggle-${course.id}`}
                                title={course.status === "published" ? "Unpublish" : "Publish"}
                                onClick={() => toggleStatus(course)}
                                className={`p-1.5 rounded-lg transition-all ${
                                  course.status === "published"
                                    ? isDark ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                      : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                    : isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                }`}>
                                {course.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                              </button>
                              <button id={`edit-course-${course.id}`} title="Edit"
                                onClick={() => openEditModal(course)}
                                className={`p-1.5 rounded-lg transition-all ${iconBtn}`}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                href={`/admin/courses/${course.id}/builder`}
                                id={`build-course-${course.id}`}
                                title="Biên soạn giáo trình & bài quiz"
                                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                                  isDark ? "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                }`}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                              </Link>
                              <button id={`delete-course-${course.id}`} title="Delete"
                                onClick={() => setDeleteConfirmId(course.id)}
                                className={`p-1.5 rounded-lg transition-all ${isDark ? "bg-[#22263a] hover:bg-rose-500/20 text-[#a0aec0] hover:text-rose-400" : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-500"}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className={`flex items-center justify-between px-4 py-3 border-t ${divider} ${sectionHdr}`}>
                  <span className={`text-xs ${muted}`}>Trang {pagination.page} / {pagination.totalPages}</span>
                  <div className="flex gap-1">
                    <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${page <= 1 ? "opacity-40 cursor-not-allowed" : iconBtn}`}>Trước</button>
                    <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${page >= pagination.totalPages ? "opacity-40 cursor-not-allowed" : iconBtn}`}>Tiếp</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border ${
            isDark ? "bg-[#13151f] border-[#252840]" : "bg-white border-slate-200"
          }`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <div className="flex items-center gap-3">
                <h3 className={`text-base font-bold ${text}`}>{editCourse ? "Sửa khóa học" : "Thêm khóa học mới"}</h3>
                {editCourse && (
                  <Link
                    href={`/admin/courses/${editCourse.id}/builder`}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Biên soạn giáo trình & quiz
                  </Link>
                )}
              </div>
              <button id="close-add-modal" onClick={closeModal} className={`p-1.5 rounded-lg transition-all ${iconBtn}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formErrors && (
                <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">{formErrors}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="course-title" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Tên khóa học *</label>
                  <input id="course-title" type="text" placeholder="VD: Khóa học JavaScript toàn diện"
                    value={form.title} onChange={(e) => autoSlug(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
                </div>
                <div>
                  <label htmlFor="course-slug" className={`block text-xs font-semibold mb-1.5 ${muted}`}>
                    Đường dẫn {editCourse && <span className="text-amber-400">(chỉ đọc)</span>}
                  </label>
                  <input id="course-slug" type="text" placeholder="tự động tạo"
                    value={form.slug}
                    onChange={(e) => !editCourse && setForm((p) => ({ ...p, slug: e.target.value }))}
                    readOnly={!!editCourse}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input} ${editCourse ? "opacity-50 cursor-not-allowed" : ""}`} />
                </div>
              </div>

              <div>
                <label htmlFor="course-short-desc" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Mô tả ngắn</label>
                <textarea id="course-short-desc" rows={2} placeholder="Mô tả ngắn hiển thị trên thẻ khóa học..."
                  value={form.shortDescription} onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm resize-none ${input}`} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="course-category" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Danh mục</label>
                  <div className="relative">
                    <select id="course-category" value={form.categoryId}
                      onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                      className={`w-full appearance-none px-4 py-3 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}>
                      <option value="">Không có danh mục</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="course-level" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Cấp độ</label>
                  <div className="relative">
                    <select id="course-level" value={form.level}
                      onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                      className={`w-full appearance-none px-4 py-3 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}>
                      {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="course-price" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Giá (₫)</label>
                  <input id="course-price" type="number" step="1000" min="0" placeholder="0"
                    value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
                </div>
                <div>
                  <label htmlFor="course-discount" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Giá khuyến mãi (₫)</label>
                  <input id="course-discount" type="number" step="1000" min="0" placeholder="Tùy chọn"
                    value={form.discountPrice} onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Ảnh bìa khóa học</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upload area / Drag & Drop zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-upload-input")?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-indigo-500/85 ${
                      isDark
                        ? "bg-[#181a27] border-[#2d314d] hover:bg-[#1f2235]"
                        : "bg-slate-50 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      id="file-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <div className="text-center space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                        <p className={`text-xs ${muted}`}>Đang tải ảnh lên...</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Plus className={`w-8 h-8 text-indigo-500 mx-auto opacity-70`} />
                        <p className={`text-xs font-bold ${text}`}>Kéo thả ảnh hoặc click để tải lên</p>
                        <p className={`text-[10px] ${muted}`}>Chấp nhận PNG, JPG, JPEG (Tối đa 5MB)</p>
                      </div>
                    )}
                  </div>

                  {/* Live Preview & URL field */}
                  <div className="space-y-3">
                    {form.thumbnailUrl ? (
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#252840] bg-slate-950 group shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.thumbnailUrl} alt="Cover Preview" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, thumbnailUrl: "" }))}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xóa ảnh"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className={`aspect-video w-full rounded-2xl border flex items-center justify-center border-dashed ${
                        isDark ? "bg-[#181a27] border-[#2d314d]" : "bg-slate-50 border-slate-300"
                      }`}>
                        <p className={`text-xs italic ${muted}`}>Chưa chọn ảnh bìa</p>
                      </div>
                    )}

                    {/* Manual URL input option */}
                    <div>
                      <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${muted}`}>Hoặc nhập URL trực tiếp</label>
                      <input
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        value={form.thumbnailUrl}
                        onChange={(e) => setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))}
                        className={`w-full px-3 py-1.5 border rounded-xl outline-none focus:ring-1 transition-all text-xs ${input}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${muted}`}>Hoặc chọn từ kho ảnh mẫu</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COVER_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, thumbnailUrl: preset.url }))}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                          form.thumbnailUrl === preset.url
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                            : isDark
                              ? "border-[#252840] text-[#7a87a1] hover:border-[#3a3f55] hover:text-[#e2e8f0]"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-2 ${muted}`}>Trạng thái</label>
                <div className="flex gap-2">
                  {["draft", "published"].map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setForm((p) => ({ ...p, status: opt as "draft" | "published" }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        form.status === opt
                          ? opt === "published"
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                            : "bg-amber-500 text-white border-amber-400 shadow-sm"
                          : isDark ? "border-[#252840] text-[#7a87a1] hover:border-[#3a3f55]"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}>
                      {opt === "published" ? "Đã xuất bản" : "Bản nháp"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${divider}`}>
              <button id="cancel-add-course" onClick={closeModal}
                className={`px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                  isDark ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}>Hủy</button>
              <button id="submit-add-course" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editCourse ? "Lưu thay đổi" : "Tạo khóa học"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
