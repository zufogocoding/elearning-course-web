"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
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
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
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

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "All") params.set("status", statusFilter);

      const res = await api.get(`/api/courses/admin/all?${params}`);
      if (!res.ok) {
        setError("Failed to load courses");
        setCourses([]);
        return;
      }
      const data = await res.json();
      setCourses(data.data || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 });
      setError("");
    } catch {
      setError("Network error. Could not load courses.");
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
        setCategories(Array.isArray(data) ? data : []);
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
    if (!form.title.trim()) { setFormErrors("Course title is required"); return; }

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
      setFormErrors("Network error.");
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

  if (!user || user.role !== "admin") {
    return (
      <AdminLayout>
        <div className="p-12 text-center">
          <p className={`text-lg font-semibold ${isDark ? "text-[#7a87a1]" : "text-slate-500"}`}>
            You need admin access to view this page.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Courses</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>{pagination.total} total courses</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchCourses} className={`p-2.5 rounded-xl border text-sm transition-all ${iconBtn}`} title="Refresh">
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button id="open-add-course-modal" onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20">
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input id="course-search" type="text" placeholder="Search courses by title..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
          </div>
          <div className="relative">
            <select id="course-status-filter" value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className={`appearance-none px-4 py-2.5 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium ${input}`}>
              <option value="All">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
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
              <span className={`ml-3 text-sm font-medium ${muted}`}>Loading courses...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${divider} ${sectionHdr}`}>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Course</th>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Level</th>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Price</th>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Enrolled</th>
                      <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Status</th>
                      <th className={`text-right px-4 py-3 text-xs font-semibold ${muted}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`px-4 py-16 text-center text-sm ${muted}`}>
                          <div className="flex flex-col items-center gap-2">
                            <BookOpen className="w-10 h-10 opacity-30" />
                            <p>No courses found.</p>
                            <button onClick={openAddModal} className="text-indigo-500 hover:text-indigo-400 font-semibold text-xs">
                              Create your first course
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
                                {course.category?.name || "Uncategorized"} · {course._count.sections} sections
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelBadge(course.level)}`}>
                            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 font-semibold ${text}`}>
                          ${Number(course.price).toFixed(2)}
                          {course.discountPrice && (
                            <span className={`ml-1.5 text-xs line-through ${muted}`}>${Number(course.discountPrice).toFixed(2)}</span>
                          )}
                        </td>
                        <td className={`px-4 py-3.5 ${text}`}>{course._count.enrollments}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(course.status)}`}>
                            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {deleteConfirmId === course.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-xs flex items-center gap-1 ${isDark ? "text-rose-400" : "text-rose-600"}`}>
                                <AlertTriangle className="w-3 h-3" /> Delete?
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
                  <span className={`text-xs ${muted}`}>Page {pagination.page} of {pagination.totalPages}</span>
                  <div className="flex gap-1">
                    <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${page <= 1 ? "opacity-40 cursor-not-allowed" : iconBtn}`}>Previous</button>
                    <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${page >= pagination.totalPages ? "opacity-40 cursor-not-allowed" : iconBtn}`}>Next</button>
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
              <h3 className={`text-base font-bold ${text}`}>{editCourse ? "Edit Course" : "Add New Course"}</h3>
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
                  <label htmlFor="course-title" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Course Title *</label>
                  <input id="course-title" type="text" placeholder="e.g. Complete JavaScript Bootcamp"
                    value={form.title} onChange={(e) => autoSlug(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
                </div>
                <div>
                  <label htmlFor="course-slug" className={`block text-xs font-semibold mb-1.5 ${muted}`}>
                    Slug {editCourse && <span className="text-amber-400">(read-only)</span>}
                  </label>
                  <input id="course-slug" type="text" placeholder="auto-generated"
                    value={form.slug}
                    onChange={(e) => !editCourse && setForm((p) => ({ ...p, slug: e.target.value }))}
                    readOnly={!!editCourse}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input} ${editCourse ? "opacity-50 cursor-not-allowed" : ""}`} />
                </div>
              </div>

              <div>
                <label htmlFor="course-short-desc" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Short Description</label>
                <textarea id="course-short-desc" rows={2} placeholder="Brief description for course cards..."
                  value={form.shortDescription} onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm resize-none ${input}`} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="course-category" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Category</label>
                  <div className="relative">
                    <select id="course-category" value={form.categoryId}
                      onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                      className={`w-full appearance-none px-4 py-3 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}>
                      <option value="">No category</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="course-level" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Level</label>
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
                  <label htmlFor="course-price" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Price ($)</label>
                  <input id="course-price" type="number" step="0.01" min="0" placeholder="0.00"
                    value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
                </div>
                <div>
                  <label htmlFor="course-discount" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Discount Price ($)</label>
                  <input id="course-discount" type="number" step="0.01" min="0" placeholder="Optional"
                    value={form.discountPrice} onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
                </div>
              </div>

              <div>
                <label htmlFor="course-thumbnail" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Thumbnail URL</label>
                <input id="course-thumbnail" type="text" placeholder="https://example.com/thumbnail.jpg"
                  value={form.thumbnailUrl} onChange={(e) => setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`} />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-2 ${muted}`}>Status</label>
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
                      {opt === "published" ? "Published" : "Draft"}
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
                }`}>Cancel</button>
              <button id="submit-add-course" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editCourse ? "Save Changes" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
