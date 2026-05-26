"use client";

import { useState } from "react";
import {
  PlayCircle, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Download, HelpCircle, Sun, Moon, X, FileText, BookOpen,
  Clock, Lock, Circle, SkipForward, SkipBack, Volume2,
  Maximize, Settings, MessageSquare, PanelRightClose, PanelRightOpen, Star,
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

/* ── Types ── */
type LessonType = "video" | "quiz" | "document";
interface Lesson {
  id: number; title: string; duration: string;
  completed: boolean; locked: boolean; type: LessonType;
}
interface Section { id: number; title: string; lessons: Lesson[]; expanded: boolean; }
interface Attachment { name: string; size: string; type: string; }
interface QAItem { id: number; user: string; avatar: string; question: string; time: string; answers: number; upvotes: number; }

/* ── Mock Data ── */
const INITIAL_SECTIONS: Section[] = [
  {
    id: 1, title: "Module 1: Introduction to UI/UX", expanded: true,
    lessons: [
      { id: 1, title: "What is UI/UX Design?", duration: "10:25", completed: true, locked: false, type: "video" },
      { id: 2, title: "The Design Thinking Process", duration: "15:40", completed: true, locked: false, type: "video" },
      { id: 3, title: "Module 1 Quiz", duration: "5:00", completed: true, locked: false, type: "quiz" },
    ],
  },
  {
    id: 2, title: "Module 2: Figma Basics", expanded: true,
    lessons: [
      { id: 4, title: "Setting up your workspace", duration: "08:15", completed: true, locked: false, type: "video" },
      { id: 5, title: "Typography in Design", duration: "18:30", completed: false, locked: false, type: "video" },
      { id: 6, title: "Frames, Shapes, and Colors", duration: "20:00", completed: false, locked: false, type: "video" },
      { id: 7, title: "Module 2 Quiz", duration: "5:00", completed: false, locked: false, type: "quiz" },
    ],
  },
  {
    id: 3, title: "Module 3: Advanced Design Systems", expanded: false,
    lessons: [
      { id: 8, title: "Design Tokens & Variables", duration: "22:10", completed: false, locked: true, type: "video" },
      { id: 9, title: "Component Architecture", duration: "19:45", completed: false, locked: true, type: "video" },
      { id: 10, title: "Auto-Layout Mastery", duration: "25:00", completed: false, locked: true, type: "video" },
    ],
  },
  {
    id: 4, title: "Module 4: Prototyping & Testing", expanded: false,
    lessons: [
      { id: 11, title: "Interactive Prototypes", duration: "16:20", completed: false, locked: true, type: "video" },
      { id: 12, title: "Usability Testing Methods", duration: "14:50", completed: false, locked: true, type: "video" },
      { id: 13, title: "Final Capstone Project", duration: "60:00", completed: false, locked: true, type: "document" },
    ],
  },
];

const ATTACHMENTS: Attachment[] = [
  { name: "Module 1 – Design Fundamentals.pdf", size: "2.4 MB", type: "PDF" },
  { name: "Figma Shortcuts Cheatsheet.pdf", size: "1.1 MB", type: "PDF" },
  { name: "Typography Scale Template.pdf", size: "845 KB", type: "PDF" },
  { name: "Color Theory Workbook.pdf", size: "3.2 MB", type: "PDF" },
];

const QA_ITEMS: QAItem[] = [
  { id: 1, user: "Alex M.", avatar: "AM", question: "At 8:42, which font pairing tool do you recommend for beginners?", time: "2 days ago", answers: 3, upvotes: 12 },
  { id: 2, user: "Sarah K.", avatar: "SK", question: "Can we apply these typography techniques in mobile app design as well?", time: "5 days ago", answers: 1, upvotes: 8 },
];

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "attachments" | "quiz">("overview");
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [currentLessonId, setCurrentLessonId] = useState(5);
  const [newQuestion, setNewQuestion] = useState("");

  const t = buildTheme(isDark);

  /* helpers */
  const allLessons    = sections.flatMap((s) => s.lessons);
  const completedN    = allLessons.filter((l) => l.completed).length;
  const totalN        = allLessons.length;
  const progress      = Math.round((completedN / totalN) * 100);
  const currentLesson = allLessons.find((l) => l.id === currentLessonId);
  const flatUnlocked  = allLessons.filter((l) => !l.locked);
  const curIdx        = flatUnlocked.findIndex((l) => l.id === currentLessonId);

  function goToLesson(id: number) { setCurrentLessonId(id); }
  function goPrev() { if (curIdx > 0) goToLesson(flatUnlocked[curIdx - 1].id); }
  function goNextAndComplete() {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) =>
          l.id === currentLessonId ? { ...l, completed: true } : l
        ),
      }))
    );
    if (curIdx < flatUnlocked.length - 1) goToLesson(flatUnlocked[curIdx + 1].id);
  }
  function toggleSection(id: number) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, expanded: !s.expanded } : s))
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
          <p className={`text-[11px] leading-none mb-0.5 truncate ${t.muted}`}>UI/UX Design Masterclass</p>
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

          {/* Video Player */}
          <div className="w-full bg-black shrink-0">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none overflow-hidden bg-gradient-to-br from-[#0b0c18] via-[#0f1240] to-[#0b0c18]">

                {/* Ambient glows */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute top-[20%] left-[15%] w-72 h-72 bg-indigo-700 rounded-full blur-[90px] opacity-25 animate-pulse" />
                  <div className="absolute bottom-[15%] right-[10%] w-56 h-56 bg-indigo-600 rounded-full blur-[80px] opacity-20 animate-pulse [animation-delay:1.5s]" />
                </div>

                {/* Play button */}
                <button
                  id="video-play-btn"
                  className="relative z-10 w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                >
                  <PlayCircle className="w-10 h-10 text-white/90 fill-white/20 group-hover:fill-white/40 transition-all" />
                </button>
                <p className="relative z-10 mt-3 text-white/50 text-sm font-medium tracking-wide">
                  {currentLesson?.title}
                </p>

                {/* Player Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-12">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-white/60 text-xs font-mono tabular-nums">07:22</span>
                    <div className="flex-1 group/seek h-1 bg-white/20 rounded-full cursor-pointer relative hover:h-[5px] transition-all duration-150">
                      <div className="h-full w-[39%] bg-indigo-400 rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/seek:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <span className="text-white/60 text-xs font-mono tabular-nums">{currentLesson?.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="text-white/60 hover:text-white transition-colors">
                        <SkipBack className="w-5 h-5" />
                      </button>
                      <button id="player-play" className="text-white hover:text-indigo-300 transition-colors">
                        <PlayCircle className="w-7 h-7 fill-white/20" />
                      </button>
                      <button className="text-white/60 hover:text-white transition-colors">
                        <SkipForward className="w-5 h-5" />
                      </button>
                      <button className="text-white/60 hover:text-white transition-colors">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="text-white/60 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded border border-white/20 hover:border-white/40 transition-colors">
                        1×
                      </button>
                      <button className="text-white/60 hover:text-white transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                      <button className="text-white/60 hover:text-white transition-colors">
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Below Video */}
          <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">

            {/* Lesson Nav */}
            <div className="flex items-center justify-between gap-3">
              <button
                id="prev-lesson-btn"
                onClick={goPrev}
                disabled={curIdx <= 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${t.surface} ${t.hover}`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Mobile progress */}
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.97]"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Mark Complete &amp; Next</span>
                <span className="sm:hidden">Complete</span>
              </button>
            </div>

            {/* Tabs */}
            <div className={`border-b ${t.border}`}>
              <nav className="flex gap-1 -mb-px">
                {(
                  [
                    { key: "overview", label: "Overview", Icon: BookOpen },
                    { key: "attachments", label: "Attachments", Icon: Download },
                    { key: "quiz", label: "Quiz / Q&A", Icon: HelpCircle },
                  ] as const
                ).map(({ key, label, Icon }) => (
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

            {/* Tab Content */}
            <div className="min-h-[340px] pb-10">

              {/* Overview */}
              {activeTab === "overview" && (
                <div className="space-y-5 animate-in fade-in duration-300 slide-in-from-bottom-2">
                  <div>
                    <h1 className="text-xl font-bold mb-2">{currentLesson?.title}</h1>
                    <p className={`text-sm leading-relaxed ${t.muted}`}>
                      In this lesson you&apos;ll discover the fundamental principles of typography
                      and how they shape the feel of a user interface. We explore font pairing
                      strategies, type scales, line-height ratios, and when to choose serif vs.
                      sans-serif faces for digital product design.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Duration", value: currentLesson?.duration ?? "—", Icon: Clock },
                      { label: "Resources", value: "4 PDFs", Icon: FileText },
                      { label: "Module", value: "2 of 4", Icon: BookOpen },
                    ].map(({ label, value, Icon }) => (
                      <div key={label} className={`border rounded-xl p-4 flex items-center gap-3 ${t.surface}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.iconBox}`}>
                          <Icon className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[11px] ${t.muted} leading-none mb-0.5`}>{label}</p>
                          <p className="text-sm font-bold truncate">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`border rounded-xl p-5 ${t.surface}`}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
                      What you&apos;ll learn
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Type scale & visual hierarchy in UI design",
                        "Font pairing principles and Google Fonts best practices",
                        "Line-height, letter-spacing, and readability rules",
                        "Using variable fonts in modern interfaces",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <span className={t.muted}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`border rounded-xl p-5 flex items-center gap-4 ${t.surface}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 flex items-center justify-center text-white font-extrabold shrink-0 shadow-lg shadow-indigo-500/30">
                      JD
                    </div>
                    <div>
                      <p className="font-bold text-sm">Jane Doe</p>
                      <p className={`text-xs ${t.muted} mt-0.5`}>
                        Senior Product Designer • 12 years experience
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                        <span className={`text-xs ${t.muted} ml-1`}>4.8 · 1,254 reviews</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {activeTab === "attachments" && (
                <div className="space-y-3 animate-in fade-in duration-300 slide-in-from-bottom-2">
                  <p className={`text-sm ${t.muted} mb-4`}>
                    Download course materials for this lesson and the entire course.
                  </p>
                  {ATTACHMENTS.map((file, i) => (
                    <div
                      key={i}
                      className={`border rounded-xl p-4 flex items-center justify-between gap-4 group transition-all ${t.surface} hover:border-indigo-500/40`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-rose-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{file.name}</p>
                          <p className={`text-xs ${t.muted} mt-0.5`}>
                            {file.type} &bull; {file.size}
                          </p>
                        </div>
                      </div>
                      <button
                        id={`download-${i}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${t.pill} hover:opacity-80`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quiz / Q&A */}
              {activeTab === "quiz" && (
                <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
                  <div className={`border rounded-xl p-5 ${t.surface}`}>
                    <h3 className="font-bold text-sm mb-3">Ask a Question</h3>
                    <textarea
                      rows={3}
                      placeholder="Have a question about this lesson? Ask here…"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-sm border resize-none outline-none focus:ring-2 transition-all ${t.input}`}
                    />
                    <button
                      id="post-question-btn"
                      className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50"
                      disabled={!newQuestion.trim()}
                    >
                      Post Question
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${t.muted}`}>
                      Recent Questions
                    </h3>
                    {QA_ITEMS.map((qa) => (
                      <div key={qa.id} className={`border rounded-xl p-5 space-y-3 ${t.surface}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow">
                            {qa.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <p className="font-bold text-sm">{qa.user}</p>
                              <p className={`text-xs ${t.muted}`}>{qa.time}</p>
                              <span className={`ml-auto text-xs ${t.muted} shrink-0`}>
                                {qa.answers} {qa.answers === 1 ? "answer" : "answers"}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed mt-1.5">{qa.question}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-4 pl-12 border-t pt-3 ${t.border}`}>
                          <button className={`flex items-center gap-1.5 text-xs font-semibold ${t.muted} hover:text-indigo-400 transition-colors`}>
                            ▲ {qa.upvotes} upvotes
                          </button>
                          <button className={`flex items-center gap-1.5 text-xs font-semibold ${t.muted} hover:text-indigo-400 transition-colors`}>
                            <MessageSquare className="w-3.5 h-3.5" /> Reply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Curriculum Sidebar ── */}
        <aside
          className={`shrink-0 border-l flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${t.sidebar} ${t.border}`}
          style={{ width: sidebarOpen ? "320px" : "0px" }}
        >
          <div className="w-[320px] flex flex-col h-full overflow-hidden">
            {/* Sidebar Header */}
            <div className={`border-b px-4 py-3.5 shrink-0 ${t.border}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm uppercase tracking-widest">Course Content</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${t.iconBtn}`}
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
                {completedN} of {totalN} lessons completed
              </p>
            </div>

            {/* Lessons List */}
            <div className="flex-1 overflow-y-auto">
              {sections.map((section) => {
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
                        <p className={`text-[11px] mt-0.5 ${t.muted}`}>
                          {secDone}/{secTotal} &bull;{" "}
                          {Math.floor(
                            section.lessons.reduce((a, l) => {
                              const [m, s] = l.duration.split(":").map(Number);
                              return a + m * 60 + s;
                            }, 0) / 60
                          )}m
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
                              title={lesson.locked ? "Complete previous lessons to unlock" : lesson.title}
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
                                  <span className={`text-[11px] font-mono ${t.muted}`}>
                                    {lesson.duration}
                                  </span>
                                  {lesson.type === "quiz" && (
                                    <span className={`text-[10px] px-1.5 py-px rounded font-bold ${t.pillQuiz}`}>
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
        </aside>
      </div>
    </div>
  );
}
