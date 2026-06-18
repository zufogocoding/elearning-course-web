"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ui/ThemeProvider";
import { Loader2, Plus, X } from "lucide-react";

const COVER_PRESETS = [
  { name: "Web Dev", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop" },
  { name: "Data Science", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop" },
  { name: "UI/UX Design", url: "https://images.unsplash.com/photo-1561070791-26c113006238?w=800&auto=format&fit=crop" },
  { name: "Marketing", url: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&auto=format&fit=crop" },
  { name: "Business", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop" },
  { name: "Abstract Indigo", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop" },
];

const LEVELS = [
  { value: "beginner", label: "Cơ bản" },
  { value: "intermediate", label: "Trung bình" },
  { value: "advanced", label: "Nâng cao" },
];

export default function BasicInfoTab({ course, onUpdate }: { course: any; onUpdate: (data: any) => Promise<boolean> }) {
  const { isDark } = useTheme();

  const [form, setForm] = useState({
    title: course.title || "",
    shortDescription: course.shortDescription || "",
    categoryId: course.categoryId ? String(course.categoryId) : "",
    level: course.level || "beginner",
    thumbnailUrl: course.thumbnailUrl || "",
  });

  const [categories, setCategories] = useState<{id: number; name: string}[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch {}
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước tệp tin tối đa là 5MB.");
      return;
    }
    setUploadingImage(true);
    setFormError("");

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
            setFormError(data.error || "Không thể tải lên ảnh bìa.");
          }
        } catch {
          setFormError("Lỗi kết nối khi tải lên hình ảnh.");
        } finally {
          setUploadingImage(false);
        }
      };
    } catch {
      setFormError("Lỗi xử lý file.");
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setFormError("");
    setSuccessMsg("");
    if (!form.title.trim()) {
      setFormError("Vui lòng nhập tên khóa học");
      return;
    }
    setSaving(true);
    const updatedData = {
      title: form.title,
      shortDescription: form.shortDescription,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      level: form.level,
      thumbnailUrl: form.thumbnailUrl,
    };
    const success = await onUpdate(updatedData);
    if (success) setSuccessMsg("Cập nhật thông tin cơ bản thành công!");
    else setFormError("Cập nhật thất bại. Vui lòng thử lại.");
    setSaving(false);
  };

  const inputClass = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/40";
  const mutedClass = isDark ? "text-[#7a87a1]" : "text-slate-500";

  return (
    <div className="max-w-4xl space-y-6 pb-20">
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

      <div>
        <label className={`block text-sm font-semibold mb-2 ${mutedClass}`}>Tên khóa học *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${inputClass}`}
        />
      </div>

      <div>
        <label className={`block text-sm font-semibold mb-2 ${mutedClass}`}>Mô tả ngắn</label>
        <textarea
          rows={3}
          value={form.shortDescription}
          onChange={(e) => setForm(p => ({ ...p, shortDescription: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm resize-none ${inputClass}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-semibold mb-2 ${mutedClass}`}>Danh mục</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
            className={`w-full appearance-none px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${inputClass}`}
          >
            <option value="">Không có danh mục</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div>
          <label className={`block text-sm font-semibold mb-2 ${mutedClass}`}>Cấp độ</label>
          <select
            value={form.level}
            onChange={(e) => setForm(p => ({ ...p, level: e.target.value }))}
            className={`w-full appearance-none px-4 py-3 border rounded-xl outline-none focus:ring-2 transition-all text-sm ${inputClass}`}
          >
            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-semibold mb-2 ${mutedClass}`}>Ảnh bìa khóa học</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => document.getElementById("file-upload-input")?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-indigo-500/85 ${
              isDark ? "bg-[#181a27] border-[#2d314d]" : "bg-slate-50 border-slate-300"
            }`}
          >
            <input
              id="file-upload-input"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            {uploadingImage ? (
              <div className="text-center space-y-2"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /><p className={`text-xs ${mutedClass}`}>Đang tải ảnh lên...</p></div>
            ) : (
              <div className="text-center space-y-2"><Plus className="w-8 h-8 text-indigo-500 mx-auto opacity-70" /><p className="text-xs font-bold">Tải ảnh lên</p></div>
            )}
          </div>
          <div className="space-y-4">
            {form.thumbnailUrl ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border shadow-md">
                <img src={form.thumbnailUrl} alt="Cover" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, thumbnailUrl: "" }))}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500/90 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className={`aspect-video w-full rounded-2xl flex items-center justify-center border-dashed border-2 ${isDark ? "border-[#2d314d]" : "border-slate-300"}`}>
                <p className={`text-xs italic ${mutedClass}`}>Chưa chọn ảnh bìa</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {COVER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setForm(p => ({ ...p, thumbnailUrl: preset.url }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                form.thumbnailUrl === preset.url ? "bg-indigo-600 border-indigo-500 text-white" : `${inputClass}`
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Lưu thông tin cơ bản
        </button>
      </div>
    </div>
  );
}
