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
  { name: "CNTT & Phần mềm", icon: Monitor, courses: "1,200+", color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20", href: "/courses?cat=it" },
  { name: "Kinh doanh", icon: Briefcase, courses: "850+", color: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/20", href: "/courses?cat=business" },
  { name: "Thiết kế", icon: Palette, courses: "600+", color: "from-pink-500 to-rose-600", shadow: "shadow-pink-500/20", href: "/courses?cat=design" },
  { name: "Tiếp thị", icon: Megaphone, courses: "400+", color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20", href: "/courses?cat=marketing" },
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
    level: "Cơ bản",
    gradient: "from-purple-500 via-violet-600 to-indigo-600",
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
    level: "Nâng cao",
    gradient: "from-blue-500 via-cyan-600 to-teal-700",
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
    level: "Trung cấp",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    icon: Megaphone,
  },
];

const STATS = [
  { value: "50K+", label: "Học viên tích cực", icon: Users },
  { value: "300+", label: "Khóa học chuyên sâu", icon: BookOpen },
  { value: "98%", label: "Tỷ lệ hài lòng", icon: Award },
  { value: "24/7", label: "Truy cập học tập", icon: Clock },
];

export default function Home() {
  const { isDark } = useTheme();

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const text = isDark ? "text-white" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const subtle = isDark ? "text-[#4a5568]" : "text-slate-400";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";

  // Card styles with glassmorphism touches
  const card = isDark ? "bg-[#1a1d2e]/80 backdrop-blur-xl border-[#252840]" : "bg-white border-slate-200/80";
  const cardHover = isDark
    ? "hover:border-indigo-500/50 hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.15)]"
    : "hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10";
  
  const catCard = isDark
    ? "bg-[#1a1d2e] border-[#252840] hover:border-indigo-500/40 hover:bg-[#1f2336]"
    : "bg-white border-slate-200 hover:border-indigo-300";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg} ${text} overflow-x-hidden`}>
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className="relative pt-24 pb-32 px-6 overflow-hidden">
          {/* Dynamic Background Mesh */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] -z-10 pointer-events-none flex justify-center items-start opacity-60">
            <div className={`absolute w-96 h-96 rounded-full blur-[100px] mix-blend-screen opacity-50 ${isDark ? 'bg-indigo-600/30' : 'bg-indigo-400/20'} animate-pulse`} style={{ top: '10%', left: '20%' }} />
            <div className={`absolute w-80 h-80 rounded-full blur-[90px] mix-blend-screen opacity-50 ${isDark ? 'bg-violet-600/20' : 'bg-violet-400/20'} animate-pulse`} style={{ top: '20%', right: '20%', animationDelay: '1s' }} />
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold shadow-sm transition-transform hover:scale-105 cursor-default ${
                isDark
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-indigo-500/10"
                  : "border-indigo-200 bg-white text-indigo-700 shadow-indigo-500/5"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Được tin tưởng bởi hơn 50.000 học viên trên toàn thế giới
            </div>

            {/* Heading */}
            <h1
              className={`text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.15] ${text}`}
            >
              Làm chủ kỹ năng của bạn cùng
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x inline-block">
                {" "}các chuyên gia hàng đầu
              </span>
            </h1>

            <p className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${muted}`}>
              Tham gia cùng hàng triệu học viên thúc đẩy sự nghiệp của họ bằng các
              khóa học tiên tiến về công nghệ, kinh doanh và thiết kế.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/auth/register"
                className="group relative flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Bắt đầu học miễn phí
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </Link>
              <Link
                href="/courses"
                className={`group flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all border shadow-sm ${
                  isDark
                    ? "border-[#3a3f55] bg-[#13151f]/50 backdrop-blur-md text-[#e2e8f0] hover:bg-[#1a1d2e] hover:border-indigo-500/50"
                    : "border-slate-200 bg-white/50 backdrop-blur-md text-slate-700 hover:bg-white hover:border-indigo-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-[#22263a] group-hover:bg-indigo-500/20 group-hover:text-indigo-400" : "bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                Duyệt khóa học
              </Link>
            </div>

            {/* Search Bar - Glassmorphism */}
            <div className="max-w-2xl mx-auto mt-8 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div
                className={`relative flex items-center p-2 rounded-2xl border shadow-xl backdrop-blur-xl transition-all ${
                  isDark 
                    ? "bg-[#13151f]/70 border-[#252840] text-[#e2e8f0] focus-within:border-indigo-500/50" 
                    : "bg-white/80 border-slate-200/60 text-slate-700 focus-within:border-indigo-400 focus-within:bg-white"
                }`}
              >
                <Search className={`w-5 h-5 ml-4 shrink-0 transition-colors ${isDark ? "text-[#7a87a1] group-focus-within:text-indigo-400" : "text-slate-400 group-focus-within:text-indigo-600"}`} />
                <input
                  type="text"
                  placeholder="Hôm nay bạn muốn học gì?"
                  className="w-full px-4 py-3.5 bg-transparent outline-none text-sm sm:text-base placeholder-slate-400 dark:placeholder-[#4a5568]"
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shrink-0 text-sm shadow-md shadow-indigo-600/20 active:scale-95">
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className={`relative py-16 px-6 z-10 -mt-10`}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className={`flex flex-col items-center text-center gap-3 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${card} ${cardHover}`}>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
                    isDark ? "bg-[#22263a] shadow-black/50" : "bg-indigo-50 shadow-indigo-500/10"
                  }`}
                >
                  <Icon className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-violet-600 mb-1">
                    {value}
                  </div>
                  <div className={`text-sm font-semibold ${muted}`}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ── */}
        <section className={`py-20 px-6 transition-colors duration-300 ${sectionBg}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div className="space-y-2">
                <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${text}`}>
                  Khám phá danh mục
                </h2>
                <p className={`text-lg ${muted} max-w-xl`}>
                  Tìm các khóa học trong những lĩnh vực quan trọng nhất đối với sự nghiệp của bạn.
                </p>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:gap-3 transition-all bg-indigo-50 dark:bg-indigo-500/10 px-5 py-2.5 rounded-full"
              >
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {CATEGORIES.map(({ name, icon: Icon, courses, color, shadow, href }) => (
                <Link
                  key={name}
                  href={href}
                  className={`group relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${catCard}`}
                >
                  {/* Subtle Background Gradient Glow */}
                  <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${color} rounded-full blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`} />
                  
                  <div
                    className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg ${shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white drop-shadow-md" />
                  </div>
                  <h3 className={`relative z-10 text-xl font-bold mb-2 group-hover:text-indigo-500 transition-colors ${text}`}>{name}</h3>
                  <p className={`relative z-10 text-sm font-semibold ${muted}`}>{courses} Khóa học</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Popular Courses ── */}
        <section className={`py-24 px-6 transition-colors duration-300 ${bg}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div className="space-y-2">
                <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${text}`}>
                  Khóa học nổi bật
                </h2>
                <p className={`text-lg ${muted} max-w-xl`}>
                  Các khóa học được đánh giá cao nhất do hàng nghìn học viên lựa chọn.
                </p>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:gap-3 transition-all bg-indigo-50 dark:bg-indigo-500/10 px-5 py-2.5 rounded-full"
              >
                Khám phá thêm <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                    className={`group flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-2 relative ${card} ${cardHover}`}
                  >
                    {/* Thumbnail - Enhanced Gradient Layout */}
                    <div className="p-3 pb-0">
                      <div
                        className={`relative h-48 w-full rounded-2xl bg-gradient-to-br ${course.gradient} flex items-center justify-center overflow-hidden shadow-inner`}
                      >
                        {/* Decorative floating shapes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2"></div>
                        
                        <div className="relative z-10 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                          <Icon className="w-10 h-10 text-white drop-shadow-sm" />
                        </div>
                        <div className="absolute top-4 left-4 z-10">
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                              isDark
                                ? "bg-black/40 text-white backdrop-blur-md border border-white/10"
                                : "bg-white/90 text-slate-800 shadow-sm"
                            }`}
                          >
                            {course.level}
                          </span>
                        </div>
                        <div className="absolute top-4 right-4 z-10">
                          <span className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-rose-500/30">
                            GIẢM {discount}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold">{course.rating}</span>
                        </div>
                        <span className={`text-sm font-medium ${subtle}`}>
                          {course.students} học viên
                        </span>
                      </div>
                      
                      <h3
                        className={`text-xl font-bold leading-snug mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${text}`}
                      >
                        {course.title}
                      </h3>
                      
                      <div className={`flex items-center gap-2 mb-6 ${muted}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-indigo-500`}>
                          {course.instructor.charAt(0)}
                        </div>
                        <p className="text-sm font-medium">
                          Bởi <span className={text}>{course.instructor}</span>
                        </p>
                      </div>

                      <div
                        className={`mt-auto flex items-center justify-between pt-5 border-t ${divider}`}
                      >
                        <div className="flex flex-col">
                          <span className={`text-sm line-through font-medium ${subtle}`}>
                            {course.originalPrice}
                          </span>
                          <span className={`text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none mt-0.5`}>
                            {course.price}
                          </span>
                        </div>
                        
                        {/* Hover Action Button */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white ${isDark ? "bg-[#22263a] text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                          <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-24 px-6 relative overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x opacity-90"></div>
          
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Bạn đã sẵn sàng nâng cấp sự nghiệp?
            </h2>
            <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto">
              Tham gia cùng hàng ngàn học viên và bắt đầu hành trình của bạn ngay hôm nay.
              Truy cập trọn đời, học mọi lúc mọi nơi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-extrabold text-lg hover:scale-105 transition-transform shadow-xl shadow-black/10"
              >
                Bắt đầu học ngay – Miễn phí
              </Link>
              <Link
                href="/courses"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
              >
                Duyệt toàn bộ khóa học
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
