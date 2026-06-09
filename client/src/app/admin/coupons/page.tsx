"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Coupon {
  id: string;
  code: string;
  discountType: "Percent" | "Fixed";
  discountValue: number;
  validFrom: string;
  validTo: string;
  usageCount: number;
  usageLimit: number;
  isActive: boolean;
}

export default function ManageCouponsPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    code: "",
    discountType: "Percent",
    discountValue: 0,
    validFrom: "",
    validTo: "",
    usageLimit: 100,
    isActive: true,
  });

  // ─── Theme Tokens ───────────────────────────────────────────────────────────
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const sectionHdr = isDark ? "bg-[#13151f]" : "bg-slate-50";
  const input = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";
  const iconBtn = isDark
    ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#a0aec0] hover:text-white"
    : "bg-slate-100 hover:bg-slate-200 text-slate-600";

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get('/api/admin/coupons');
        if (!res.ok) throw new Error("Failed to fetch coupons");
        const data = await res.json();
        
        const mappedCoupons = data.coupons.map((c: any) => ({
          id: c.id.toString(),
          code: c.code,
          discountType: c.discountType,
          discountValue: Number(c.discountValue),
          validFrom: c.validFrom ? new Date(c.validFrom).toISOString().split('T')[0] : "",
          validTo: c.validTo ? new Date(c.validTo).toISOString().split('T')[0] : "",
          usageCount: c.usedCount,
          usageLimit: c.usageLimit,
          isActive: c.isActive,
        }));
        setCoupons(mappedCoupons);
      } catch (error) {
        console.error(error);
        showToast("error", "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [showToast]);

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setFormData({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        usageLimit: coupon.usageLimit,
        isActive: coupon.isActive,
      });
    } else {
      setFormData({
        id: "",
        code: "",
        discountType: "Percent",
        discountValue: 0,
        validFrom: "",
        validTo: "",
        usageLimit: 100,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        // Update
        const res = await api.put(`/api/admin/coupons/${formData.id}`, formData);
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || "Failed to update");
        }
        const data = await res.json();
        const savedCoupon = data.coupon;
        
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === formData.id ? { 
              ...c, 
              ...formData, 
              usageCount: savedCoupon.usedCount 
            } as Coupon : c
          )
        );
        showToast("success", "Cập nhật thành công");
      } else {
        // Create
        const res = await api.post(`/api/admin/coupons`, formData);
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || "Failed to create");
        }
        const data = await res.json();
        const savedCoupon = data.coupon;

        const newCoupon: Coupon = {
          ...formData,
          id: savedCoupon.id.toString(),
          discountType: savedCoupon.discountType as "Percent" | "Fixed",
          usageCount: savedCoupon.usedCount,
        };
        setCoupons([newCoupon, ...coupons]);
        showToast("success", "Thêm mới thành công");
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      showToast("error", error.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteConfirm = async () => {
    if (couponToDelete) {
      try {
        const res = await api.delete(`/api/admin/coupons/${couponToDelete}`);
        if (!res.ok) throw new Error("Failed to delete coupon");
        
        setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete));
        setCouponToDelete(null);
        setIsDeleteModalOpen(false);
        showToast("success", "Xóa thành công");
      } catch (error: any) {
        console.error(error);
        showToast("error", error.message || "Xóa thất bại");
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 py-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Quản lý Mã Giảm Giá</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>Tạo và quản lý các mã giảm giá cho khóa học.</p>
          </div>
          <button
            id="add-coupon-btn"
            onClick={() => handleOpenModal()}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              isDark
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30"
                : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
            }`}
          >
            <Plus className="w-4 h-4" />
            Thêm Mã Giảm Giá
          </button>
        </div>

        {/* Data Table Container */}
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${divider} ${sectionHdr}`}>
                  {["Mã", "Loại giảm giá", "Giá trị", "Thời hạn", "Đã dùng", "Trạng thái"].map((h) => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold ${muted}`}>{h}</th>
                  ))}
                  <th className={`px-4 py-3 text-right text-xs font-semibold ${muted}`}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className={`flex flex-col items-center justify-center ${muted}`}>
                        <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-50" />
                        <p className="text-sm">Đang tải dữ liệu...</p>
                      </div>
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className={`flex flex-col items-center justify-center ${muted}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDark ? "bg-[#22263a]" : "bg-slate-100"}`}>
                          <Search className="w-6 h-6 opacity-50" />
                        </div>
                        <p className={`text-base font-semibold mb-1 ${text}`}>Không có dữ liệu</p>
                        <p className="text-sm">Hãy bắt đầu bằng cách tạo mã giảm giá mới.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className={`border-b last:border-0 transition-colors ${divider} ${isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"}`}>
                      <td className={`px-4 py-3.5 whitespace-nowrap font-semibold ${text}`}>
                        {coupon.code}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            coupon.discountType === "Percent"
                              ? isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                              : isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {coupon.discountType === "Percent" ? "% Phần trăm" : "$ Cố định"}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 whitespace-nowrap font-semibold ${text}`}>
                        {coupon.discountType === "Percent" ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                      </td>
                      <td className={`px-4 py-3.5 whitespace-nowrap text-xs font-medium ${muted}`}>
                        {coupon.validFrom} <span className="mx-1 opacity-50">-</span> {coupon.validTo}
                      </td>
                      <td className={`px-4 py-3.5 whitespace-nowrap text-xs font-semibold ${text}`}>
                        {coupon.usageCount} <span className={`mx-1 font-medium ${muted}`}>/</span> {coupon.usageLimit}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            coupon.isActive
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-rose-500/15 text-rose-500"
                          }`}
                        >
                          {coupon.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity [tr:hover_&]:opacity-100">
                          <button
                            id={`edit-coupon-btn-${coupon.id}`}
                            onClick={() => handleOpenModal(coupon)}
                            className={`p-1.5 rounded-lg transition-all ${iconBtn}`}
                            title="Sửa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-coupon-btn-${coupon.id}`}
                            onClick={() => {
                              setCouponToDelete(coupon.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${isDark ? "bg-[#22263a] hover:bg-rose-500/20 text-[#a0aec0] hover:text-rose-400" : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-500"}`}
                            title="Xoá"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
            <div className={`relative rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all border ${card}`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between ${divider}`}>
                <h3 className={`text-lg font-bold tracking-tight ${text}`}>{formData.id ? "Sửa Mã Giảm Giá" : "Thêm Mã Giảm Giá Mới"}</h3>
              </div>
              <form onSubmit={handleSaveCoupon}>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={`block text-[10px] font-extrabold tracking-wider mb-1.5 uppercase ${muted}`}>Mã giảm giá</label>
                      <input
                        id="coupon-code-input"
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-xl outline-none transition-all text-sm font-semibold ${input}`}
                        placeholder="VD: SUMMER2026"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={`block text-[10px] font-extrabold tracking-wider mb-1.5 uppercase ${muted}`}>Loại giảm giá</label>
                      <select
                        id="discount-type-select"
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-xl outline-none transition-all text-sm font-semibold appearance-none ${input}`}
                      >
                        <option value="Percent">Phần trăm (%)</option>
                        <option value="Fixed">Số tiền cố định ($)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={`block text-[10px] font-extrabold tracking-wider mb-1.5 uppercase ${muted}`}>Giá trị giảm</label>
                      <input
                        id="discount-value-input"
                        type="number"
                        required
                        min="0"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                        className={`w-full px-3 py-2.5 border rounded-xl outline-none transition-all text-sm font-semibold ${input}`}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={`block text-[10px] font-extrabold tracking-wider mb-1.5 uppercase ${muted}`}>Giới hạn sử dụng</label>
                      <input
                        id="usage-limit-input"
                        type="number"
                        required
                        min="1"
                        value={formData.usageLimit}
                        onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                        className={`w-full px-3 py-2.5 border rounded-xl outline-none transition-all text-sm font-semibold ${input}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={`block text-[10px] font-extrabold tracking-wider mb-1.5 uppercase ${muted}`}>Từ ngày</label>
                      <input
                        id="valid-from-input"
                        type="date"
                        required
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-xl outline-none transition-all text-sm font-semibold ${input}`}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={`block text-[10px] font-extrabold tracking-wider mb-1.5 uppercase ${muted}`}>Đến ngày</label>
                      <input
                        id="valid-to-input"
                        type="date"
                        required
                        value={formData.validTo}
                        onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-xl outline-none transition-all text-sm font-semibold ${input}`}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          id="is-active-checkbox"
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="peer sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 transition-all ${
                          isDark
                            ? "border-[#4a5568] peer-checked:border-indigo-500 peer-checked:bg-indigo-500"
                            : "border-slate-300 peer-checked:border-indigo-600 peer-checked:bg-indigo-600"
                        }`}></div>
                        <svg className={`absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`text-sm font-bold ${text}`}>Kích hoạt mã giảm giá</span>
                    </label>
                  </div>
                </div>
                <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t ${divider} ${sectionHdr}`}>
                  <button
                    id="modal-cancel-btn"
                    type="button"
                    onClick={handleCloseModal}
                    className={`px-4 py-2.5 text-sm font-bold rounded-xl border transition-all ${
                      isDark
                        ? "border-[#252840] text-[#e2e8f0] hover:bg-[#22263a]"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Hủy
                  </button>
                  <button
                    id="modal-save-btn"
                    type="submit"
                    className={`px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                      isDark
                        ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    Lưu Mã Giảm Giá
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
            <div className={`relative rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all p-6 text-center border ${card}`}>
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-2xl mb-4 ${isDark ? "bg-rose-500/20" : "bg-rose-100"}`}>
                <Trash2 className={`h-6 w-6 ${isDark ? "text-rose-400" : "text-rose-600"}`} />
              </div>
              <h3 className={`text-lg font-bold tracking-tight mb-2 ${text}`}>Xoá Mã Giảm Giá</h3>
              <p className={`text-sm mb-6 font-medium leading-relaxed ${muted}`}>
                Bạn có chắc chắn muốn xoá mã này không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  id="delete-modal-cancel-btn"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all ${
                    isDark
                      ? "border-[#252840] text-[#e2e8f0] hover:bg-[#22263a]"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Hủy
                </button>
                <button
                  id="delete-modal-confirm-btn"
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all shadow-sm shadow-rose-600/20"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
