"use client";

import { useState } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SettingsTab({ course, onUpdate }: { course: any; onUpdate: (data: any) => Promise<boolean> }) {
  const { isDark } = useTheme();
  const router = useRouter();

  const [form, setForm] = useState({
    price: course.price ? String(course.price) : "",
    discountPrice: course.discountPrice ? String(course.discountPrice) : "",
    status: course.status || "draft",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    setFormError("");
    setSuccessMsg("");
    
    // Validate discount price < price
    const p = parseFloat(form.price) || 0;
    const dp = form.discountPrice ? parseFloat(form.discountPrice) : 0;

    if (form.discountPrice && dp >= p) {
      setFormError("Giá khuyến mãi phải nhỏ hơn giá gốc.");
      return;
    }

    setSaving(true);
    const updatedData = {
      price: p,
      discountPrice: form.discountPrice ? dp : null,
      status: form.status,
    };

    const success = await onUpdate(updatedData);
    if (success) setSuccessMsg("Cập nhật cài đặt thành công!");
    else setFormError("Cập nhật thất bại. Vui lòng thử lại.");
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.")) return;
    try {
      const res = await api.delete(`/api/courses/${course.id}`);
      if (res.ok) {
        router.push("/admin/courses");
      } else {
        alert("Xóa thất bại.");
      }
    } catch {
      alert("Lỗi kết nối.");
    }
  };

  const inputClass = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/40";
  const mutedClass = isDark ? "text-[#7a87a1]" : "text-slate-500";

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {formError && (
        <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-sm">
          {formError}
        </div>
      )}
      {successMsg && (
        <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm">
          {successMsg}
        </div>
      )}

      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#13151f] border-[#1e2235]' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Cài đặt giá bán</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${mutedClass}`}>Giá gốc (₫)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-semibold mb-2 ${mutedClass}`}>Giá khuyến mãi (₫)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={form.discountPrice}
              onChange={(e) => setForm(p => ({ ...p, discountPrice: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${inputClass}`}
            />
            {form.discountPrice && (parseFloat(form.discountPrice) >= (parseFloat(form.price) || 0)) && (
              <p className="text-rose-500 text-xs mt-1">Giá khuyến mãi phải nhỏ hơn giá gốc.</p>
            )}
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#13151f] border-[#1e2235]' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Trạng thái hiển thị</h3>
        <div className="flex gap-4">
          {["draft", "published", "archived"].map(opt => (
            <button
              key={opt}
              onClick={() => setForm(p => ({ ...p, status: opt }))}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all border ${
                form.status === opt 
                  ? opt === 'published' ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : opt === 'draft' ? 'bg-amber-500 border-amber-400 text-white'
                    : 'bg-slate-500 border-slate-400 text-white'
                  : inputClass
              }`}
            >
              {opt === 'published' ? 'Đã xuất bản' : opt === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Lưu cài đặt
        </button>
      </div>

      <div className={`mt-12 p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-500/20 text-rose-500 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-rose-500 mb-1">Xóa khóa học</h3>
            <p className={`text-sm mb-4 ${mutedClass}`}>
              Hành động này sẽ xóa hoàn toàn khóa học, giáo trình, bài học và dữ liệu đăng ký. Không thể khôi phục!
            </p>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Xóa khóa học
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
