"use client";

import Link from "next/link";
import {
  Search,
  Monitor,
  Briefcase,
  Palette,
  Megaphone,
  Star,
  ChevronRight,
  BookOpen,
  Users,
  Award,
  Clock,
  ArrowRight,
  Play,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTheme } from "@/components/ui/ThemeProvider";

const CATEGORIES = [
  { name: "IT & Software", icon: Monitor, courses: "1,200+", color: "from-blue-500 to-indigo-600", href: "/courses?cat=it" },
  { name: "Business", icon: Briefcase, courses: "850+", color: "from-violet-500 to-purple-600", href: "/courses?cat=business" },
  { name: "Design", icon: Palette, courses: "600+", color: "from-pink-500 to-rose-600", href: "/courses?cat=design" },
  { name: "Marketing", icon: Megaphone, courses: "400+", color: "from-amber-500 to-orange-600", href: "/courses?cat=marketing" },
];

const COURSES = [
  {
    id: 1,
    title: "UI/UX Design Masterclass: From Zero to Hero",
    instructor: "Jane Doe",
    price: "$89.99",
    originalPrice: "$149.99",
    rating: 4.8,
    students: "12k",
    level: "Beginner",
    gradient: "from-purple-400 via-violet-500 to-indigo-600",
    icon: Palette,
  },
  {
    id: 2,
    title: "Advanced React Patterns and Performance",
    instructor: "John Smith",
    price: "$129.99",
    originalPrice: "$199.99",
    rating: 4.9,
    students: "8.5k",
    level: "Advanced",
    gradient: "from-blue-400 via-cyan-500 to-teal-600",
    icon: Monitor,
  },
  {
    id: 3,
    title: "Complete Digital Marketing Strategy 2026",
    instructor: "Sarah Jenkins",
    price: "$94.99",
    originalPrice: "$149.99",
    rating: 4.7,
    students: "20k",
    level: "Intermediate",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    icon: Megaphone,
  },
];

const STATS = [
  { value: "50K+", label: "Active Learners", icon: Users },
  { value: "300+", label: "Expert Courses", icon: BookOpen },
  { value: "98%", label: "Satisfaction Rate", icon: Award },
  { value: "24/7", label: "Learning Access", icon: Clock },
];

