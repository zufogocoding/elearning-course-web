"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ui/ThemeProvider";
import AdminLayout from "@/components/layout/AdminLayout";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

// Shared types
import { Option, Question, Quiz, Lesson, Section } from "./types";

// Sub-components
import SaveStatus, { SaveState } from "./components/SaveStatus";
import CurriculumSidebar, { DraggedItemData, DropTargetData } from "./components/CurriculumSidebar";
import LessonEditor from "./components/LessonEditor";
import QuizEditor from "./components/QuizEditor";

export default function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.id, 10);

  const { isDark } = useTheme();
  const router = useRouter();

  // --- States ---
  const [courseTitle, setCourseTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("");
  const [editorTab, setEditorTab] = useState<"content" | "quiz">("content");

  useEffect(() => {
    setEditorTab("content");
  }, [selectedLessonId]);

  // --- Data Loading ---
  const fetchCurriculum = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/content/courses/${courseId}/curriculum`);
      if (!res.ok) {
        setError("Không thể tải giáo trình của khóa học.");
        return;
      }
      const data = await res.json();
      setSections(data.data || []);
      setCourseTitle(data.courseTitle || "Khóa học");
      setError("");
    } catch {
      setError("Lỗi kết nối mạng.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

  // Find active selected lesson
  const currentLesson = sections
    .flatMap((s) => s.lessons)
    .find((l) => l.id === selectedLessonId);

  // --- Section CRUD callbacks ---
  const handleCreateSection = async (title: string) => {
    try {
      setLoading(true);
      const res = await api.post("/api/content/sections", {
        courseId,
        title,
        orderIndex: sections.length + 1,
      });
      if (res.ok) {
        fetchCurriculum();
      }
    } catch {
      alert("Lỗi kết nối.");
      setLoading(false);
    }
  };

  const handleEditSectionTitle = async (id: number, title: string) => {
    try {
      const res = await api.put(`/api/content/sections/${id}`, { title });
      if (res.ok) {
        fetchCurriculum();
      }
    } catch {
      alert("Lỗi kết nối.");
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chương này? Tất cả bài học bên trong cũng sẽ bị ẩn.")) return;
    try {
      const res = await api.delete(`/api/content/sections/${id}`);
      if (res.ok) fetchCurriculum();
    } catch {
      alert("Lỗi kết nối.");
    }
  };

  // --- Lesson CRUD callbacks ---
  const handleCreateLesson = async (
    sectionId: number,
    title: string,
    contentType: "video" | "document" | "quiz"
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    const orderIndex = (section?.lessons?.length || 0) + 1;

    try {
      setLoading(true);
      const res = await api.post("/api/content/lessons", {
        sectionId,
        title,
        contentType,
        contentUrl: contentType === "video" ? "https://" : "",
        durationSeconds: contentType === "video" ? 600 : 0,
        isPreview: false,
        orderIndex,
      });
      if (res.ok) {
        const result = await res.json();
        await fetchCurriculum();
        setSelectedLessonId(result.lesson.id);
      }
    } catch {
      alert("Lỗi kết nối.");
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
    try {
      const res = await api.delete(`/api/content/lessons/${id}`);
      if (res.ok) {
        if (selectedLessonId === id) setSelectedLessonId(null);
        fetchCurriculum();
      }
    } catch {
      alert("Lỗi kết nối.");
    }
  };

  // --- Move Items (Chevron Buttons) ---
  const handleMoveSection = async (sectionId: number, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...sections];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    const reindexed = updated.map((s, i) => ({ ...s, orderIndex: i + 1 }));
    setSections(reindexed);
    setSaveState("saving");

    try {
      await api.post("/api/content/sections/reorder", {
        sections: reindexed.map((s) => ({ id: s.id, orderIndex: s.orderIndex })),
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
      fetchCurriculum();
    }
  };

  const handleMoveLesson = async (sectionId: number, lessonId: number, direction: "up" | "down") => {
    const sIdx = sections.findIndex((s) => s.id === sectionId);
    if (sIdx === -1) return;
    const sect = sections[sIdx];
    const lessons = [...sect.lessons];
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === lessons.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const temp = lessons[idx];
    lessons[idx] = lessons[targetIdx];
    lessons[targetIdx] = temp;

    const reindexed = lessons.map((l, i) => ({ ...l, orderIndex: i + 1 }));
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, lessons: reindexed } : s
    );

    setSections(updatedSections);
    setSaveState("saving");

    try {
      await api.post("/api/content/lessons/reorder", {
        lessons: reindexed.map((l) => ({ id: l.id, orderIndex: l.orderIndex })),
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
      fetchCurriculum();
    }
  };

  // --- Native HTML5 Drag and Drop Sorting & Cross-section moving (Optimistic UI) ---
  const handleDragDropReorder = async (dragged: DraggedItemData, target: DropTargetData) => {
    const originalSections = [...sections];

    // Case 1: Reordering sections
    if (dragged.type === "section" && target.type === "section") {
      const draggedIdx = dragged.index;
      const targetIdx = target.index;
      if (draggedIdx === targetIdx) return;

      const updated = [...sections];
      const [removed] = updated.splice(draggedIdx, 1);
      updated.splice(targetIdx, 0, removed);

      const reindexed = updated.map((s, i) => ({ ...s, orderIndex: i + 1 }));
      setSections(reindexed);
      setSaveState("saving");

      try {
        await api.post("/api/content/sections/reorder", {
          sections: reindexed.map((s) => ({ id: s.id, orderIndex: s.orderIndex })),
        });
        setSaveState("saved");
      } catch {
        setSaveState("error");
        setSections(originalSections);
      }
    }

    // Case 2: Reordering/Moving lessons
    if (dragged.type === "lesson") {
      const srcSecIdx = sections.findIndex((s) => s.id === dragged.sectionId);
      if (srcSecIdx === -1) return;

      // Drop on an empty section (moving lesson there)
      if (target.type === "section-empty-drop") {
        const destSecIdx = sections.findIndex((s) => s.id === target.sectionId);
        if (destSecIdx === -1) return;

        const srcSection = sections[srcSecIdx];
        const destSection = sections[destSecIdx];
        const draggedLesson = srcSection.lessons[dragged.index];
        if (!draggedLesson) return;

        const reindexedSrc = srcSection.lessons
          .filter((l) => l.id !== draggedLesson.id)
          .map((l, i) => ({ ...l, orderIndex: i + 1 }));

        const updatedSections = sections.map((s) => {
          if (s.id === srcSection.id) {
            return {
              ...s,
              lessons: reindexedSrc,
            };
          }
          if (s.id === destSection.id) {
            return {
              ...s,
              lessons: [{ ...draggedLesson, sectionId: destSection.id, orderIndex: 1 }],
            };
          }
          return s;
        });

        setSections(updatedSections);
        setSaveState("saving");

        try {
          // Reorder lessons in both sections in a single background POST call
          await api.post("/api/content/lessons/reorder", {
            lessons: [
              { id: draggedLesson.id, sectionId: destSection.id, orderIndex: 1 },
              ...reindexedSrc.map((l) => ({ id: l.id, orderIndex: l.orderIndex })),
            ],
          });
          setSaveState("saved");
        } catch {
          setSaveState("error");
          setSections(originalSections);
        }
        return;
      }

      // Drop on another lesson
      if (target.type === "lesson") {
        const destSecIdx = sections.findIndex((s) => s.id === target.sectionId);
        if (destSecIdx === -1) return;

        const srcSection = sections[srcSecIdx];
        const destSection = sections[destSecIdx];
        const draggedLesson = srcSection.lessons[dragged.index];
        if (!draggedLesson) return;

        let updatedSections = [...sections];

        if (srcSection.id === destSection.id) {
          // Reorder in same section
          const lessons = [...srcSection.lessons];
          const [removed] = lessons.splice(dragged.index, 1);
          lessons.splice(target.index, 0, removed);

          const reindexed = lessons.map((l, i) => ({ ...l, orderIndex: i + 1 }));
          updatedSections = sections.map((s) =>
            s.id === srcSection.id ? { ...s, lessons: reindexed } : s
          );
          setSections(updatedSections);
          setSaveState("saving");

          try {
            await api.post("/api/content/lessons/reorder", {
              lessons: reindexed.map((l) => ({ id: l.id, orderIndex: l.orderIndex })),
            });
            setSaveState("saved");
          } catch {
            setSaveState("error");
            setSections(originalSections);
          }
        } else {
          // Move lesson to different section
          const srcLessons = srcSection.lessons.filter((l) => l.id !== draggedLesson.id);
          const destLessons = [...destSection.lessons];
          destLessons.splice(target.index, 0, { ...draggedLesson, sectionId: destSection.id });

          const reindexedSrc = srcLessons.map((l, i) => ({ ...l, orderIndex: i + 1 }));
          const reindexedDest = destLessons.map((l, i) => ({ ...l, orderIndex: i + 1 }));

          updatedSections = sections.map((s) => {
            if (s.id === srcSection.id) return { ...s, lessons: reindexedSrc };
            if (s.id === destSection.id) return { ...s, lessons: reindexedDest };
            return s;
          });

          setSections(updatedSections);
          setSaveState("saving");

          try {
            // Update the moved lesson's sectionId and orderIndex, and update indices in both sections in 1 transaction
            await api.post("/api/content/lessons/reorder", {
              lessons: [
                { id: draggedLesson.id, sectionId: destSection.id, orderIndex: target.index + 1 },
                ...reindexedSrc.map((l) => ({ id: l.id, orderIndex: l.orderIndex })),
                ...reindexedDest
                  .filter((l) => l.id !== draggedLesson.id)
                  .map((l) => ({ id: l.id, orderIndex: l.orderIndex })),
              ],
            });
            setSaveState("saved");
          } catch {
            setSaveState("error");
            setSections(originalSections);
          }
        }
      }
    }
  };

  // --- Design tokens ---
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <header className={`border-b ${divider} px-6 py-4 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/courses")}
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? "bg-[#22263a] border-[#252840] hover:text-white"
                  : "bg-slate-100 border-slate-200 hover:text-slate-900"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className={`text-base font-bold ${text}`}>Biên soạn giáo trình</h1>
              <p className={`text-xs mt-0.5 ${muted}`}>{courseTitle || "Đang tải..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SaveStatus status={saveState} />
          </div>
        </header>

        {/* Content Pane */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Outline Sidebar */}
          <CurriculumSidebar
            sections={sections}
            selectedLessonId={selectedLessonId}
            onSelectLesson={setSelectedLessonId}
            isDark={isDark}
            loading={loading}
            error={error}
            onCreateSection={handleCreateSection}
            onEditSectionTitle={handleEditSectionTitle}
            onDeleteSection={handleDeleteSection}
            onCreateLesson={handleCreateLesson}
            onDeleteLesson={handleDeleteLesson}
            onMoveSection={handleMoveSection}
            onMoveLesson={handleMoveLesson}
            onDragDropReorder={handleDragDropReorder}
          />

          {/* Form Editor Column */}
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f111a]/20">
            {loading && sections.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <span className={`text-xs ${muted}`}>Đang tải giáo trình...</span>
              </div>
            ) : !selectedLessonId || !currentLesson ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <BookOpen className="w-12 h-12 text-slate-600 mb-2 opacity-30" />
                <p className={`text-xs ${muted} max-w-xs`}>
                  Chọn bài học từ cây mục lục bên trái để bắt đầu chỉnh sửa nội dung hoặc câu hỏi kiểm tra.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Custom Tabs */}
                <div className="flex border-b border-slate-200 dark:border-[#252840] gap-4 mb-4">
                  <button
                    onClick={() => setEditorTab("content")}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all -mb-px ${
                      editorTab === "content"
                        ? "border-indigo-500 text-indigo-500 dark:text-indigo-400"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-[#7a87a1] dark:hover:text-[#e2e8f0]"
                    }`}
                  >
                    Nội dung bài học
                  </button>
                  <button
                    onClick={() => setEditorTab("quiz")}
                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all -mb-px ${
                      editorTab === "quiz"
                        ? "border-indigo-500 text-indigo-500 dark:text-indigo-400"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-[#7a87a1] dark:hover:text-[#e2e8f0]"
                    }`}
                  >
                    Bài trắc nghiệm (Quiz) {currentLesson.quiz ? "(Đang bật)" : ""}
                  </button>
                </div>

                {editorTab === "content" ? (
                  <div className="max-w-2xl">
                    <LessonEditor
                      key={currentLesson.id}
                      lesson={currentLesson}
                      isDark={isDark}
                      onSaveSuccess={fetchCurriculum}
                      setSaveState={setSaveState}
                    />
                  </div>
                ) : (
                  <QuizEditor
                    key={currentLesson.id}
                    lessonId={currentLesson.id}
                    initialQuiz={currentLesson.quiz}
                    isDark={isDark}
                    onSaveSuccess={fetchCurriculum}
                    setSaveState={setSaveState}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </AdminLayout>
  );
}
