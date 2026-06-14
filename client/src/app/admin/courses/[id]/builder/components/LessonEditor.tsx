import React, { useState, useEffect, useRef } from "react";
import { Loader2, Save, Video, FileText, HelpCircle } from "lucide-react";
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync inputs ONLY when the active lesson ID changes (switching lessons)
  useEffect(() => {
    setTitle(lesson.title);
    setContentUrl(lesson.contentUrl || "");
    setDurationSeconds(lesson.durationSeconds);
    setIsPreview(lesson.isPreview);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [lesson.id]);

  // Maintain latest values in a ref for unmount/switch saving
  const latestValuesRef = useRef({ title, contentUrl, durationSeconds, isPreview, lessonId: lesson.id });
  useEffect(() => {
    latestValuesRef.current = { title, contentUrl, durationSeconds, isPreview, lessonId: lesson.id };
  }, [title, contentUrl, durationSeconds, isPreview, lesson.id]);

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
        });

        if (res.ok) {
          setSaveState("saved");
          onSaveSuccess();
        } else {
          setSaveState("error");
        }
      } catch {
        setSaveState("error");
      }
    }, 1000); // 1-second debounce
  };

  // Input change handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave({ title: val, contentUrl, durationSeconds, isPreview });
  };

  const handleContentUrlChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const val = e.target.value;
    setContentUrl(val);
    triggerAutoSave({ title, contentUrl: val, durationSeconds, isPreview });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 0;
    setDurationSeconds(val);
    triggerAutoSave({ title, contentUrl, durationSeconds: val, isPreview });
  };

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setIsPreview(val);
    triggerAutoSave({ title, contentUrl, durationSeconds, isPreview: val });
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
        {lesson.contentType === "video" ? (
          <Video className="w-5 h-5 text-indigo-500" />
        ) : (
          <FileText className="w-5 h-5 text-emerald-500" />
        )}
        <div>
          <h2 className={`text-base font-bold ${text}`}>Chỉnh sửa thông tin bài học</h2>
          <p className={`text-xs ${muted}`}>Loại bài giảng: <span className="capitalize font-semibold">{lesson.contentType}</span></p>
        </div>
      </div>

      <div className="space-y-5">
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

        {lesson.contentType === "video" && (
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

        {lesson.contentType === "document" && (
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
      </div>
    </div>
  );
}
