"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useTheme } from "@/components/ui/ThemeProvider";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  BookOpen, ChevronLeft, Plus, Edit2, Trash2, Video, FileText,
  HelpCircle, Check, X, AlertCircle, Save, Loader2,
  ChevronDown, ChevronUp, CheckCircle, Circle, ArrowLeft
} from "lucide-react";

interface Option {
  id?: number;
  optionText: string;
  isCorrect: boolean;
}

interface Question {
  id?: number;
  questionText: string;
  questionType: string;
  options: Option[];
}

interface Quiz {
  id?: number;
  title: string;
  description: string;
  passingScore: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  questions: Question[];
}

interface Lesson {
  id: number;
  title: string;
  contentType: "video" | "document" | "quiz";
  contentUrl: string | null;
  durationSeconds: number;
  isPreview: boolean;
  orderIndex: number;
  quiz?: Quiz | null;
}

interface Section {
  id: number;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export default function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.id);

  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // --- States ---
  const [courseTitle, setCourseTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Selection
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [sectionTitleInput, setSectionTitleInput] = useState("");

  // Edit Forms
  const [lessonForm, setLessonForm] = useState({
    title: "",
    contentType: "video" as "video" | "document" | "quiz",
    contentUrl: "",
    durationSeconds: 0,
    isPreview: false,
  });

  // Quiz Editor Form
  const [quizForm, setQuizForm] = useState<Quiz>({
    title: "",
    description: "",
    passingScore: 80,
    timeLimitMinutes: null,
    maxAttempts: 3,
    questions: [],
  });

  const [savingLesson, setSavingLesson] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [builderStatus, setBuilderStatus] = useState("");

  // Inline Creation states
  const [showAddSectionInput, setShowAddSectionInput] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingLessonSectionId, setAddingLessonSectionId] = useState<number | null>(null);
  const [newLessonType, setNewLessonType] = useState<"video" | "document" | "quiz">("video");
  const [newLessonTitle, setNewLessonTitle] = useState("");

  // --- Theme ---
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const inputStyle = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";
  const activeSectionBg = isDark ? "bg-[#13151f]" : "bg-slate-50";

  // --- Data Loading ---
  const fetchCurriculum = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch Course title first
      const courseRes = await api.get(`/api/courses`);
      if (courseRes.ok) {
        const coursesList = await courseRes.json();
        const current = coursesList.find((c: any) => c.id === courseId);
        if (current) setCourseTitle(current.title);
      }

      // Fetch Sections and Lessons
      const res = await api.get(`/api/content/courses/${courseId}/curriculum`);
      if (!res.ok) {
        setError("Không thể tải giáo trình của khóa học.");
        return;
      }
      const data = await res.json();
      setSections(data.data || []);
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

  // --- Find Selected Lesson ---
  const currentLesson = sections
    .flatMap((s) => s.lessons)
    .find((l) => l.id === selectedLessonId);

  // Sync Lesson fields to form states when selection changes
  useEffect(() => {
    if (currentLesson) {
      setLessonForm({
        title: currentLesson.title,
        contentType: currentLesson.contentType,
        contentUrl: currentLesson.contentUrl || "",
        durationSeconds: currentLesson.durationSeconds,
        isPreview: currentLesson.isPreview,
      });

      if (currentLesson.contentType === "quiz" || currentLesson.quiz) {
        const q = currentLesson.quiz;
        setQuizForm({
          id: q?.id,
          title: q?.title || "Bài Quiz Kiểm Tra",
          description: q?.description || "",
          passingScore: q?.passingScore || 80,
          timeLimitMinutes: q?.timeLimitMinutes || null,
          maxAttempts: q?.maxAttempts || 3,
          questions: q?.questions?.map((ques: any) => ({
            id: ques.id,
            questionText: ques.questionText,
            questionType: ques.questionType || "single_choice",
            options: ques.questionOptions?.map((o: any) => ({
              id: o.id,
              optionText: o.optionText,
              isCorrect: o.isCorrect,
            })) || [],
          })) || [],
        });
      }
    }
  }, [selectedLessonId, sections]);

  // --- Sections Management ---
  // Inline Section Submission
  const handleCreateSectionSubmit = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      setLoading(true);
      const res = await api.post("/api/content/sections", {
        courseId,
        title: newSectionTitle.trim(),
        orderIndex: sections.length + 1,
      });
      if (res.ok) {
        setNewSectionTitle("");
        setShowAddSectionInput(false);
        fetchCurriculum();
      }
    } catch {
      alert("Lỗi kết nối.");
      setLoading(false);
    }
  };

  // Inline Lesson Submission
  const handleCreateLessonSubmit = async (sectionId: number) => {
    if (!newLessonTitle.trim()) return;
    const section = sections.find((s) => s.id === sectionId);
    const orderIndex = (section?.lessons?.length || 0) + 1;

    try {
      setLoading(true);
      const res = await api.post("/api/content/lessons", {
        sectionId,
        title: newLessonTitle.trim(),
        contentType: newLessonType,
        contentUrl: newLessonType === "quiz" ? "" : "https://",
        durationSeconds: newLessonType === "video" ? 600 : 0,
        isPreview: false,
        orderIndex,
      });
      if (res.ok) {
        const result = await res.json();
        setNewLessonTitle("");
        setAddingLessonSectionId(null);
        fetchCurriculum();
        setSelectedLessonId(result.lesson.id);
      }
    } catch {
      alert("Lỗi kết nối.");
      setLoading(false);
    }
  };

  // Reordering functions
  const handleMoveSection = async (sectionId: number, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const sectA = sections[idx];
    const sectB = sections[targetIdx];

    try {
      setLoading(true);
      await Promise.all([
        api.put(`/api/content/sections/${sectA.id}`, { orderIndex: sectB.orderIndex }),
        api.put(`/api/content/sections/${sectB.id}`, { orderIndex: sectA.orderIndex }),
      ]);
      fetchCurriculum();
    } catch {
      alert("Lỗi di chuyển chương học.");
      setLoading(false);
    }
  };

  const handleMoveLesson = async (sectionId: number, lessonId: number, direction: "up" | "down") => {
    const sect = sections.find((s) => s.id === sectionId);
    if (!sect || !sect.lessons) return;
    const lessons = sect.lessons;
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === lessons.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const lesA = lessons[idx];
    const lesB = lessons[targetIdx];

    try {
      setLoading(true);
      await Promise.all([
        api.put(`/api/content/lessons/${lesA.id}`, { orderIndex: lesB.orderIndex }),
        api.put(`/api/content/lessons/${lesB.id}`, { orderIndex: lesA.orderIndex }),
      ]);
      fetchCurriculum();
    } catch {
      alert("Lỗi di chuyển bài học.");
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
    try {
      const res = await api.delete(`/api/content/lessons/${lessonId}`);
      if (res.ok) {
        if (selectedLessonId === lessonId) setSelectedLessonId(null);
        fetchCurriculum();
      }
    } catch {
      alert("Lỗi kết nối.");
    }
  };

  const handleEditSection = async (section: Section) => {
    setEditingSectionId(section.id);
    setSectionTitleInput(section.title);
  };

  const handleSaveSectionTitle = async (sectionId: number) => {
    if (!sectionTitleInput.trim()) return;
    try {
      const res = await api.put(`/api/content/sections/${sectionId}`, {
        title: sectionTitleInput.trim(),
      });
      if (res.ok) {
        setEditingSectionId(null);
        fetchCurriculum();
      }
    } catch {
      alert("Lỗi kết nối.");
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chương này? Tất cả bài học bên trong cũng sẽ bị ẩn.")) return;
    try {
      const res = await api.delete(`/api/content/sections/${sectionId}`);
      if (res.ok) fetchCurriculum();
    } catch {
      alert("Lỗi kết nối.");
    }
  };

  const handleSaveLessonMetadata = async () => {
    if (!selectedLessonId) return;
    setSavingLesson(true);
    setBuilderStatus("");
    try {
      const res = await api.put(`/api/content/lessons/${selectedLessonId}`, {
        title: lessonForm.title,
        contentUrl: lessonForm.contentUrl,
        durationSeconds: parseInt(String(lessonForm.durationSeconds)) || 0,
        isPreview: lessonForm.isPreview,
      });
      if (res.ok) {
        setBuilderStatus("Lưu thông tin bài học thành công!");
        fetchCurriculum();
      } else {
        const data = await res.json();
        alert(data.error || "Không thể cập nhật.");
      }
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setSavingLesson(false);
    }
  };

  // --- Quiz Builder Actions ---
  const handleAddQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: "Nội dung câu hỏi trắc nghiệm mới",
          questionType: "single_choice",
          options: [
            { optionText: "Lựa chọn A", isCorrect: true },
            { optionText: "Lựa chọn B", isCorrect: false },
          ],
        },
      ],
    }));
  };

  const handleRemoveQuestion = (qIdx: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIdx),
    }));
  };

  const handleQuestionTextChange = (qIdx: number, textVal: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIdx ? { ...q, questionText: textVal } : q
      ),
    }));
  };

  const handleAddOption = (qIdx: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        return {
          ...q,
          options: [...q.options, { optionText: "Lựa chọn mới", isCorrect: false }],
        };
      }),
    }));
  };

  const handleRemoveOption = (qIdx: number, oIdx: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        return {
          ...q,
          options: q.options.filter((_, oIndex) => oIndex !== oIdx),
        };
      }),
    }));
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, textVal: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        return {
          ...q,
          options: q.options.map((opt, oIndex) =>
            oIndex === oIdx ? { ...opt, optionText: textVal } : opt
          ),
        };
      }),
    }));
  };

  const handleQuestionTypeChange = (qIdx: number, typeVal: string) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        let newOptions = [...q.options];
        if (typeVal === "true_false") {
          newOptions = [
            { optionText: "Đúng", isCorrect: true },
            { optionText: "Sai", isCorrect: false },
          ];
        } else if (q.questionType === "true_false" && typeVal !== "true_false") {
          newOptions = [
            { optionText: "Lựa chọn A", isCorrect: true },
            { optionText: "Lựa chọn B", isCorrect: false },
          ];
        }
        return { ...q, questionType: typeVal, options: newOptions };
      }),
    }));
  };

  const handleSetCorrectOption = (qIdx: number, oIdx: number) => {
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        const isMultiple = q.questionType === "multiple_choice";
        return {
          ...q,
          options: q.options.map((opt, oIndex) => {
            if (oIndex === oIdx) {
              return { ...opt, isCorrect: isMultiple ? !opt.isCorrect : true };
            }
            return isMultiple ? opt : { ...opt, isCorrect: false };
          }),
        };
      }),
    }));
  };

  const handleSaveQuiz = async () => {
    if (!selectedLessonId) return;
    setSavingQuiz(true);
    setBuilderStatus("");
    try {
      const res = await api.post(`/api/content/lessons/${selectedLessonId}/quiz`, quizForm);
      if (res.ok) {
        setBuilderStatus("Lưu bài Quiz thành công!");
        fetchCurriculum();
      } else {
        const data = await res.json();
        alert(data.error || "Không thể lưu quiz.");
      }
    } catch {
      alert("Lỗi kết nối.");
    } finally {
      setSavingQuiz(false);
    }
  };

  // --- Auth Guards ---
  // Auth guard is handled centrally by AdminLayout

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        
        {/* Header */}
        <header className={`border-b ${divider} px-6 py-4 flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/courses")}
              className={`p-2 rounded-xl border transition-all ${
                isDark ? "bg-[#22263a] border-[#252840] hover:text-white" : "bg-slate-100 border-slate-200 hover:text-slate-900"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className={`text-base font-bold ${text}`}>Biên soạn giáo trình</h1>
              <p className={`text-xs mt-0.5 ${muted}`}>{courseTitle || "Khóa học"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {builderStatus && (
              <span className="text-xs text-emerald-500 font-semibold animate-pulse">{builderStatus}</span>
            )}
          </div>
        </header>

        {/* Content Pane */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Outline Sidebar */}
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
                    if (e.key === "Enter") handleCreateSectionSubmit();
                    if (e.key === "Escape") setShowAddSectionInput(false);
                  }}
                />
                <button
                  onClick={handleCreateSectionSubmit}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all"
                >
                  Tạo chương học
                </button>
              </div>
            )}

            {loading ? (
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
                {sections.map((sect, sIndex) => (
                  <div key={sect.id} className={`border rounded-2xl overflow-hidden ${card}`}>
                    
                    {/* Section Header */}
                    <div className={`px-3.5 py-3 border-b flex items-center justify-between gap-2 ${divider} ${activeSectionBg}`}>
                      {editingSectionId === sect.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={sectionTitleInput}
                            onChange={(e) => setSectionTitleInput(e.target.value)}
                            className={`w-full px-2 py-1 text-xs border rounded-lg outline-none ${inputStyle}`}
                          />
                          <button
                            onClick={() => handleSaveSectionTitle(sect.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingSectionId(null)}
                            className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className={`text-xs font-bold truncate flex-1 ${text}`} title={sect.title}>
                            {sect.title}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => handleMoveSection(sect.id, "up")}
                              disabled={sIndex === 0}
                              className="p-1 rounded text-[#7a87a1] hover:text-indigo-400 disabled:opacity-30 transition-colors"
                              title="Di chuyển lên"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveSection(sect.id, "down")}
                              disabled={sIndex === sections.length - 1}
                              className="p-1 rounded text-[#7a87a1] hover:text-indigo-400 disabled:opacity-30 transition-colors"
                              title="Di chuyển xuống"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditSection(sect)}
                              className={`p-1 rounded text-[#7a87a1] hover:text-indigo-400 transition-colors`}
                              title="Sửa tên"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sect.id)}
                              className={`p-1 rounded text-[#7a87a1] hover:text-rose-400 transition-colors`}
                              title="Xóa chương"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Lessons list */}
                    <div className="p-1.5 space-y-1">
                      {sect.lessons?.map((les, lIndex) => (
                        <div
                          key={les.id}
                          onClick={() => setSelectedLessonId(les.id)}
                          className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                            selectedLessonId === les.id
                              ? "bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-bold"
                              : `border border-transparent hover:bg-slate-100 ${isDark ? "hover:bg-[#22263a] text-[#a0aec0]" : "text-slate-700"}`
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
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
                                handleMoveLesson(sect.id, les.id, "up");
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
                                handleMoveLesson(sect.id, les.id, "down");
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
                                handleDeleteLesson(les.id);
                              }}
                              className="p-0.5 hover:text-rose-500"
                              title="Xóa bài học"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Inline Lesson Creation Form */}
                      {addingLessonSectionId === sect.id ? (
                        <div className={`mt-2 p-2 border border-dashed rounded-xl space-y-2 ${isDark ? "border-[#252840]" : "border-slate-300"}`}>
                          <p className={`text-[9px] font-bold ${muted}`}>Tạo bài: <span className="text-indigo-400 uppercase">{newLessonType}</span></p>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Tên bài học mới..."
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              className={`flex-1 px-2 py-1 text-xs border rounded-lg outline-none ${inputStyle}`}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateLessonSubmit(sect.id);
                                if (e.key === "Escape") setAddingLessonSectionId(null);
                              }}
                            />
                            <button
                              onClick={() => handleCreateLessonSubmit(sect.id)}
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
                ))}
              </div>
            )}
          </aside>

          {/* Form Editor Column */}
          <main className="flex-1 overflow-y-auto p-6">
            {!selectedLessonId ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <BookOpen className="w-12 h-12 text-slate-600 mb-2 opacity-30" />
                <p className={`text-xs ${muted} max-w-xs`}>
                  Chọn bài học từ cây mục lục bên trái để bắt đầu chỉnh sửa nội dung hoặc câu hỏi kiểm tra.
                </p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                
                {/* Lesson General Info */}
                <div className={`border rounded-2xl p-5 ${card}`}>
                  <h2 className={`text-sm font-bold mb-4 ${text}`}>Thông tin bài học</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Tên bài học</label>
                      <input
                        type="text"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                        className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle}`}
                      />
                    </div>

                    {lessonForm.contentType === "video" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Đường dẫn Video (YouTube)</label>
                          <input
                            type="text"
                            value={lessonForm.contentUrl}
                            onChange={(e) => setLessonForm((p) => ({ ...p, contentUrl: e.target.value }))}
                            className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle}`}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                        <div>
                          <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Thời lượng (giây)</label>
                          <input
                            type="number"
                            value={lessonForm.durationSeconds}
                            onChange={(e) => setLessonForm((p) => ({ ...p, durationSeconds: parseInt(e.target.value) || 0 }))}
                            className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle}`}
                          />
                        </div>
                      </div>
                    )}

                    {lessonForm.contentType === "document" && (
                      <div>
                        <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Nội dung bài viết (Markdown/Text)</label>
                        <textarea
                          rows={6}
                          value={lessonForm.contentUrl}
                          onChange={(e) => setLessonForm((p) => ({ ...p, contentUrl: e.target.value }))}
                          className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 text-xs resize-none ${inputStyle}`}
                          placeholder="Viết nội dung tài liệu học tập ở đây..."
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                        <input
                          type="checkbox"
                          checked={lessonForm.isPreview}
                          onChange={(e) => setLessonForm((p) => ({ ...p, isPreview: e.target.checked }))}
                          className="accent-indigo-600 rounded cursor-pointer"
                        />
                        <span className={text}>Cho phép học thử miễn phí (Preview)</span>
                      </label>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveLessonMetadata}
                        disabled={savingLesson}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                      >
                        {savingLesson ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Lưu thông tin bài học
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quiz Builder Pane */}
                {lessonForm.contentType === "quiz" && (
                  <div className={`border rounded-2xl p-5 ${card} space-y-5`}>
                    <div className="flex items-center justify-between border-b pb-3 border-[#252840]">
                      <h2 className={`text-sm font-bold ${text}`}>Bộ câu hỏi trắc nghiệm (Quiz Builder)</h2>
                      <button
                        onClick={handleSaveQuiz}
                        disabled={savingQuiz}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-sm"
                      >
                        {savingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" /> : <Save className="w-3.5 h-3.5" />}
                        Lưu bài Quiz
                      </button>
                    </div>

                    {/* Quiz Settings */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${muted}`}>Điểm đạt (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={quizForm.passingScore}
                          onChange={(e) => setQuizForm((p) => ({ ...p, passingScore: parseInt(e.target.value) || 80 }))}
                          className={`w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${muted}`}>Thời gian (phút)</label>
                        <input
                          type="number"
                          placeholder="Không giới hạn"
                          value={quizForm.timeLimitMinutes || ""}
                          onChange={(e) => setQuizForm((p) => ({ ...p, timeLimitMinutes: e.target.value ? parseInt(e.target.value) : null }))}
                          className={`w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${muted}`}>Lượt thử tối đa</label>
                        <input
                          type="number"
                          placeholder="Không giới hạn"
                          value={quizForm.maxAttempts}
                          onChange={(e) => setQuizForm((p) => ({ ...p, maxAttempts: parseInt(e.target.value) || 0 }))}
                          className={`w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle}`}
                        />
                      </div>
                    </div>

                    {/* Questions management */}
                    <div className="space-y-5 pt-3">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-xs font-bold ${text}`}>Danh sách câu hỏi ({quizForm.questions.length})</h3>
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="flex items-center gap-1 px-3 py-1.5 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 text-xs font-bold rounded-xl transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
                        </button>
                      </div>

                      {quizForm.questions.length === 0 ? (
                        <p className={`text-xs text-center py-6 italic ${muted}`}>Chưa có câu hỏi nào. Nhấp Thêm câu hỏi để tạo câu hỏi đầu tiên.</p>
                      ) : (
                        <div className="space-y-4">
                          {quizForm.questions.map((q, qIdx) => (
                            <div key={qIdx} className={`border rounded-2xl p-4 space-y-3 ${isDark ? "bg-[#13151f]/50 border-[#1e2235]" : "bg-slate-50 border-slate-200"}`}>
                              <div className="flex items-center justify-between gap-3">
                                <span className={`text-xs font-black ${text}`}>Câu hỏi {qIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuestion(qIdx)}
                                  className="text-[#7a87a1] hover:text-rose-500 p-1 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <input
                                type="text"
                                value={q.questionText}
                                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                                className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle}`}
                                placeholder="Nhập nội dung câu hỏi..."
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className={`block text-[9px] font-bold uppercase tracking-wider mb-1 ${muted}`}>Loại câu hỏi</label>
                                  <select
                                    value={q.questionType}
                                    onChange={(e) => handleQuestionTypeChange(qIdx, e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle}`}
                                  >
                                    <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                                    <option value="multiple_choice">Trắc nghiệm nhiều đáp án</option>
                                    <option value="true_false">Đúng / Sai</option>
                                  </select>
                                </div>
                              </div>

                              {/* Options List */}
                              <div className="space-y-2 pl-2">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Các lựa chọn đáp án</span>
                                  {q.questionType !== "true_false" && (
                                    <button
                                      type="button"
                                      onClick={() => handleAddOption(qIdx)}
                                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400"
                                    >
                                      + Thêm lựa chọn
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  {q.options?.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSetCorrectOption(qIdx, oIdx)}
                                        className={`p-1.5 rounded-lg border transition-all ${
                                          opt.isCorrect
                                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                            : "border-slate-500/30 text-slate-500 hover:text-slate-400"
                                        }`}
                                        title={opt.isCorrect ? "Đáp án đúng" : "Đánh dấu là đáp án đúng"}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                      
                                      <input
                                        type="text"
                                        value={opt.optionText}
                                        onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                                        readOnly={q.questionType === "true_false"}
                                        className={`flex-1 px-3 py-2 border rounded-xl outline-none focus:ring-2 text-xs ${inputStyle} ${
                                          q.questionType === "true_false" ? "opacity-75 cursor-not-allowed" : ""
                                        }`}
                                        placeholder="Nhập phương án..."
                                      />

                                      {q.questionType !== "true_false" && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveOption(qIdx, oIdx)}
                                          disabled={q.options.length <= 2}
                                          className="text-[#7a87a1] hover:text-rose-500 p-1.5 rounded disabled:opacity-30 disabled:hover:text-[#7a87a1]"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </main>

        </div>
      </div>
    </AdminLayout>
  );
}