export default function Home() {
  const { isDark } = useTheme();

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200/60";
  const cardHover = isDark
    ? "hover:border-indigo-500/30 hover:shadow-black/30"
    : "hover:border-indigo-200 hover:shadow-slate-200/50";
  const text = isDark ? "text-white" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const subtle = isDark ? "text-[#4a5568]" : "text-slate-400";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";
  const catCard = isDark
    ? "bg-[#1a1d2e] border-[#252840] hover:border-indigo-500/30 hover:bg-[#22263a]"
    : "bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white";
  const inputBg = isDark
    ? "bg-[#1a1d2e] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568]"
    : "bg-white border-slate-200/60 text-slate-700 placeholder-slate-400";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg} ${text}`}>
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className="relative pt-24 pb-32 px-6 overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full -z-10 pointer-events-none opacity-40"
            style={{
              background: isDark
                ? "radial-gradient(ellipse, rgba(79,70,229,0.2) 0%, transparent 70%)"
                : "radial-gradient(ellipse, rgba(79,70,229,0.08) 0%, transparent 70%)",
            }}
          />

          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold ${
                isDark
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                  : "border-indigo-200 bg-indigo-50 text-indigo-700"
              }`}
            >
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              Trusted by 50,000+ learners worldwide
            </div>

            {/* Heading */}
            <h1
              className={`text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] ${text}`}
            >
              Master your craft with
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {" "}world-class experts
              </span>
            </h1>

            <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${muted}`}>
              Join millions of learners accelerating their careers with cutting-edge
              courses in tech, business, and design.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/auth/register"
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-indigo-600/25"
              >
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/courses"
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all border ${
                  isDark
                    ? "border-[#252840] text-[#e2e8f0] hover:bg-[#1a1d2e]"
                    : "border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                Browse Courses
              </Link>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-6 relative group">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl group-focus-within:bg-indigo-500/30 transition-all duration-300 opacity-50 pointer-events-none" />
              <div
                className={`relative flex items-center p-2 rounded-2xl border shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all ${inputBg}`}
              >
                <Search className={`w-5 h-5 ml-3 shrink-0 ${subtle}`} />
                <input
                  type="text"
                  placeholder="What do you want to learn today?"
                  className="w-full px-4 py-3 bg-transparent outline-none text-sm sm:text-base"
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shrink-0 text-sm shadow-sm shadow-indigo-600/20">
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className={`py-14 px-6 border-y transition-colors duration-300 ${sectionBg} ${divider}`}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1 ${
                    isDark ? "bg-indigo-500/20" : "bg-indigo-50"
                  }`}
                >
                  <Icon className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {value}
                </div>
                <div className={`text-sm font-medium ${muted}`}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ── */}
        <section className={`py-20 px-6 transition-colors duration-300 ${sectionBg}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className={`text-3xl font-extrabold tracking-tight ${text}`}>
                  Explore Categories
                </h2>
                <p className={`mt-1 ${muted}`}>
                  Find courses in the areas that matter most to you.
                </p>
              </div>
              <Link
                href="/courses"
                className="hidden sm:flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:gap-2 transition-all text-sm"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CATEGORIES.map(({ name, icon: Icon, courses, color, href }) => (
                <Link
                  key={name}
                  href={href}
                  className={`group flex flex-col items-start p-7 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${catCard}`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${text}`}>{name}</h3>
                  <p className={`text-sm font-medium ${muted}`}>{courses} Courses</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Popular Courses ── */}
        <section className={`py-20 px-6 transition-colors duration-300 ${bg}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className={`text-3xl font-extrabold tracking-tight ${text}`}>
                  Popular Courses
                </h2>
                <p className={`mt-1 ${muted}`}>
                  Our top-rated courses chosen by thousands of learners.
                </p>
              </div>
              <Link
                href="/courses"
                className="hidden sm:flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:gap-2 transition-all text-sm"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {COURSES.map((course) => {
                const discount = Math.round(
                  (1 -
                    parseFloat(course.price.replace("$", "")) /
                      parseFloat(course.originalPrice.replace("$", ""))) *
                    100
                );
                const Icon = course.icon;
                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className={`group flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${card} ${cardHover}`}
                  >
                    {/* Thumbnail */}
                    <div
                      className={`relative h-44 w-full bg-gradient-to-br ${course.gradient} flex items-center justify-center overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="relative w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isDark
                              ? "bg-white/20 text-white backdrop-blur-sm"
                              : "bg-white/90 text-slate-700"
                          }`}
                        >
                          {course.level}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">
                          {discount}% OFF
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-sm font-bold">{course.rating}</span>
                        </div>
                        <span className={`text-xs ${subtle}`}>
                          ({course.students} students)
                        </span>
                      </div>
                      <h3
                        className={`text-base font-bold leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors ${text}`}
                        style={{ color: isDark ? undefined : undefined }}
                      >
                        {course.title}
                      </h3>
                      <p className={`text-sm mb-5 flex-1 ${muted}`}>
                        by {course.instructor}
                      </p>

                      <div
                        className={`flex items-center justify-between pt-4 border-t ${divider}`}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-extrabold ${text}`}>
                            {course.price}
                          </span>
                          <span className={`text-sm line-through ${subtle}`}>
                            {course.originalPrice}
                          </span>
                        </div>
                        <span
                          className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white ${
                            isDark
                              ? "bg-indigo-500/20 text-indigo-300"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          View Course
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-24 px-6 bg-gradient-to-r from-indigo-600 to-violet-600">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-extrabold text-white">
              Ready to start learning?
            </h2>
            <p className="text-indigo-200 text-lg">
              Join thousands of learners and start your journey today. No prior
              experience required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Get Started – It&apos;s Free
              </Link>
              <Link
                href="/courses"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold text-lg transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
