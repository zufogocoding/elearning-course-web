import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";

import { Option, Question, Quiz, Lesson, Section } from "../types";

interface CurriculumSidebarProps {
  sections: Section[];
  selectedLessonId: number | null;
  onSelectLesson: (id: number) => void;
  isDark: boolean;
  loading: boolean;
  error: string;
  
  // Section CRUD
  onCreateSection: (title: string) => Promise<void>;
  onEditSectionTitle: (id: number, newTitle: string) => Promise<void>;
  onDeleteSection: (id: number) => Promise<void>;
  
  // Lesson CRUD
  onCreateLesson: (sectionId: number, title: string, type: "video" | "document" | "quiz") => Promise<void>;
  onDeleteLesson: (id: number) => Promise<void>;

  // Reordering (Optimistic UI)
  onMoveSection: (sectionId: number, direction: "up" | "down") => void;
  onMoveLesson: (sectionId: number, lessonId: number, direction: "up" | "down") => void;
  onDragDropReorder: (draggedData: DraggedItemData, dropTargetData: DropTargetData) => void;
}

export type DraggedItemData =
  | { type: "section"; sectionId: number; index: number }
  | { type: "lesson"; lessonId: number; sectionId: number; index: number };

export type DropTargetData =
  | { type: "section"; sectionId: number; index: number }
  | { type: "lesson"; lessonId: number; sectionId: number; index: number }
  | { type: "section-empty-drop"; sectionId: number };

