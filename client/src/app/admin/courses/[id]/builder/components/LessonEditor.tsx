import React, { useState, useEffect, useRef } from "react";
import { Loader2, Save, Video, FileText, HelpCircle, Paperclip, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";

import { Lesson } from "../types";

interface LessonEditorProps {
  lesson: Lesson;
  isDark: boolean;
  onSaveSuccess: () => void;
  setSaveState: (state: "saved" | "saving" | "error" | "") => void;
}

export default function LessonEditor({
  lesson,
  isDark,
  onSaveSuccess,
  setSaveState,
}: LessonEditorProps) {
  const [title, setTitle] = useState(lesson.title);
  const [contentUrl, setContentUrl] = useState(lesson.contentUrl || "");
  const [durationSeconds, setDurationSeconds] = useState(lesson.durationSeconds);
  const [isPreview, setIsPreview] = useState(lesson.isPreview);
  const [contentType, setContentType] = useState(lesson.contentType);
  const [attachments, setAttachments] = useState(lesson.attachments || []);
  const [uploadingAtt, setUploadingAtt] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync inputs ONLY when the active lesson ID changes (switching lessons)
  useEffect(() => {
    setTitle(lesson.title);
    setContentUrl(lesson.contentUrl || "");
    setDurationSeconds(lesson.durationSeconds);
    setIsPreview(lesson.isPreview);
    setAttachments(lesson.attachments || []);
    setContentType(lesson.contentType);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [lesson.id]);

  // Maintain latest values in a ref for unmount/switch saving
  const latestValuesRef = useRef({ title, contentUrl, durationSeconds, isPreview, contentType, lessonId: lesson.id });
  useEffect(() => {
    latestValuesRef.current = { title, contentUrl, durationSeconds, isPreview, contentType, lessonId: lesson.id };
  }, [title, contentUrl, durationSeconds, isPreview, contentType, lesson.id]);

  // Flush unsaved edits immediately on unmount or lesson change
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const last = latestValuesRef.current;
        api.put(`/api/content/lessons/${last.lessonId}`, {
          title: last.title,
          contentUrl: last.contentUrl,
          durationSeconds: parseInt(String(last.durationSeconds), 10) || 0,
          isPreview: last.isPreview,
          contentType: last.contentType,
        }).catch((err) => console.error("Lỗi lưu bài học khi chuyển bài:", err));
      }
    };
  }, [lesson.id]);

  // Handle auto-save function
  const triggerAutoSave = (updatedFields: {
    title: string;
    contentUrl: string;
    durationSeconds: number;
    isPreview: boolean;
    contentType: string;
  }) => {
    setSaveState("saving");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.put(`/api/content/lessons/${lesson.id}`, {
          title: updatedFields.title,
          contentUrl: updatedFields.contentUrl,
          durationSeconds: parseInt(String(updatedFields.durationSeconds), 10) || 0,
          isPreview: updatedFields.isPreview,
          contentType: updatedFields.contentType,
        });

        if (res.ok) {
          setSaveState("saved");
          onSaveSuccess();
        } else {
          setSaveState("error");
        }
      } catch {
        setSaveState("error");
      } finally {
        timerRef.current = null;
      }
    }, 1000); // 1-second debounce
  };

  // Input change handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave({ title: val, contentUrl, durationSeconds, isPreview, contentType });
  };

  const handleContentUrlChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const val = e.target.value;
    setContentUrl(val);
    triggerAutoSave({ title, contentUrl: val, durationSeconds, isPreview, contentType });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 0;
    setDurationSeconds(val);
    triggerAutoSave({ title, contentUrl, durationSeconds: val, isPreview, contentType });
  };

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setIsPreview(val);
    triggerAutoSave({ title, contentUrl, durationSeconds, isPreview: val, contentType });
  };

  const handleContentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as "video" | "document" | "quiz";
    setContentType(val);
    triggerAutoSave({ title, contentUrl, durationSeconds, isPreview, contentType: val });
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Kích thước file vượt quá giới hạn 20MB.");
      return;
    }

    setUploadingAtt(true);
    setSaveState("saving");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(`/api/content/lessons/${lesson.id}/attachments`, formData);
      if (res.ok) {
        const data = await res.json();
        setAttachments((prev) => [...prev, data.attachment]);
        setSaveState("saved");
        onSaveSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "Lỗi tải lên file đính kèm.");
        setSaveState("error");
      }
    } catch {
      alert("Lỗi kết nối.");
      setSaveState("error");
    } finally {
      setUploadingAtt(false);
      e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa file đính kèm này?")) return;
    setSaveState("saving");
    try {
      const res = await api.delete(`/api/content/attachments/${attId}`);
      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== attId));
        setSaveState("saved");
        onSaveSuccess();
      } else {
        setSaveState("error");
      }
    } catch {
      setSaveState("error");
    }
  };

  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const inputStyle = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40 focus:border-indigo-500"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40 focus:border-indigo-500";

  return (
    <div className={`border rounded-2xl p-6 ${card} space-y-6 shadow-sm`}>
      <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-[#252840]">
        {contentType === "video" ? (
          <Video className="w-5 h-5 text-indigo-500" />
        ) : contentType === "quiz" ? (
          <HelpCircle className="w-5 h-5 text-amber-500" />
        ) : (
          <FileText className="w-5 h-5 text-emerald-500" />
        )}
        <div>
          <h2 className={`text-base font-bold ${text}`}>Chỉnh sửa thông tin bài học</h2>
          <p className={`text-xs ${muted}`}>Cấu hình loại nội dung bài học và tài liệu</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>Tên bài học</label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
              placeholder="Ví dụ: Giới thiệu khóa học"
            />
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>Loại bài giảng</label>
            <select
              value={contentType}
              onChange={handleContentTypeChange}
              className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
            >
              <option value="video">Bài học Video</option>
              <option value="document">Bài đọc (Tài liệu)</option>
              <option value="quiz">Bài Quiz trắc nghiệm</option>
            </select>
          </div>
        </div>

        {contentType === "video" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>Đường dẫn Video (YouTube ID hoặc link)</label>
              <input
                type="text"
                value={contentUrl}
                onChange={handleContentUrlChange}
                className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>Thời lượng (giây)</label>
              <input
                type="number"
                value={durationSeconds}
                onChange={handleDurationChange}
                className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
                min="0"
              />
            </div>
          </div>
        )}

        {(contentType === "document" || contentType === "quiz") && (
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>Nội dung bài viết (Markdown/Text)</label>
            <textarea
              rows={8}
              value={contentUrl}
              onChange={handleContentUrlChange}
              className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 text-xs resize-none transition-all ${inputStyle}`}
              placeholder="Nhập nội dung bài viết ở đây. Hỗ trợ định dạng Markdown..."
            />
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              checked={isPreview}
              onChange={handlePreviewChange}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer border-slate-300 focus:ring-indigo-500"
            />
            <span className={`font-semibold ${text}`}>Cho phép học thử miễn phí (Preview)</span>
          </label>
        </div>

        {/* Attachments Section */}
        <div className={`mt-8 pt-6 border-t ${isDark ? 'border-[#252840]' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${text} flex items-center gap-2`}>
                <Paperclip className="w-4 h-4 text-indigo-500" /> Tài liệu đính kèm
              </h3>
              <p className={`text-xs mt-1 ${muted}`}>Tải lên PDF, Word, Excel, ZIP (Tối đa 20MB/file)</p>
            </div>
            <div>
              <label className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isDark 
                  ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" 
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}>
                {uploadingAtt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingAtt ? "Đang tải..." : "Tải lên"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUploadAttachment}
                  disabled={uploadingAtt}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.xz,.tar,.7z,.txt"
                />
              </label>
            </div>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'border-[#252840] bg-[#22263a]' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1a1d2e]' : 'bg-white'} shadow-sm`}>
                      <FileText className={`w-4 h-4 ${muted}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${text}`}>{att.fileName}</p>
                      <p className={`text-[10px] ${muted}`}>{(att.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-100 text-rose-600'}`}
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-6 border-2 border-dashed rounded-xl ${isDark ? 'border-[#252840] bg-[#1a1d2e]/50' : 'border-slate-200 bg-slate-50/50'}`}>
              <Paperclip className={`w-6 h-6 mx-auto mb-2 opacity-30 ${muted}`} />
              <p className={`text-xs ${muted}`}>Chưa có tài liệu đính kèm nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
