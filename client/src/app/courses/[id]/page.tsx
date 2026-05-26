"use client";

import { useState, use } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import {
  PlayCircle, Star, ShieldCheck, Clock, FileText,
  MonitorPlay, CheckCircle, ChevronDown, Lock, Users,
  Globe, RefreshCw, Smartphone
} from "lucide-react";

const curriculum = [
  {
    module: "Module 1: Introduction to UI/UX",
    lessons: [
      { title: "What is UI/UX Design?", duration: "10:25", isPreview: true },
      { title: "The Design Thinking Process", duration: "15:40", isPreview: true },
    ],
  },
  {
    module: "Module 2: Figma Basics",
    lessons: [
      { title: "Setting up your workspace", duration: "08:15", isPreview: false },
      { title: "Frames, Shapes, and Colors", duration: "20:00", isPreview: false },
      { title: "Typography in Design", duration: "18:30", isPreview: false },
    ],
  },
  {
    module: "Module 3: Advanced Prototyping",
    lessons: [
      { title: "Interactive Prototypes", duration: "22:10", isPreview: false },
      { title: "Micro-interactions & Animations", duration: "19:45", isPreview: false },
    ],
  },
];

const reviews = [
  {
    initials: "JD",
    name: "John Doe",
    rating: 5,
    time: "2 weeks ago",
    color: "bg-indigo-500",
    text: "This course is amazing! Jane explains everything so clearly. I was able to redesign my company's landing page immediately after finishing module 2. Highly recommended!",
  },
  {
    initials: "AM",
    name: "Alice Morgan",
    rating: 5,
    time: "1 month ago",
    color: "bg-emerald-500",
    text: "Best UI/UX course I've ever taken. The Figma tutorials are incredibly detailed and practical. Worth every penny!",
  },
];

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isDark } = useTheme();

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const subtle = isDark ? "text-[#4a5568]" : "text-slate-400";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const input = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";

  const [activeTab, setActiveTab] = useState("description");
  const [couponCode, setCouponCode] = useState("");
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const course = {
    title: "UI/UX Design Masterclass: From Zero to Hero",
    subtitle:
      "Learn how to design beautiful, engaging user interfaces and experiences with Figma.",
    instructor: "Jane Doe",
    rating: 4.8,
    reviews: 1254,
    students: "12,400",
    price: 89.99,
    originalPrice: 149.99,
    updatedAt: "May 2026",
    language: "English",
  };

  const tabs = ["description", "curriculum", "reviews"];

  return (
    <div className={`min-h-screen ${bg} font-sans`}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ─── Left Column ─────────────────────────────────── */}
          <div className="flex-1 lg:max-w-3xl xl:max-w-4xl space-y-8">

            {/* Title & Meta */}
            <div className="space-y-4">
              <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight ${text}`}>
                {course.title}
              </h1>
              <p className={`text-lg ${muted}`}>{course.subtitle}</p>

              <div className={`flex flex-wrap items-center gap-4 text-sm font-medium ${muted}`}>
                <div className="flex items-center text-amber-400">
                  <Star className="w-5 h-5 fill-current mr-1.5" />
                  <span className={`font-bold ${text} mr-1`}>{course.rating}</span>
                  <span className={subtle}>({course.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className={`${text} font-semibold`}>{course.students}</span>
                  <span>students</span>
                </div>
                <div>
                  Created by{" "}
                  <span className="text-indigo-500 font-semibold">{course.instructor}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last updated {course.updatedAt}
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {course.language}
                </div>
              </div>
            </div>

            {/* Video Player */}
            <div className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden relative shadow-lg group cursor-pointer">
              <div
                className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  id="play-preview-btn"
                  className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all group-hover:scale-110 shadow-lg"
                >
                  <PlayCircle className="w-10 h-10 text-white fill-white/30" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white text-sm font-medium">
                <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg">Preview this course</span>
                <span className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg">02:45</span>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className={`border-b ${divider}`}>
              <nav className="flex gap-0">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    id={`tab-${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-sm font-semibold border-b-2 transition-colors capitalize ${
                      activeTab === tab
                        ? "border-indigo-500 text-indigo-500"
                        : `border-transparent ${muted} hover:${text} ${isDark ? "hover:border-[#252840]" : "hover:border-slate-300"}`
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="py-2 min-h-[400px]">

              {/* ── Description Tab ── */}
              {activeTab === "description" && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3 className={`text-2xl font-bold ${text}`}>About this course</h3>
                    <p className={`${muted} leading-relaxed text-base`}>
                      Dive into the world of User Interface and User Experience design. This
                      comprehensive masterclass will take you from complete beginner to confident
                      designer. You&apos;ll learn the core principles of visual design, color theory,
                      typography, and how to create intuitive user flows that solve real problems.
                    </p>
                    <p className={`${muted} leading-relaxed text-base`}>
                      By the end of this course, you&apos;ll have a professional-grade portfolio and
                      the skills to land your first job as a UI/UX designer or freelancer.
                    </p>
                  </div>

                  <div className={`${isDark ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-100"} rounded-2xl p-6 sm:p-8`}>
                    <h4 className={`text-xl font-bold ${text} mb-6`}>What you&apos;ll learn</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Build wireframes, prototypes, and high-fidelity mockups.",
                        "Understand human-centered design principles.",
                        "Master Figma and its advanced features.",
                        "Create a professional portfolio to land jobs.",
                        "Design responsive layouts for web and mobile.",
                        "Apply color theory and typography best practices.",
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                          <span className={`text-sm font-medium ${muted}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className={`text-xl font-bold ${text}`}>Requirements</h3>
                    <ul className={`space-y-2 ${muted} text-sm`}>
                      {[
                        "A computer with internet access (Mac, Windows, or Linux).",
                        "No prior design experience needed — we start from scratch.",
                        "Figma free account (we'll set it up in the first lesson).",
                      ].map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ── Curriculum Tab ── */}
              {activeTab === "curriculum" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-2xl font-bold ${text}`}>Course Curriculum</h3>
                    <span className={`text-sm font-medium ${subtle} hidden sm:block`}>
                      3 sections · 7 lessons · 1h 54m total
                    </span>
                  </div>

                  <div className="space-y-3">
                    {curriculum.map((section, idx) => (
                      <div
                        key={idx}
                        className={`border ${divider} rounded-2xl overflow-hidden`}
                      >
                        <button
                          id={`module-toggle-${idx}`}
                          onClick={() => toggleModule(idx)}
                          className={`w-full ${isDark ? "bg-[#13151f] hover:bg-[#1a1d2e]" : "bg-slate-50 hover:bg-slate-100"} px-6 py-4 border-b ${divider} flex justify-between items-center transition-colors`}
                        >
                          <h4 className={`font-bold text-sm ${text} text-left`}>{section.module}</h4>
                          <ChevronDown
                            className={`w-5 h-5 ${muted} transition-transform shrink-0 ${
                              expandedModules.includes(idx) ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expandedModules.includes(idx) && (
                          <div className={`divide-y ${divider}`}>
                            {section.lessons.map((lesson, lIdx) => (
                              <div
                                key={lIdx}
                                className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between transition-colors gap-3 ${isDark ? "hover:bg-[#13151f]" : "hover:bg-slate-50"}`}
                              >
                                <div className="flex items-center">
                                  {lesson.isPreview ? (
                                    <MonitorPlay className="w-5 h-5 text-indigo-500 mr-4 shrink-0" />
                                  ) : (
                                    <Lock className={`w-4 h-4 ${subtle} mr-4 shrink-0`} />
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      lesson.isPreview ? "text-indigo-500" : muted
                                    }`}
                                  >
                                    {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 ml-9 sm:ml-0">
                                  {lesson.isPreview && (
                                    <span className="text-xs font-bold uppercase tracking-wide text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg">
                                      Preview
                                    </span>
                                  )}
                                  <span className={`text-sm font-medium ${subtle}`}>
                                    {lesson.duration}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Reviews Tab ── */}
              {activeTab === "reviews" && (
                <div className="space-y-8">
                  <h3 className={`text-2xl font-bold ${text}`}>Student Reviews</h3>

                  {/* Rating Summary */}
                  <div className={`flex flex-col sm:flex-row items-center gap-6 p-6 border ${divider} rounded-2xl ${sectionBg}`}>
                    <div className="text-center w-full sm:w-auto shrink-0">
                      <div className={`text-5xl font-extrabold ${text}`}>{course.rating}</div>
                      <div className="flex justify-center text-amber-400 my-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <div className={`text-sm font-medium ${muted}`}>Course Rating</div>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      {[5, 4, 3, 2, 1].map((star, i) => (
                        <div key={star} className={`flex items-center text-sm font-medium ${muted}`}>
                          <span className="w-12">{star} stars</span>
                          <div className={`flex-1 h-2 mx-3 ${isDark ? "bg-[#1e2235]" : "bg-slate-100"} rounded-full overflow-hidden`}>
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{
                                width: star === 5 ? "75%" : star === 4 ? "20%" : i === 2 ? "3%" : "1%",
                              }}
                            />
                          </div>
                          <span className="w-8 text-right">
                            {star === 5 ? "75%" : star === 4 ? "20%" : star === 3 ? "3%" : "1%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review Items */}
                  <div className="space-y-6">
                    {reviews.map((review, i) => (
                      <div key={i} className={`border-b ${divider} pb-6`}>
                        <div className="flex items-center mb-4">
                          <div
                            className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center font-bold text-white text-sm mr-4 shrink-0`}
                          >
                            {review.initials}
                          </div>
                          <div>
                            <div className={`font-bold text-sm ${text}`}>{review.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex text-amber-400">
                                {[...Array(review.rating)].map((_, j) => (
                                  <Star key={j} className="w-3 h-3 fill-current" />
                                ))}
                              </div>
                              <span className={`text-xs ${subtle}`}>{review.time}</span>
                            </div>
                          </div>
                        </div>
                        <p className={`text-sm leading-relaxed ${muted}`}>{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Sidebar ────────────────────────────────── */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className={`sticky top-24 border ${divider} rounded-3xl p-6 sm:p-8 shadow-xl ${isDark ? "shadow-black/30 bg-[#13151f]" : "shadow-slate-200/60 bg-white"}`}>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-3 mb-2">
                  <span className={`text-4xl font-extrabold ${text}`}>${course.price}</span>
                  <span className={`text-lg line-through mb-1 ${subtle}`}>${course.originalPrice}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                    40% off — limited time
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3 mb-8">
                <Link
                  href={`/checkout/${id}`}
                  id="enroll-now-btn"
                  className="w-full block py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center text-base transition-all shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40"
                >
                  Enroll Now
                </Link>
                <p className={`text-center text-xs font-medium ${subtle}`}>
                  30-Day Money-Back Guarantee
                </p>
              </div>

              {/* Course Includes */}
              <div className="space-y-4 mb-8">
                <h4 className={`font-bold text-sm ${text}`}>This course includes:</h4>
                <ul className="space-y-3">
                  {[
                    { icon: MonitorPlay, label: "12 hours on-demand video" },
                    { icon: FileText, label: "15 articles & resources" },
                    { icon: RefreshCw, label: "Full lifetime access" },
                    { icon: Smartphone, label: "Access on mobile & desktop" },
                    { icon: ShieldCheck, label: "Certificate of completion" },
                    { icon: CheckCircle, label: "30-day money-back guarantee" },
                  ].map(({ icon: Icon, label }, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm font-medium ${muted}`}>
                      <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coupon */}
              <div className={`pt-6 border-t ${divider}`}>
                <label
                  htmlFor="coupon-input"
                  className={`block text-sm font-bold ${text} mb-2`}
                >
                  Apply Coupon
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon-input"
                    type="text"
                    placeholder="Enter code"
                    className={`flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-all uppercase placeholder:normal-case ${input}`}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    id="apply-coupon-btn"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