export default function CurriculumSidebar({
  sections,
  selectedLessonId,
  onSelectLesson,
  isDark,
  loading,
  error,
  onCreateSection,
  onEditSectionTitle,
  onDeleteSection,
  onCreateLesson,
  onDeleteLesson,
  onMoveSection,
  onMoveLesson,
  onDragDropReorder,
}: CurriculumSidebarProps) {
  // Inline creation / edit states
  const [showAddSectionInput, setShowAddSectionInput] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [sectionTitleInput, setSectionTitleInput] = useState("");
  const [addingLessonSectionId, setAddingLessonSectionId] = useState<number | null>(null);
  const [newLessonType, setNewLessonType] = useState<"video" | "document" | "quiz">("video");
  const [newLessonTitle, setNewLessonTitle] = useState("");

  // Drag and Drop state trackers
  const [draggedItem, setDraggedItem] = useState<DraggedItemData | null>(null);
  const [dragOverItem, setDragOverItem] = useState<DropTargetData | null>(null);

  // --- Theme styles ---
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const inputStyle = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";
  const activeSectionBg = isDark ? "bg-[#13151f]" : "bg-slate-50";

  // Section CRUD triggers
  const handleSectionCreate = async () => {
    if (!newSectionTitle.trim()) return;
    await onCreateSection(newSectionTitle.trim());
    setNewSectionTitle("");
    setShowAddSectionInput(false);
  };

  const handleLessonCreate = async (sectionId: number) => {
    if (!newLessonTitle.trim()) return;
    await onCreateLesson(sectionId, newLessonTitle.trim(), newLessonType);
    setNewLessonTitle("");
    setAddingLessonSectionId(null);
  };

  const handleSaveSectionTitle = async (sectionId: number) => {
    if (!sectionTitleInput.trim()) return;
    await onEditSectionTitle(sectionId, sectionTitleInput.trim());
    setEditingSectionId(null);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, data: DraggedItemData) => {
    setDraggedItem(data);
    e.dataTransfer.effectAllowed = "move";
    // Set placeholder data
    e.dataTransfer.setData("text/plain", JSON.stringify(data));
  };

  const handleDragOver = (e: React.DragEvent, target: DropTargetData) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Rule: cannot drag section over lesson or vice versa
    if (draggedItem.type !== target.type && target.type !== "section-empty-drop") {
      return;
    }

    setDragOverItem(target);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, target: DropTargetData) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Prevent dropping onto itself
    if (draggedItem.type === "section" && target.type === "section" && draggedItem.sectionId === target.sectionId) {
      return;
    }
    if (draggedItem.type === "lesson" && target.type === "lesson" && draggedItem.lessonId === target.lessonId) {
      return;
    }

    onDragDropReorder(draggedItem, target);
    handleDragEnd();
  };

  return (
    <aside className={`w-80 border-r ${divider} overflow-y-auto p-4 flex flex-col gap-4 shrink-0`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-xs font-black uppercase tracking-wider ${muted}`}>Chương học</h2>
        {showAddSectionInput ? (
          <button
            onClick={() => setShowAddSectionInput(false)}
            className="text-[11px] font-bold text-rose-500 hover:text-rose-400"
          >
            Hủy bỏ
          </button>
        ) : (
          <button
            onClick={() => setShowAddSectionInput(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:text-indigo-400"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm chương
          </button>
        )}
      </div>

      {showAddSectionInput && (
        <div className={`p-3 border rounded-xl space-y-2.5 ${card}`}>
          <input
            type="text"
            placeholder="Nhập tiêu đề chương mới..."
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            className={`w-full px-3 py-1.5 text-xs border rounded-lg outline-none ${inputStyle}`}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSectionCreate();
              if (e.key === "Escape") setShowAddSectionInput(false);
            }}
          />
          <button
            onClick={handleSectionCreate}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all"
          >
            Tạo chương học
          </button>
        </div>
      )}

      {loading && sections.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
          <span className={`text-xs ${muted}`}>Đang tải giáo trình...</span>
        </div>
      ) : error ? (
        <div className="text-center text-xs text-rose-500 py-6">{error}</div>
      ) : sections.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500">
          Chưa có chương học nào. Nhấp thêm chương để bắt đầu.
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sect, sIndex) => {
            const isDraggingSection = draggedItem?.type === "section" && draggedItem.sectionId === sect.id;
            const isDragOverSection = dragOverItem?.type === "section" && dragOverItem.sectionId === sect.id;

            return (
              <div
                key={sect.id}
                draggable
                onDragStart={(e) => handleDragStart(e, { type: "section", sectionId: sect.id, index: sIndex })}
                onDragOver={(e) => handleDragOver(e, { type: "section", sectionId: sect.id, index: sIndex })}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, { type: "section", sectionId: sect.id, index: sIndex })}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${card} ${
                  isDraggingSection ? "opacity-40 scale-95 border-dashed border-indigo-500" : ""
                } ${isDragOverSection ? "border-t-4 border-t-indigo-500 shadow-md" : ""}`}
              >
                {/* Section Header */}
                <div
                  className={`px-3.5 py-3 border-b flex items-center justify-between gap-2 ${divider} ${activeSectionBg}`}
                >
                  <div className="cursor-grab text-slate-400 dark:text-slate-600 hover:text-indigo-400 transition-colors shrink-0">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {editingSectionId === sect.id ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={sectionTitleInput}
                        onChange={(e) => setSectionTitleInput(e.target.value)}
                        className={`w-full px-2 py-1 text-xs border rounded-lg outline-none ${inputStyle}`}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveSectionTitle(sect.id);
                          if (e.key === "Escape") setEditingSectionId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveSectionTitle(sect.id)}
                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shrink-0"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingSectionId(null)}
                        className="p-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`text-xs font-extrabold truncate flex-1 ${text}`} title={sect.title}>
                        {sect.title}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => onMoveSection(sect.id, "up")}
                          disabled={sIndex === 0}
                          className="p-1 rounded text-[#7a87a1] hover:text-indigo-400 disabled:opacity-30 transition-colors"
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onMoveSection(sect.id, "down")}
                          disabled={sIndex === sections.length - 1}
                          className="p-1 rounded text-[#7a87a1] hover:text-indigo-400 disabled:opacity-30 transition-colors"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSectionId(sect.id);
                            setSectionTitleInput(sect.title);
                          }}
                          className="p-1 rounded text-[#7a87a1] hover:text-indigo-400 transition-colors"
                          title="Sửa tên"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSection(sect.id)}
                          className="p-1 rounded text-[#7a87a1] hover:text-rose-400 transition-colors"
                          title="Xóa chương"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Lessons list */}
                <div
                  onDragOver={(e) => {
                    // Allow dropping lesson into this section even if empty
                    if (sect.lessons.length === 0) {
                      handleDragOver(e, { type: "section-empty-drop", sectionId: sect.id });
                    }
                  }}
                  onDrop={(e) => {
                    if (sect.lessons.length === 0) {
                      handleDrop(e, { type: "section-empty-drop", sectionId: sect.id });
                    }
                  }}
                  className={`p-1.5 space-y-1 transition-all duration-200 ${
                    dragOverItem?.type === "section-empty-drop" && dragOverItem.sectionId === sect.id
                      ? "bg-indigo-500/10 min-h-[50px] border border-dashed border-indigo-400 rounded-xl m-1"
                      : ""
                  }`}
                >
                  {sect.lessons?.map((les, lIndex) => {
                    const isDraggingLesson = draggedItem?.type === "lesson" && draggedItem.lessonId === les.id;
                    const isDragOverLesson = dragOverItem?.type === "lesson" && dragOverItem.lessonId === les.id;

                    return (
                      <div
                        key={les.id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, {
                            type: "lesson",
                            lessonId: les.id,
                            sectionId: sect.id,
                            index: lIndex,
                          })
                        }
                        onDragOver={(e) =>
                          handleDragOver(e, {
                            type: "lesson",
                            lessonId: les.id,
                            sectionId: sect.id,
                            index: lIndex,
                          })
                        }
                        onDragEnd={handleDragEnd}
                        onDrop={(e) =>
                          handleDrop(e, {
                            type: "lesson",
                            lessonId: les.id,
                            sectionId: sect.id,
                            index: lIndex,
                          })
                        }
                        onClick={() => onSelectLesson(les.id)}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer border transition-all duration-200 ${
                          selectedLessonId === les.id
                            ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-400 font-bold"
                            : `border-transparent hover:bg-slate-100 ${
                                isDark ? "hover:bg-[#22263a] text-[#a0aec0]" : "text-slate-700"
                              }`
                        } ${isDraggingLesson ? "opacity-35 scale-95 border-dashed border-indigo-400" : ""} ${
                          isDragOverLesson ? "border-t-indigo-500 border-t-2" : ""
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div className="cursor-grab text-slate-400 dark:text-slate-600 hover:text-indigo-400 transition-colors py-0.5 shrink-0 opacity-0 group-hover:opacity-100">
                            <GripVertical className="w-3 h-3" />
                          </div>
                          {les.contentType === "video" ? (
                            <Video className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                          ) : les.contentType === "quiz" ? (
                            <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          )}
                          <span className="text-[11px] truncate leading-tight">{les.title}</span>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveLesson(sect.id, les.id, "up");
                            }}
                            disabled={lIndex === 0}
                            className="p-0.5 hover:text-indigo-400 disabled:opacity-30"
                            title="Di chuyển lên"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveLesson(sect.id, les.id, "down");
                            }}
                            disabled={lIndex === (sect.lessons?.length || 0) - 1}
                            className="p-0.5 hover:text-indigo-400 disabled:opacity-30"
                            title="Di chuyển xuống"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLesson(les.id);
                            }}
                            className="p-0.5 hover:text-rose-500"
                            title="Xóa bài học"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Inline Lesson Creation Form */}
                  {addingLessonSectionId === sect.id ? (
                    <div
                      className={`mt-2 p-2 border border-dashed rounded-xl space-y-2 ${
                        isDark ? "border-[#252840]" : "border-slate-300"
                      }`}
                    >
                      <p className={`text-[9px] font-bold ${muted}`}>
                        Tạo bài: <span className="text-indigo-400 uppercase">{newLessonType}</span>
                      </p>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Tên bài học mới..."
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          className={`flex-1 px-2 py-1 text-xs border rounded-lg outline-none ${inputStyle}`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleLessonCreate(sect.id);
                            if (e.key === "Escape") setAddingLessonSectionId(null);
                          }}
                        />
                        <button
                          onClick={() => handleLessonCreate(sect.id)}
                          className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setAddingLessonSectionId(null)}
                          className="p-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Add Lesson Action Buttons */
                    <div className={`mt-2 border-t pt-2 ${divider} flex items-center justify-around gap-1`}>
                      {[
                        { type: "video", label: "+ Video", color: "text-indigo-400" },
                        { type: "document", label: "+ Doc", color: "text-emerald-400" },
                        { type: "quiz", label: "+ Quiz", color: "text-amber-400" },
                      ].map((btn) => (
                        <button
                          key={btn.type}
                          onClick={() => {
                            setAddingLessonSectionId(sect.id);
                            setNewLessonType(btn.type as any);
                            setNewLessonTitle("");
                          }}
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded hover:bg-slate-100 ${
                            isDark ? "hover:bg-[#1a1d2e]" : "hover:bg-slate-100"
                          } ${btn.color}`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
