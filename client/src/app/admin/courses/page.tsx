"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
import {
  Plus,
  Search,
  ChevronDown,
  Edit2,
  Archive,
  Trash2,
  Star,
  X,
  Check,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
type CourseStatus = "Published" | "Draft" | "Archived";

interface Course {
  id: string;
  title: string;
  category: string;
  price: string;
  students: number;
  status: CourseStatus;
  rating: number;
  gradient: string;
}

const INITIAL_COURSES: Course[] = [
  { id: "c1", title: "UI/UX Design Masterclass", category: "Design", price: "$89.99", students: 312, status: "Published", rating: 4.9, gradient: "from-violet-500 to-indigo-600" },
  { id: "c2", title: "Advanced React Patterns", category: "Development", price: "$74.99", students: 241, status: "Published", rating: 4.8, gradient: "from-cyan-500 to-blue-600" },
  { id: "c3", title: "Python for Data Science", category: "Data", price: "$99.99", students: 198, status: "Published", rating: 4.7, gradient: "from-amber-500 to-orange-600" },
  { id: "c4", title: "Digital Marketing Strategy", category: "Marketing", price: "$59.99", students: 187, status: "Draft", rating: 4.6, gradient: "from-emerald-500 to-teal-600" },
  { id: "c5", title: "Intro to AI & Machine Learning", category: "AI", price: "$89.99", students: 156, status: "Published", rating: 4.9, gradient: "from-rose-500 to-pink-600" },
  { id: "c6", title: "Graphic Design Fundamentals", category: "Design", price: "$49.99", students: 0, status: "Archived", rating: 4.2, gradient: "from-slate-500 to-gray-600" },
];

const CATEGORIES = ["Design", "Development", "Data", "Marketing", "AI", "Business", "Photography"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const STATUS_OPTIONS: CourseStatus[] = ["Published", "Draft", "Archived"];

export default function AdminCoursesPage() {
  const { isDark } = useTheme();
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add Course Form State
  const [newCourse, setNewCourse] = useState({
    title: "", description: "", category: "Design",
    price: "", level: "Beginner", status: "Draft" as CourseStatus,
  });

  // ─── Theme Tokens ───────────────────────────────────────────────────────────
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

  const statusBadge = (status: CourseStatus) => {
    if (status === "Published") return "bg-emerald-500/15 text-emerald-500";
    if (status === "Draft") return "bg-amber-400/15 text-amber-400";
    return isDark ? "bg-[#22263a] text-[#7a87a1]" : "bg-slate-100 text-slate-500";
  };

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
  };

  const handleCreate = () => {
    if (!newCourse.title.trim()) return;
    const created: Course = {
      id: `c${Date.now()}`,
      title: newCourse.title,
      category: newCourse.category,
      price: newCourse.price ? `$${newCourse.price}` : "Free",
      students: 0,
      status: newCourse.status,
      rating: 0,
      gradient: "from-indigo-500 to-violet-600",
    };
    setCourses((prev) => [created, ...prev]);
    setShowAddModal(false);
    setNewCourse({ title: "", description: "", category: "Design", price: "", level: "Beginner", status: "Draft" });
  };

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-6">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Courses</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>{courses.length} total courses</p>
          </div>
          <button
            id="open-add-course-modal"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>

        {/* ── Filter Bar ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input
              id="course-search"
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
            />
          </div>
          <div className="relative">
            <select
              id="course-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`appearance-none px-4 py-2.5 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium ${input}`}
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
          </div>
        </div>

        {/* ── Courses Table ─────────────────────────────────────────── */}
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${divider} ${sectionHdr}`}>
                  <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Course</th>
                  <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Price</th>
                  <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Students</th>
                  <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Status</th>
                  <th className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>Rating</th>
                  <th className={`text-right px-4 py-3 text-xs font-semibold ${muted}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((course) => (
                  <tr
                    key={course.id}
                    className={`border-b last:border-0 transition-colors ${divider} ${
                      deleteConfirmId === course.id
                        ? isDark ? "bg-rose-900/20" : "bg-rose-50"
                        : isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Course Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${course.gradient} shrink-0 flex items-center justify-center shadow-sm`}>
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm leading-tight ${text}`}>{course.title}</p>
                          <p className={`text-xs mt-0.5 ${muted}`}>{course.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 font-semibold ${text}`}>{course.price}</td>
                    <td className={`px-4 py-3.5 ${text}`}>{course.students.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(course.status)}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className={`text-xs font-semibold ${text}`}>
                          {course.rating > 0 ? course.rating.toFixed(1) : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {deleteConfirmId === course.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs flex items-center gap-1 ${isDark ? "text-rose-400" : "text-rose-600"}`}>
                            <AlertTriangle className="w-3 h-3" /> Delete?
                          </span>
                          <button
                            id={`confirm-delete-${course.id}`}
                            onClick={() => handleDelete(course.id)}
                            className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`cancel-delete-${course.id}`}
                            onClick={() => setDeleteConfirmId(null)}
                            className={`p-1.5 rounded-lg transition-all ${iconBtn}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`edit-course-${course.id}`}
                            title="Edit"
                            className={`p-1.5 rounded-lg transition-all ${iconBtn}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`archive-course-${course.id}`}
                            title="Archive"
                            className={`p-1.5 rounded-lg transition-all ${iconBtn}`}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-course-${course.id}`}
                            title="Delete"
                            onClick={() => setDeleteConfirmId(course.id)}
                            className={`p-1.5 rounded-lg transition-all ${isDark ? "bg-[#22263a] hover:bg-rose-500/20 text-[#a0aec0] hover:text-rose-400" : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-500"}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className={`px-4 py-12 text-center text-sm ${muted}`}>
                      No courses match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add Course Modal ──────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden ${isDark ? "bg-[#13151f] border-[#252840]" : "bg-white border-slate-200"}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
              <h3 className={`text-base font-bold ${text}`}>Add New Course</h3>
              <button
                id="close-add-modal"
                onClick={() => setShowAddModal(false)}
                className={`p-1.5 rounded-lg transition-all ${iconBtn}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="new-course-title" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Course Title *</label>
                <input
                  id="new-course-title"
                  type="text"
                  placeholder="e.g. Complete JavaScript Bootcamp"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse((p) => ({ ...p, title: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                />
              </div>
              <div>
                <label htmlFor="new-course-desc" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Description</label>
                <textarea
                  id="new-course-desc"
                  rows={3}
                  placeholder="Brief course description..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse((p) => ({ ...p, description: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm resize-none ${input}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-course-category" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Category</label>
                  <div className="relative">
                    <select
                      id="new-course-category"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse((p) => ({ ...p, category: e.target.value }))}
                      className={`w-full appearance-none px-4 py-3 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="new-course-price" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Price ($)</label>
                  <input
                    id="new-course-price"
                    type="number"
                    placeholder="0 = Free"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse((p) => ({ ...p, price: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="new-course-level" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Level</label>
                  <div className="relative">
                    <select
                      id="new-course-level"
                      value={newCourse.level}
                      onChange={(e) => setNewCourse((p) => ({ ...p, level: e.target.value }))}
                      className={`w-full appearance-none px-4 py-3 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                    >
                      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="new-course-status" className={`block text-xs font-semibold mb-1.5 ${muted}`}>Status</label>
                  <div className="relative">
                    <select
                      id="new-course-status"
                      value={newCourse.status}
                      onChange={(e) => setNewCourse((p) => ({ ...p, status: e.target.value as CourseStatus }))}
                      className={`w-full appearance-none px-4 py-3 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-end gap-3 px-5 py-4 border-t ${divider}`}>
              <button
                id="cancel-add-course"
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                  isDark
                    ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Cancel
              </button>
              <button
                id="submit-add-course"
                onClick={handleCreate}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-600/20"
              >
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
