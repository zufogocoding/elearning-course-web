"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/components/ui/ThemeProvider";
import {
  Search,
  ChevronDown,
  Download,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
  Calendar,
  BookOpen,
  DollarSign,
  Mail,
  UserCircle,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// ─── Types & Mock Data ────────────────────────────────────────────────────────
type UserStatus = "Active" | "Banned";
type UserRole = "Admin" | "User";

interface AppUser {
  id: string;
  name: string;
  email: string;
  joined: string;
  courses: number;
  status: UserStatus;
  role: UserRole;
  color: string;
  bio: string;
  totalSpent: string;
  lastActive: string;
  enrolledCourses: { title: string; progress: number }[];
  purchases: { date: string; course: string; amount: string }[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pagination & Loading state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Assign a random color for avatars since backend doesn't provide color
  const colors = [
    "from-violet-500 to-indigo-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-purple-600",
    "from-teal-500 to-cyan-600",
    "from-slate-500 to-gray-600"
  ];
  const getColor = (id: string | number) => colors[Number(id) % colors.length] || colors[0];

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
  const slidePanelBg = isDark ? "bg-[#13151f] border-[#1e2235]" : "bg-white border-slate-200";

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append("search", search);
      if (roleFilter !== "All") queryParams.append("role", roleFilter.toLowerCase());
      if (statusFilter !== "All") queryParams.append("isActive", statusFilter === "Active" ? "true" : "false");

      const res = await api.get(`/api/admin/users?${queryParams.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/auth/login";
          return;
        }
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();

      const mappedUsers: AppUser[] = data.users.map((u: any) => ({
        id: u.id.toString(),
        name: u.username || "Unknown",
        email: u.email,
        joined: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        courses: 0,
        status: u.isActive ? "Active" : "Banned",
        role: u.role === "admin" ? "Admin" : "User",
        color: getColor(u.id),
        bio: u.bio || "No bio available.",
        totalSpent: "$0.00",
        lastActive: "Unknown",
        enrolledCourses: [],
        purchases: []
      }));

      setUsers(mappedUsers);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      showToast("error", "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter, showToast]);

  useEffect(() => {
    // Only fetch after a short debounce to prevent rapid API calls on typing
    const timeout = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const toggleBan = async (id: string) => {
    const userToToggle = users.find(u => u.id === id);
    if (!userToToggle) return;
    
    const newIsActive = userToToggle.status === "Banned"; // If Banned, we want to make active (true)
    
    try {
      const res = await api.put(`/api/admin/users/${id}/status`, { isActive: newIsActive });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
      }
      
      const newStatus = newIsActive ? "Active" : "Banned";
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
      );
      if (selectedUser?.id === id) {
        setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast("success", newIsActive ? "User unbanned successfully" : "User banned successfully");
    } catch (error: any) {
      console.error(error);
      showToast("error", error.message || "Failed to update user status");
    }
  };

  const deleteUser = (id: string) => {
    showToast("info", "Delete functionality not connected to API yet.");
    setDeleteConfirmId(null);
  };

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-6">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Users</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>{users.length} registered users</p>
          </div>
          <button
            id="export-users-csv"
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
              isDark
                ? "border-[#252840] text-[#e2e8f0] hover:border-indigo-500/40 hover:bg-[#1a1d2e]"
                : "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50"
            }`}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* ── Filter Bar ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input
              id="user-search"
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${input}`}
            />
          </div>
          {[
            { id: "role-filter", value: roleFilter, setter: setRoleFilter, options: ["All", "Admin", "User"], label: "All Roles" },
            { id: "status-filter", value: statusFilter, setter: setStatusFilter, options: ["All", "Active", "Banned"], label: "All Status" },
          ].map(({ id, value, setter, options, label }) => (
            <div key={id} className="relative">
              <select
                id={id}
                value={value}
                onChange={(e) => { setter(e.target.value); setPage(1); }}
                className={`appearance-none px-4 py-2.5 pr-9 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-medium ${input}`}
              >
                {options.map((o) => <option key={o} value={o}>{o === "All" ? label : o}</option>)}
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`} />
            </div>
          ))}
        </div>

        {/* ── Users Table ───────────────────────────────────────────── */}
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${divider} ${sectionHdr}`}>
                  {["User", "Email", "Joined", "Courses", "Status", "Actions"].map((h) => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${muted}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className={`px-4 py-12 text-center text-sm ${muted}`}>
                      Loading users...
                    </td>
                  </tr>
                ) : users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b last:border-0 transition-colors ${divider} ${
                      deleteConfirmId === user.id
                        ? isDark ? "bg-rose-900/20" : "bg-rose-50"
                        : isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Avatar + Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${user.color} shrink-0 flex items-center justify-center shadow-sm`}
                        >
                          <span className="text-xs font-extrabold text-white">
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className={`font-semibold text-sm leading-tight ${text}`}>{user.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            user.role === "Admin"
                              ? isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                              : isDark ? "bg-[#22263a] text-[#7a87a1]" : "bg-slate-100 text-slate-500"
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-xs ${muted}`}>{user.email}</td>
                    <td className={`px-4 py-3.5 text-xs whitespace-nowrap ${muted}`}>{user.joined}</td>
                    <td className={`px-4 py-3.5 font-semibold ${text}`}>{user.courses}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        user.status === "Active"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-rose-500/15 text-rose-500"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {deleteConfirmId === user.id ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs flex items-center gap-1 ${isDark ? "text-rose-400" : "text-rose-600"}`}>
                            <AlertTriangle className="w-3 h-3" /> Delete?
                          </span>
                          <button
                            id={`confirm-delete-user-${user.id}`}
                            onClick={() => deleteUser(user.id)}
                            className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`cancel-delete-user-${user.id}`}
                            onClick={() => setDeleteConfirmId(null)}
                            className={`p-1.5 rounded-lg transition-all ${iconBtn}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            id={`view-user-${user.id}`}
                            title="View Details"
                            onClick={() => setSelectedUser(user)}
                            className={`p-1.5 rounded-lg transition-all ${iconBtn}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`ban-user-${user.id}`}
                            title={user.status === "Active" ? "Ban User" : "Unban User"}
                            onClick={() => toggleBan(user.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                              user.status === "Active"
                                ? isDark ? "bg-[#22263a] hover:bg-amber-500/20 text-[#a0aec0] hover:text-amber-400" : "bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-500"
                                : isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {user.status === "Active" ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            id={`delete-user-${user.id}`}
                            title="Delete User"
                            onClick={() => setDeleteConfirmId(user.id)}
                            className={`p-1.5 rounded-lg transition-all ${isDark ? "bg-[#22263a] hover:bg-rose-500/20 text-[#a0aec0] hover:text-rose-400" : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-500"}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className={`px-4 py-12 text-center text-sm ${muted}`}>
                      No users match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <span className={`text-sm ${muted}`}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pagination.page === 1
                    ? "opacity-50 cursor-not-allowed " + (isDark ? "bg-[#1a1d2e] text-[#4a5568]" : "bg-slate-100 text-slate-400")
                    : isDark ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#e2e8f0]" : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pagination.page === pagination.totalPages
                    ? "opacity-50 cursor-not-allowed " + (isDark ? "bg-[#1a1d2e] text-[#4a5568]" : "bg-slate-100 text-slate-400")
                    : isDark ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#e2e8f0]" : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── User Detail Slide-in Panel ────────────────────────────────── */}
      {/* Backdrop */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 border-l shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${slidePanelBg} ${
          selectedUser ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedUser && (
          <>
            {/* Panel Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
              <h3 className={`text-sm font-bold ${text}`}>User Details</h3>
              <button
                id="close-user-panel"
                onClick={() => setSelectedUser(null)}
                className={`p-1.5 rounded-lg transition-all ${iconBtn}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedUser.color} flex items-center justify-center shadow-xl`}>
                  <span className="text-2xl font-extrabold text-white">
                    {selectedUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h4 className={`text-lg font-extrabold ${text}`}>{selectedUser.name}</h4>
                  <p className={`text-xs mt-0.5 ${muted}`}>{selectedUser.bio}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    selectedUser.role === "Admin"
                      ? isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                      : isDark ? "bg-[#22263a] text-[#7a87a1]" : "bg-slate-100 text-slate-500"
                  }`}>
                    {selectedUser.role}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    selectedUser.status === "Active"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-rose-500/15 text-rose-500"
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className={`border rounded-xl p-4 space-y-3 ${card}`}>
                {[
                  { icon: Mail, label: "Email", value: selectedUser.email },
                  { icon: Calendar, label: "Joined", value: selectedUser.joined },
                  { icon: UserCircle, label: "Last Active", value: selectedUser.lastActive },
                  { icon: BookOpen, label: "Courses", value: `${selectedUser.courses} enrolled` },
                  { icon: DollarSign, label: "Total Spent", value: selectedUser.totalSpent },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-[#22263a]" : "bg-slate-100"}`}>
                      <Icon className={`w-3.5 h-3.5 ${muted}`} />
                    </div>
                    <div>
                      <p className={`text-[10px] ${muted}`}>{label}</p>
                      <p className={`text-xs font-semibold ${text}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enrolled Courses */}
              {selectedUser.enrolledCourses.length > 0 && (
                <div>
                  <h5 className={`text-xs font-bold mb-2 ${muted}`}>ENROLLED COURSES</h5>
                  <div className="space-y-2">
                    {selectedUser.enrolledCourses.map((c) => (
                      <div key={c.title} className={`border rounded-xl p-3 ${card}`}>
                        <div className="flex justify-between items-center mb-1.5">
                          <p className={`text-xs font-semibold ${text}`}>{c.title}</p>
                          <span className={`text-xs font-bold ${c.progress === 100 ? "text-emerald-500" : "text-indigo-500"}`}>
                            {c.progress}%
                          </span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-[#22263a]" : "bg-slate-100"}`}>
                          <div
                            className={`h-full rounded-full ${c.progress === 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                            style={{ width: `${c.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase History */}
              {selectedUser.purchases.length > 0 && (
                <div>
                  <h5 className={`text-xs font-bold mb-2 ${muted}`}>PURCHASE HISTORY</h5>
                  <div className="space-y-2">
                    {selectedUser.purchases.map((p, i) => (
                      <div key={i} className={`flex items-center justify-between border rounded-xl p-3 ${card}`}>
                        <div>
                          <p className={`text-xs font-semibold ${text}`}>{p.course}</p>
                          <p className={`text-[10px] ${muted}`}>{p.date}</p>
                        </div>
                        <span className={`text-xs font-bold text-emerald-500`}>{p.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className={`flex gap-2 p-4 border-t ${divider}`}>
              <button
                id={`panel-ban-${selectedUser.id}`}
                onClick={() => toggleBan(selectedUser.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl text-sm font-semibold transition-all ${
                  selectedUser.status === "Active"
                    ? isDark
                      ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      : "border-amber-300 text-amber-600 hover:bg-amber-50"
                    : isDark
                    ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {selectedUser.status === "Active" ? (
                  <><ShieldOff className="w-4 h-4" /> Ban User</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Unban User</>
                )}
              </button>
              <button
                id={`panel-delete-${selectedUser.id}`}
                onClick={() => {
                  setDeleteConfirmId(selectedUser.id);
                  setSelectedUser(null);
                }}
                className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/25 rounded-xl text-sm font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
