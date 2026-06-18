"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  PlayCircle, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Download, HelpCircle, Sun, Moon, X, FileText, BookOpen,
  Clock, Lock, Circle, PanelRightClose, PanelRightOpen, Star,
  AlertCircle, Trophy, ArrowRight, Award
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import confetti from "canvas-confetti";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const isValidUrl = (url: string) => {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
};

/* ── Types ── */
type LessonType = "video" | "quiz" | "document";
interface Lesson {
  id: number; title: string; duration: string;
  completed: boolean; locked: boolean; type: LessonType;
  isPreview?: boolean;
  quizId?: number;
}
interface Section { id: number; title: string; lessons: Lesson[]; expanded: boolean; }
interface Attachment { id: number; fileName: string; fileSize: number; fileType: string; fileUrl: string; }
interface ApiLesson { id: number; title: string; durationSeconds: number; isCompleted: boolean; isPreview: boolean; contentType: string; quizId?: number; }
interface ApiSection { id: number; title: string; lessons: ApiLesson[]; }
interface QuizOption { id: number; optionText: string; isCorrect?: boolean; }
interface QuizQuestion { id: number; questionText: string; explanation?: string | null; questionOptions?: QuizOption[]; options?: QuizOption[]; }


// ATTACHMENTS removed in favor of dynamic lesson attachments



/* ── Build theme helper – ALL indigo ── */
function buildTheme(dark: boolean) {
  return {
    root:         dark ? "bg-[#0d0f1a] text-[#e2e8f0]" : "bg-[#f4f6fb] text-slate-900",
    header:       dark ? "bg-[#13151f] border-[#1e2235]" : "bg-white border-slate-200",
    surface:      dark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200",
    surfaceAlt:   dark ? "bg-[#0f1117]/60" : "bg-slate-50/60",
    hover:        dark ? "hover:bg-[#22263a]" : "hover:bg-slate-50",
    border:       dark ? "border-[#1e2235]" : "border-slate-200",
    text:         dark ? "text-[#e2e8f0]" : "text-slate-900",
    muted:        dark ? "text-[#7a87a1]" : "text-slate-500",
    sidebar:      dark ? "bg-[#13151f] border-[#1e2235]" : "bg-white border-slate-200",
    input:        dark
      ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40",
    pill:         dark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700",
    pillQuiz:     dark ? "bg-amber-500/20 text-amber-300" : "bg-amber-50 text-amber-600",
    activeLesson: dark ? "bg-indigo-600/20 border-l-2 border-indigo-500" : "bg-indigo-50 border-l-2 border-indigo-600",
    tabActive:    dark ? "border-indigo-400 text-indigo-400" : "border-indigo-600 text-indigo-600",
    tabInactive:  dark
      ? "border-transparent text-[#7a87a1] hover:text-[#e2e8f0] hover:border-[#3a3f55]"
      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
    iconBox:      dark ? "bg-indigo-500/20" : "bg-indigo-50",
    trackBg:      dark ? "bg-[#1e2235]" : "bg-slate-200",
    iconBtn:      dark
      ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#a0aec0] hover:text-white"
      : "bg-slate-100 hover:bg-slate-200 text-slate-600",
    sectionHover: dark ? "hover:bg-[#1a1d2e]" : "hover:bg-slate-50",
  };
}

/* ── Component ── */
export default function LearnPage() {
  const { isDark, toggle } = useTheme(); // ← global theme context
  const { id: courseSlug } = useParams() as { id: string };
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "attachments" | "quiz">("overview");
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [courseDetail, setCourseDetail] = useState<any>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [currentLessonDetail, setCurrentLessonDetail] = useState<any>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  const [progressPercent, setProgressPercent] = useState(0);
  const [completedN, setCompletedN] = useState(0);
  const [totalN, setTotalN] = useState(0);

  // Document Reading Timer
  const [documentReadTime, setDocumentReadTime] = useState(0);
  const [documentReadComplete, setDocumentReadComplete] = useState(false);

  // Quiz Attempt States
  const [quizAttempt, setQuizAttempt] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const t = buildTheme(isDark);

  // Compute lesson locking globally across the entire course.
  // A lesson is locked if any preceding non-preview lesson is incomplete.
  // Preview lessons are always unlocked and do not block sequencing.
  const sectionsWithLocks = useMemo(() => {
    let previousCompleted = true;
    return sections.map((sec) => ({
      ...sec,
      lessons: sec.lessons.map((les) => {
        const locked = les.isPreview ? false : !previousCompleted;
        previousCompleted = les.isPreview ? previousCompleted : les.completed;
        return {
          ...les,
          locked
        };
      })
    }));
  }, [sections]);

  // Load Course and Learning structure
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/courses/${courseSlug}/learn`);
      return;
    }

    const loadCourseData = async () => {
      try {
        const res = await api.get(`/api/courses/${courseSlug}`);
        if (!res.ok) {
          router.push("/courses");
          return;
        }
        const basicCourse = await res.json();
        const courseData = basicCourse.data;
        setCourseDetail(courseData);

        const structureRes = await api.get(`/api/learning/courses/${courseData.id}`);
        if (!structureRes.ok) {
          router.push(`/checkout/${courseSlug}`);
          return;
        }
        const struct = await structureRes.json();
        const data = struct.data;

        setProgressPercent(data.course.progressPercent);
        setCompletedN(data.course.completedLessons);
        setTotalN(data.course.totalLessons);

        const uiSections = data.sections.map((sec: ApiSection, sIdx: number) => ({
          id: sec.id,
          title: sec.title,
          expanded: sIdx === 0,
          lessons: sec.lessons.map((les: ApiLesson) => ({
            id: les.id,
            title: les.title,
            duration: les.durationSeconds
              ? `${Math.floor(les.durationSeconds / 60)}:${(les.durationSeconds % 60).toString().padStart(2, "0")}`
              : "05:00",
            completed: les.isCompleted,
            locked: false,
            type: les.contentType === "video" ? "video" : les.contentType === "quiz" ? "quiz" : "document",
            quizId: les.quizId,
            isPreview: les.isPreview
          }))
        }));
        setSections(uiSections);

        const allLes = uiSections.flatMap((s: Section) => s.lessons);
        const incomplete = allLes.find((l: Lesson) => !l.completed);
        const startLesson = incomplete || allLes[0];
        if (startLesson) {
          setCurrentLessonId(startLesson.id);
        }
      } catch (err) {
        console.error("Error loading learning progress", err);
      } finally {
        setLoadingCourse(false);
      }
    };

    if (user) {
      loadCourseData();
    }
  }, [user, authLoading, courseSlug, router]);

  // Load active lesson details
  useEffect(() => {
    if (!currentLessonId) return;
    const loadLessonDetail = async () => {
      setLoadingLesson(true);
      setCurrentLessonDetail(null); // Clear old details immediately to prevent timer using stale details
      setQuizAttempt(null);
      setQuizQuestions([]);
      setSelectedAnswers({});
      setQuizResult(null);
      setQuizError(null);
      setDocumentReadTime(0);
      setDocumentReadComplete(false);

      try {
        const res = await api.get(`/api/learning/lessons/${currentLessonId}`);
        if (res.ok) {
          const result = await res.json();
          const detail = { ...result.data.lesson, attachments: result.data.attachments };
          setCurrentLessonDetail(detail);

          const savedProgress = result.data.progress;
          setDocumentReadTime(savedProgress?.lastCheckpointTime || 0);
          setDocumentReadComplete(savedProgress?.isCompleted || false);

          if (detail.contentType === "quiz") {
            setActiveTab("quiz");
          } else {
            setActiveTab("overview");
          }
        }
      } catch (err) {
        console.error("Failed to load lesson detail", err);
      } finally {
        setLoadingLesson(false);
      }
    };
    loadLessonDetail();
  }, [currentLessonId]);

  // Lesson time counter (for text, document, and video)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!currentLessonDetail || !currentLessonId) return;
    if (currentLessonDetail.contentType !== "text" && currentLessonDetail.contentType !== "document" && currentLessonDetail.contentType !== "video") return;

    const requiredTime = currentLessonDetail.durationSeconds || 30;
    timerRef.current = setInterval(() => {
      setDocumentReadTime((prev) => Math.min(prev + 1, requiredTime));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentLessonDetail, currentLessonId]);

  useEffect(() => {
    if (!currentLessonId || documentReadTime <= 0) return;
    const requiredTime = currentLessonDetail?.durationSeconds || 30;

    if (documentReadTime >= requiredTime) {
      setDocumentReadComplete(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    if (documentReadTime % 5 === 0) {
      api.post(`/api/learning/lessons/${currentLessonId}/progress`, { currentTime: documentReadTime })
        .catch(e => console.error(e));
    }
  }, [documentReadTime, currentLessonId, currentLessonDetail]);

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  };
  const videoId = currentLessonDetail?.contentType === "video" ? getYoutubeId(currentLessonDetail.contentUrl) : null;



  const handleStartQuiz = async () => {
    if (!currentLessonDetail?.quiz) {
      setQuizError('Bài quiz chưa được thiết lập. Vui lòng liên hệ giảng viên.');
      return;
    }
    setQuizLoading(true);
    setQuizError(null);
    try {
      const qId = currentLessonDetail.quiz.id;
      const res = await api.post(`/api/learning/quizzes/${qId}/start`);
      if (res.ok) {
        const result = await res.json();
        const attempt = result.data;
        if (attempt && !attempt.id && attempt.attemptId) {
          attempt.id = attempt.attemptId;
        }
        setQuizAttempt(attempt);

        const qRes = await api.get(`/api/learning/quiz-attempts/${attempt.id}/questions`);
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuizQuestions(qData.data.questions || []);
          setSelectedAnswers({});
          setQuizResult(null);

          if (currentLessonDetail.quiz.timeLimitMinutes) {
            setQuizTimeLeft(currentLessonDetail.quiz.timeLimitMinutes * 60);
          } else {
            setQuizTimeLeft(0);
          }
        }
      } else {
        const errData = await res.json();
        setQuizError(errData.error || "Không thể bắt đầu làm quiz.");
      }
    } catch {
      setQuizError("Lỗi kết nối khi bắt đầu làm quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectAnswer = (qId: number, oId: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: oId }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizAttempt || quizSubmitting) return;
    setQuizSubmitting(true);
    try {
      const answersArray = Object.entries(selectedAnswers).map(([qId, oId]) => ({
        questionId: parseInt(qId, 10),
        selectedOptionId: oId
      }));

      const res = await api.post(`/api/learning/quiz-attempts/${quizAttempt.id}/submit`, {
        answers: answersArray
      });

      if (res.ok) {
        const result = await res.json();
        setQuizResult(result.data);

        if (result.data.passed) {
          setSections((prev) =>
            prev.map((s) => ({
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === currentLessonId ? { ...l, completed: true } : l
              ),
            }))
          );
          // Re-read progress from server to avoid stale state
          if (courseDetail) {
            try {
              const progressRes = await api.get(`/api/learning/courses/${courseDetail.id}/progress`);
              if (progressRes.ok) {
                const progressResult = await progressRes.json();
                setProgressPercent(progressResult.data.progressPercent);
                setCompletedN(progressResult.data.completedLessons);
              }
            } catch {}
          }
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Nộp bài quiz thất bại.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi nộp bài quiz.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Use refs so the quiz timer always has access to the latest handleSubmitQuiz
  const handleSubmitQuizRef = useRef(handleSubmitQuiz);
  handleSubmitQuizRef.current = handleSubmitQuiz;

  useEffect(() => {
    if (!quizAttempt || quizResult || quizTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuizRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizAttempt, quizResult]); // Removed quizTimeLeft to avoid timer drift

  /* helpers */
  const allLessons    = sectionsWithLocks.flatMap((s) => s.lessons);
  const progress      = progressPercent;
  const currentLesson = allLessons.find((l) => l.id === currentLessonId);
  const flatUnlocked  = allLessons.filter((l) => !l.locked);
  const curIdx        = flatUnlocked.findIndex((l) => l.id === currentLessonId);

  function goToLesson(id: number) { setCurrentLessonId(id); }
  function goPrev() { if (curIdx > 0) goToLesson(flatUnlocked[curIdx - 1].id); }

  const goNextAndComplete = async () => {
    if (!currentLessonId) return;
    try {
      const res = await api.post(`/api/learning/lessons/${currentLessonId}/complete`);
      if (res.ok) {
        setSections((prev) =>
          prev.map((s) => ({
            ...s,
            lessons: s.lessons.map((l) =>
              l.id === currentLessonId ? { ...l, completed: true } : l
            ),
          }))
        );

        if (courseDetail) {
          // Parallelize independent API calls
          const [progressRes, nextRes] = await Promise.all([
            api.get(`/api/learning/courses/${courseDetail.id}/progress`),
            api.get(`/api/learning/lessons/${currentLessonId}/next`),
          ]);

          if (progressRes.ok) {
            const result = await progressRes.json();
            setProgressPercent(result.data.progressPercent);
            setCompletedN(result.data.completedLessons);
          }

          if (nextRes.ok) {
            const nextData = await nextRes.json();
            if (nextData.data.nextLesson) {
              setCurrentLessonId(nextData.data.nextLesson.id);
            } else {
              setShowCompletionModal(true);
              confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981']
              });
            }
          }
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Không thể hoàn thành bài học. Vui lòng kiểm tra tiến độ xem video hoặc thời gian đọc bài viết!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi hoàn thành bài học.");
    }
  };

  function toggleSection(id: number) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s))
    );
  }

  if (authLoading || loadingCourse) {
    return (
      <div className={`h-screen flex flex-col overflow-hidden font-sans transition-colors duration-300 ${t.root}`}>
        <header className={`h-14 flex items-center px-4 gap-3 border-b shrink-0 z-50 ${t.header}`}>
          <a href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
              <span className="text-white font-extrabold text-sm leading-none">E</span>
            </div>
            <span className="font-bold text-sm hidden sm:block">Elevate</span>
          </a>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-3" />
          <p className={`${t.muted} text-sm font-semibold`}>Đang tải nội dung học tập...</p>
        </div>
      </div>
    );
  }

  return (

    <div className={`h-screen flex flex-col overflow-hidden font-sans transition-colors duration-300 ${t.root}`}>

      {/* ── Minimal Header ── */}
      <header className={`h-14 flex items-center px-4 gap-3 border-b shrink-0 z-50 ${t.header}`}>
        <a href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
            <span className="text-white font-extrabold text-sm leading-none">E</span>
          </div>
          <span className="font-bold text-sm hidden sm:block">Elevate</span>
        </a>

        <div className={`w-px h-5 shrink-0 ${isDark ? "bg-[#252840]" : "bg-slate-200"}`} />

        <div className="flex-1 min-w-0">
          <p className={`text-xs leading-none mb-0.5 truncate ${t.muted}`}>{courseDetail?.title || "Elevate Course"}</p>
          <p className="text-sm font-semibold leading-tight truncate">{currentLesson?.title ?? "—"}</p>
        </div>

        {/* Progress (desktop) */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <div className={`w-28 h-1.5 rounded-full overflow-hidden ${t.trackBg}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`text-xs font-semibold tabular-nums ${t.muted}`}>{completedN}/{totalN}</span>
          <span className={`text-xs ${t.muted} hidden lg:block`}>completed</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="theme-toggle"
            onClick={toggle}
            title="Toggle theme"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${t.iconBtn}`}
          >
            {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide curriculum" : "Show curriculum"}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${t.iconBtn}`}
          >
            {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Main scroll area ── */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">

          {/* ── Video Player (only for video type, uses 16:9) ── */}
          {!loadingLesson && currentLessonDetail?.contentType === "video" && (
            <div className="w-full bg-black shrink-0">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                {videoId ? (
                  <div className="absolute inset-0 bg-black">
                    <iframe
                      id="yt-player"
                      className="w-full h-full absolute inset-0 border-0"
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0`}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white">
                    <AlertCircle className="w-10 h-10 text-slate-500 mb-2" />
                    <p className="text-slate-400 text-sm">Không thể load video. URL không hợp lệ.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Main content below player ── */}
          <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
            {loadingLesson ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3" />
                <p className={`text-sm ${t.muted}`}>Đang tải nội dung bài học...</p>
              </div>
            ) : currentLessonId ? (
              <>
                {/* ── Video progress banner ── */}
                {currentLessonDetail?.contentType === "video" && !currentLesson?.completed && (
                  <div className={`p-3 rounded-xl flex items-center justify-between gap-4 border ${
                    documentReadComplete
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {documentReadComplete ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                      )}
                      <span className="text-sm font-bold">
                        {documentReadComplete
                          ? 'Đã đủ điều kiện hoàn thành bài học!'
                          : `Cần xem video: ${documentReadTime}/${currentLessonDetail?.durationSeconds || 30} giây`}
                      </span>
                    </div>
                    {!documentReadComplete && (
                      <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-1000"
                          style={{ width: `${(documentReadTime / (currentLessonDetail?.durationSeconds || 30)) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ── Document / Text Lesson Content (rendered inline, no 16:9) ── */}
                {(currentLessonDetail?.contentType === "text" || currentLessonDetail?.contentType === "document") && (
                  <div className={`border rounded-xl overflow-hidden ${t.surface}`}>
                    <div className={`p-3 flex items-center justify-between gap-4 border-b ${
                      documentReadComplete
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    } ${t.border}`}>
                      <div className="flex items-center gap-2">
                        {documentReadComplete ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                        )}
                        <span className="text-xs font-bold">
                          {documentReadComplete
                            ? 'Đã đủ điều kiện hoàn thành bài đọc!'
                            : `Cần đọc bài viết trong: ${documentReadTime}/${currentLessonDetail?.durationSeconds ?? 5} giây`}
                        </span>
                      </div>
                      {!documentReadComplete && (
                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-1000"
                            style={{ width: `${(documentReadTime / (currentLessonDetail?.durationSeconds ?? 5)) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-4 sm:p-5">
                      <h3 className="text-base font-bold mb-3">{currentLessonDetail.title}</h3>
                      {currentLessonDetail.contentType === "document" && currentLessonDetail.contentUrl ? (
                        <div className="border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 bg-[var(--bg-subtle)]">
                          <FileText className="w-10 h-10 text-indigo-400" />
                          <div>
                            <p className="text-sm font-semibold">Tài liệu đính kèm bài học</p>
                            <p className={`text-xs mt-1 max-w-sm truncate ${t.muted}`}>{currentLessonDetail.contentUrl}</p>
                          </div>
                          <a
                            href={isValidUrl(currentLessonDetail.contentUrl) ? currentLessonDetail.contentUrl : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Mở tài liệu / Tải xuống
                          </a>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none leading-relaxed whitespace-pre-line">
                          {currentLessonDetail.contentUrl || 'Nội dung bài viết đang được cập nhật...'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Quiz Content ── */}
                {currentLessonDetail?.contentType === "quiz" && (
                  <div className={`border rounded-xl overflow-hidden ${t.surface}`}>
                    {!quizAttempt ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Trophy className="w-14 h-14 text-amber-400 mb-4 animate-bounce" />
                        <h3 className="text-base font-bold mb-2">{currentLessonDetail.quiz?.title || "Bài Quiz Kiểm Tra"}</h3>
                        <p className={`text-xs max-w-md text-center mb-6 leading-relaxed ${t.muted}`}>
                          {currentLessonDetail.quiz?.description || "Kiểm tra lại kiến thức đã học trong chương này. Điểm đạt yêu cầu: " + (currentLessonDetail.quiz?.passingScore || 80) + "%"}
                        </p>
                        {quizError && <p className="text-xs text-rose-500 mb-4">{quizError}</p>}
                        <button
                          onClick={handleStartQuiz}
                          disabled={quizLoading}
                          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 text-sm cursor-pointer"
                        >
                          {quizLoading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-slate-950" /> : <PlayCircle className="w-4 h-4" />}
                          Bắt đầu làm bài Quiz
                        </button>
                      </div>
                    ) : quizAttempt && quizQuestions.length > 0 && !quizResult ? (
                      <div className="p-5 flex flex-col space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                          <h3 className="font-bold text-sm text-amber-500 uppercase tracking-wider">ĐANG LÀM BÀI QUIZ: {currentLessonDetail.quiz?.title}</h3>
                          {quizTimeLeft > 0 && (
                            <span className="text-xs font-bold text-rose-500 bg-rose-500/15 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                              Còn lại: {formatTime(quizTimeLeft)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-5">
                          {quizQuestions.map((q: QuizQuestion, qIdx: number) => (
                            <div key={q.id} className="space-y-2.5">
                              <p className="text-sm font-bold leading-normal">{qIdx + 1}. {q.questionText}</p>
                              <div className="grid grid-cols-1 gap-2">
                                {(q.options || q.questionOptions)?.map((opt: QuizOption) => (
                                  <label
                                    key={opt.id}
                                    className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer text-sm transition-all ${
                                      selectedAnswers[q.id] === opt.id
                                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold"
                                        : `${t.border} ${t.hover}`
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`question-${q.id}`}
                                      checked={selectedAnswers[q.id] === opt.id}
                                      onChange={() => handleSelectAnswer(q.id, opt.id)}
                                      className="accent-amber-500 cursor-pointer"
                                    />
                                    <span>{opt.optionText}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-3 flex justify-end">
                          <button
                            onClick={handleSubmitQuiz}
                            disabled={quizSubmitting || Object.keys(selectedAnswers).length < quizQuestions.length}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 font-extrabold rounded-xl transition-all text-sm"
                          >
                            {quizSubmitting ? "Đang chấm..." : "Nộp bài Quiz"}
                          </button>
                        </div>
                      </div>
                    ) : quizResult ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-8 ${
                          quizResult.passed ? "bg-emerald-500/20 ring-emerald-500/10 text-emerald-500" : "bg-rose-500/20 ring-rose-500/10 text-rose-500"
                        }`}>
                          {quizResult.passed ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                        </div>
                        <h3 className="text-xl font-extrabold mb-1">
                          {quizResult.passed ? "Chúc mừng! Bạn đã Đạt" : "Rất tiếc! Bạn chưa đạt"}
                        </h3>
                        <p className={`text-sm mb-6 ${t.muted}`}>
                          Điểm số: <span className="font-bold">{quizResult.score}%</span> (Yêu cầu đạt: {currentLessonDetail.quiz?.passingScore || 80}%)
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleStartQuiz}
                            className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all cursor-pointer ${t.border} ${t.hover}`}
                          >
                            Làm lại bài Quiz
                          </button>
                          {quizResult.passed && (
                            <button
                              onClick={goNextAndComplete}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              Bài tiếp theo
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-16">
                        <p className={`text-sm ${t.muted}`}>Đang chuẩn bị câu hỏi...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Lesson Navigation (not for quiz) ── */}
                {currentLessonDetail?.contentType !== "quiz" && (
                  <div className="flex items-center justify-between gap-3">
                    <button
                      id="prev-lesson-btn"
                      onClick={goPrev}
                      disabled={curIdx <= 0}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${t.surface} ${t.hover}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Bài trước</span>
                    </button>

                    <div className="flex md:hidden items-center gap-2">
                      <div className={`w-20 h-1.5 rounded-full overflow-hidden ${t.trackBg}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${t.muted}`}>{progress}%</span>
                    </div>

                    <button
                      id="complete-next-btn"
                      onClick={goNextAndComplete}
                      disabled={!currentLesson?.completed && !documentReadComplete}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-lg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
                        currentLesson?.completed 
                          ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 hover:shadow-emerald-500/40" 
                          : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25 hover:shadow-indigo-500/40"
                      }`}
                    >
                      {currentLesson?.completed ? <ChevronRight className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      <span className="hidden sm:inline">
                        {currentLesson?.completed 
                          ? (curIdx === flatUnlocked.length - 1 ? "Hoàn thành khóa học" : "Bài tiếp theo")
                          : "Hoàn thành & Tiếp theo"}
                      </span>
                      <span className="sm:hidden">
                        {currentLesson?.completed ? "Tiếp" : "Xong"}
                      </span>
                    </button>
                  </div>
                )}

                {/* ── Tabs (not for quiz) ── */}
                {currentLessonDetail?.contentType !== "quiz" && (
                  <>
                    <div className={`border-b ${t.border}`}>
                      <nav className="flex gap-1 -mb-px">
                        {([
                          { key: "overview", label: "Tổng quan", Icon: BookOpen },
                          { key: "attachments", label: "Tài liệu", Icon: Download },
                        ] as const).map(({ key, label, Icon }) => (
                          <button
                            key={key}
                            id={`tab-${key}`}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                              activeTab === key ? t.tabActive : t.tabInactive
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {label}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* ── Tab Content ── */}
                    <div className="min-h-[200px] pb-10">
                      {activeTab === "overview" && (
                        <div className="space-y-5 animate-in fade-in duration-300 slide-in-from-bottom-2">
                          <div>
                            <h1 className="text-xl font-bold mb-2">{currentLesson?.title}</h1>
                            <p className={`text-sm leading-relaxed ${t.muted}`}>
                              {currentLessonDetail?.description || "Nội dung bài học đang được cập nhật."}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { label: "Thời lượng", value: currentLesson?.duration ?? "—", Icon: Clock },
                              { label: "Loại bài học", value: currentLesson?.type === "video" ? "Video" : currentLesson?.type === "document" ? "Tài liệu" : "Bài viết", Icon: FileText },
                              { label: "Trạng thái", value: currentLesson?.completed ? "Đã hoàn thành" : "Chưa hoàn thành", Icon: currentLesson?.completed ? CheckCircle : Circle },
                            ].map(({ label, value, Icon }) => (
                              <div key={label} className={`border rounded-xl p-4 flex items-center gap-3 ${t.surface}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.iconBox}`}>
                                  <Icon className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-xs ${t.muted} leading-none mb-0.5`}>{label}</p>
                                  <p className="text-sm font-bold truncate">{value}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {courseDetail?.creator && (
                            <div className={`border rounded-xl p-5 flex items-center gap-4 ${t.surface}`}>
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 flex items-center justify-center text-white font-extrabold shrink-0 shadow-lg shadow-indigo-500/30">
                                {courseDetail.creator.username?.slice(0, 2).toUpperCase() || "GV"}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{courseDetail.creator.username || "Giảng viên"}</p>
                                <p className={`text-xs ${t.muted} mt-0.5`}>Giảng viên khóa học</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "attachments" && (
                        <div className="space-y-3 animate-in fade-in duration-300 slide-in-from-bottom-2">
                          <p className={`text-sm ${t.muted} mb-4`}>
                            Tài liệu tham khảo và đính kèm cho bài học này.
                          </p>
                          {currentLessonDetail?.attachments && currentLessonDetail.attachments.length > 0 ? (
                            currentLessonDetail.attachments.map((file: Attachment, i: number) => (
                              <div
                                key={i}
                                className={`border rounded-xl p-4 flex items-center justify-between gap-4 group transition-all ${t.surface} hover:border-indigo-500/40`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-rose-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">{file.fileName}</p>
                                    <p className={`text-xs ${t.muted} mt-0.5`}>
                                      {file.fileType || 'Tài liệu'} &bull; {((file.fileSize || 0) / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                {isValidUrl(file.fileUrl) ? (
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${t.pill} hover:opacity-80`}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Tải xuống
                                  </a>
                                ) : (
                                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${t.muted} cursor-not-allowed`}>
                                    <Download className="w-3.5 h-3.5" />
                                    Không có
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className={`text-sm ${t.muted}`}>Không có tài liệu đính kèm nào cho bài học này.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <BookOpen className="w-12 h-12 text-slate-400 mb-3" />
                <p className={`text-sm ${t.muted}`}>Vui lòng chọn bài học từ danh sách bên cạnh.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop Sidebar ── */}
        <aside
          className={`hidden md:flex shrink-0 border-l flex-col overflow-hidden transition-all duration-300 ease-in-out ${t.sidebar} ${t.border}`}
          style={{ width: sidebarOpen ? "320px" : "0px" }}
        >
          <SidebarContent
            t={t}
            sectionsWithLocks={sectionsWithLocks}
            currentLessonId={currentLessonId}
            completedN={completedN}
            totalN={totalN}
            progress={progress}
            goToLesson={goToLesson}
            toggleSection={toggleSection}
            onClose={() => setSidebarOpen(false)}
            isDark={isDark}
            tPillQuiz={t.pillQuiz}
          />
        </aside>

        {/* ── Mobile Sidebar Overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] shadow-2xl flex flex-col animate-in slide-in-from-bottom-2 duration-300 ${t.sidebar} ${t.border} border-l`}>
              <SidebarContent
                t={t}
                sectionsWithLocks={sectionsWithLocks}
                currentLessonId={currentLessonId}
                completedN={completedN}
                totalN={totalN}
                progress={progress}
                goToLesson={goToLesson}
                toggleSection={toggleSection}
                onClose={() => setSidebarOpen(false)}
                isDark={isDark}
                tPillQuiz={t.pillQuiz}
              />
            </aside>
          </div>
        )}
      </div>

      {/* Course Completion Modal */}
      {showCompletionModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <div
            className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transition-all text-center p-6 sm:p-8 ${
              isDark ? "bg-[var(--bg-card)] border border-[var(--border)]" : "bg-white border border-slate-200"
            }`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            
            <h2 className={`text-xl sm:text-2xl font-extrabold mb-2 ${t.text}`}>
              Hoàn thành khóa học!
            </h2>
            <p className={`text-sm mb-6 sm:mb-8 ${t.muted}`}>
              Chúc mừng! Bạn đã hoàn thành tất cả bài học trong khóa học này. Chứng chỉ của bạn đã sẵn sàng.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/certificates")}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                <Award className="w-4 h-4" />
                Xem chứng chỉ
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  router.push(`/courses/${courseSlug}`);
                }}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 border text-sm font-bold rounded-xl transition-all ${
                  isDark 
                    ? "border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--bg-surface)]" 
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Quay lại khóa học
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SidebarContent Component (shared between desktop & mobile) ── */
interface SidebarContentProps {
  t: ReturnType<typeof buildTheme>;
  sectionsWithLocks: Section[];
  currentLessonId: number | null;
  completedN: number;
  totalN: number;
  progress: number;
  goToLesson: (id: number) => void;
  toggleSection: (id: number) => void;
  onClose: () => void;
  isDark: boolean;
  tPillQuiz: string;
}

function SidebarContent({ t, sectionsWithLocks, currentLessonId, completedN, totalN, progress, goToLesson, toggleSection, onClose, isDark, tPillQuiz }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className={`border-b px-4 py-3.5 shrink-0 ${t.border}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm uppercase tracking-widest">Nội dung khóa học</h2>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all md:hidden ${t.iconBtn}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${t.trackBg}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={`text-xs mt-1.5 ${t.muted}`}>
          {completedN}/{totalN} bài học đã hoàn thành
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sectionsWithLocks.map((section) => {
          const secDone  = section.lessons.filter((l) => l.completed).length;
          const secTotal = section.lessons.length;
          return (
            <div key={section.id} className={`border-b ${t.border}`}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full text-left px-4 py-3.5 flex items-start gap-2 transition-colors ${t.sectionHover}`}
              >
                <ChevronDown
                  className={`w-4 h-4 shrink-0 mt-0.5 transition-transform duration-200 ${t.muted} ${
                    section.expanded ? "" : "-rotate-90"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-snug">{section.title}</p>
                  <p className={`text-xs mt-0.5 ${t.muted}`}>
                    {secDone}/{secTotal} &bull;{" "}
                    {Math.floor(
                      section.lessons.reduce((a, l) => {
                        const [m, s] = l.duration.split(":").map(Number);
                        return a + m * 60 + s;
                      }, 0) / 60
                    )} phút
                  </p>
                </div>
                {secDone === secTotal && secTotal > 0 && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
              </button>

              {section.expanded && (
                <div className={t.surfaceAlt}>
                  {section.lessons.map((lesson) => {
                    const isActive    = lesson.id === currentLessonId;
                    const isClickable = !lesson.locked;
                    return (
                      <button
                        key={lesson.id}
                        id={`lesson-${lesson.id}`}
                        onClick={() => isClickable && goToLesson(lesson.id)}
                        disabled={lesson.locked}
                        title={lesson.locked ? "Hoàn thành bài học trước để mở khóa" : lesson.title}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-150 ${
                          isActive
                            ? t.activeLesson
                            : lesson.locked
                            ? "opacity-45 cursor-not-allowed"
                            : `${t.hover} cursor-pointer`
                        }`}
                      >
                        <div className="shrink-0">
                          {lesson.locked ? (
                            <Lock className={`w-3.5 h-3.5 ${t.muted}`} />
                          ) : lesson.completed ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : isActive ? (
                            <PlayCircle className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Circle className={`w-3.5 h-3.5 ${t.muted}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold leading-snug truncate ${
                              isActive
                                ? "text-indigo-400"
                                : lesson.completed
                                ? "text-emerald-400"
                                : ""
                            }`}
                          >
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-xs font-mono ${t.muted}`}>
                              {lesson.duration}
                            </span>
                            {lesson.type === "quiz" && (
                              <span className={`text-[10px] px-1.5 py-px rounded font-bold ${tPillQuiz}`}>
                                Quiz
                              </span>
                            )}
                            {lesson.type === "document" && (
                              <span
                                className={`text-[10px] px-1.5 py-px rounded font-bold ${
                                  isDark
                                    ? "bg-sky-500/20 text-sky-300"
                                    : "bg-sky-50 text-sky-600"
                                }`}
                              >
                                Doc
                              </span>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div className="h-6" />
      </div>
    </div>
  );
}
