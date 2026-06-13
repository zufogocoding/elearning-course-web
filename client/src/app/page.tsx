"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
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
  ShieldCheck,
  Zap,
  Globe,
  Quote
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useTheme } from "@/components/ui/ThemeProvider";
import { Spinner } from "@/components/ui/Spinner";

// Interfaces
interface Category {
  id: number;
  name: string;
  slug: string;
  coursesCount?: number;
  // TODO: Map icon based on category in actual implementation
}

interface Course {
  id: number;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number;
  level: string;
  instructorName?: string;
  rating?: number;
  studentsCount?: number;
}

interface Stat {
  label: string;
  value: string;
}

export default function Home() {
  const { isDark } = useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Fetch Categories
    // TODO: Check API URL
    axios.get('http://localhost:5000/api/categories')
      .then(res => {
        setCategories(res.data?.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingCategories(false));

    // Fetch Popular Courses
    // TODO: Check API URL
    axios.get('http://localhost:5000/api/courses?sort=popular&limit=3')
      .then(res => {
        setCourses(res.data?.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingCourses(false));

    // Fetch Stats
    // TODO: Check API URL
    axios.get('http://localhost:5000/api/courses/stats')
      .then(res => {
        setStats(res.data?.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingStats(false));
  }, []);

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const text = isDark ? "text-white" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const subtle = isDark ? "text-[#4a5568]" : "text-slate-400";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";

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
        {/* ── Hero Section (Split Layout) ── */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 px-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-full lg:w-1/2 h-[600px] -z-10 pointer-events-none flex justify-center items-start opacity-60">
            <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen opacity-40 ${isDark ? 'bg-indigo-600/40' : 'bg-indigo-400/20'} animate-pulse`} style={{ top: '10%', right: '10%' }} />
            <div className={`absolute w-80 h-80 rounded-full blur-[100px] mix-blend-screen opacity-40 ${isDark ? 'bg-violet-600/30' : 'bg-violet-400/20'} animate-pulse`} style={{ top: '30%', left: '10%', animationDelay: '1s' }} />
          </div>

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
            {/* Left Column: Text */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
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
                Được tin tưởng bởi hơn 50.000 học viên
              </div>

              <h1 className={`text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] ${text}`}>
                Nâng tầm kỹ năng cùng
                <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x inline-block">
                  {" "}chuyên gia hàng đầu
                </span>
              </h1>

              <p className={`text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed ${muted}`}>
                Học tập trực tuyến theo cách của bạn. Trải nghiệm nền tảng giáo dục thông minh với các khóa học thực chiến về công nghệ, kinh doanh và thiết kế.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4 pt-4">
                <Link
                  href="/auth/register"
                  className="group relative flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] overflow-hidden w-full sm:w-auto justify-center"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Bắt đầu học miễn phí
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </Link>
                <Link
                  href="/courses"
                  className={`group flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all border shadow-sm w-full sm:w-auto justify-center ${
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
            </div>

            {/* Right Column: Hero Image Mockup */}
            <div className="flex-1 relative w-full flex justify-center animate-in slide-in-from-bottom-2 duration-700">
               <div className={`relative w-full max-w-lg lg:max-w-xl aspect-square rounded-3xl overflow-hidden shadow-2xl border ${isDark ? "border-[#252840]/60 shadow-indigo-900/20" : "border-slate-200 shadow-xl"}`}>
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent z-10 pointer-events-none rounded-3xl" />
                 <img 
                   src="/elearning_dashboard_mockup.png" 
                   alt="Elevate Dashboard Preview" 
                   className="w-full h-full object-cover rounded-3xl transform hover:scale-105 transition-transform duration-700"
                 />
               </div>
               
               {/* Floating elements */}
               <div className={`absolute -bottom-6 -left-6 p-4 rounded-2xl border shadow-xl backdrop-blur-xl animate-[bounce_4s_infinite] ${isDark ? "bg-[#1a1d2e]/90 border-[#252840]" : "bg-white/90 border-slate-200"}`}>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                     <ShieldCheck className="w-5 h-5 text-green-500" />
                   </div>
                   <div>
                     <p className={`text-sm font-bold ${text}`}>Chứng chỉ độc bản</p>
                     <p className={`text-xs ${muted}`}>Được xác thực 100%</p>
                   </div>
                 </div>
               </div>

               <div className={`absolute -top-6 -right-6 p-4 rounded-2xl border shadow-xl backdrop-blur-xl animate-[bounce_5s_infinite] ${isDark ? "bg-[#1a1d2e]/90 border-[#252840]" : "bg-white/90 border-slate-200"}`} style={{ animationDelay: '1s' }}>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                     <Monitor className="w-5 h-5 text-indigo-500" />
                   </div>
                   <div>
                     <p className={`text-sm font-bold ${text}`}>Đa nền tảng</p>
                     <p className={`text-xs ${muted}`}>Học mọi lúc mọi nơi</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* ── Stats Section ── */}
        <section className={`relative py-12 px-6 z-10`}>
          <div className="max-w-5xl mx-auto">
            {loadingStats ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : stats.length === 0 ? (
              <p className={`text-center py-8 ${muted}`}>Không có dữ liệu</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                  <div key={idx} className={`flex flex-col items-center text-center gap-3 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${card} ${cardHover}`}>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-violet-600 mb-1">
                      {stat.value}
                    </div>
                    <div className={`text-sm font-semibold ${muted}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Features / Why Choose Us ── */}
        <section className={`py-24 px-6 transition-colors duration-300 ${sectionBg}`}>
           <div className="max-w-7xl mx-auto text-center">
             <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${text}`}>
                Tại sao chọn Elevate?
             </h2>
             <p className={`text-lg ${muted} max-w-2xl mx-auto mb-16`}>
                Chúng tôi không chỉ cung cấp khóa học, chúng tôi cung cấp một giải pháp học tập toàn diện và trung thực.
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {[
                  { title: "Chống gian lận thông minh", desc: "Hệ thống theo dõi tiến độ (checkpoint) cứ mỗi 10 giây. Đảm bảo học viên thực sự nắm bắt nội dung chứ không thể bấm 'hoàn thành' ảo.", icon: ShieldCheck, color: "text-rose-500", bg: "bg-rose-500/10" },
                  { title: "Chứng chỉ độc bản", desc: "Mỗi chứng chỉ đều có mã UUID riêng biệt và được lưu trữ an toàn. Nhà tuyển dụng có thể xác thực ngay lập tức trên hệ thống.", icon: Award, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                  { title: "Truy cập không giới hạn", desc: "Tài nguyên học tập, video stream chất lượng cao luôn sẵn sàng 24/7. Học mọi lúc, mọi nơi trên mọi thiết bị bạn có.", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map((feature, i) => (
                  <div key={i} className={`p-8 rounded-3xl border ${card} ${cardHover} transition-all duration-300`}>
                     <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6`}>
                        <feature.icon className={`w-7 h-7 ${feature.color}`} />
                     </div>
                     <h3 className={`text-xl font-bold mb-3 ${text}`}>{feature.title}</h3>
                     <p className={`${muted} leading-relaxed`}>{feature.desc}</p>
                  </div>
                ))}
             </div>
           </div>
        </section>

        {/* ── Categories ── */}
        <section className={`py-24 px-6 transition-colors duration-300 ${bg}`}>
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

            {loadingCategories ? (
              <div className="flex justify-center py-12"><Spinner size={48} /></div>
            ) : categories.length === 0 ? (
              <div className={`text-center py-12 border-2 border-dashed rounded-3xl ${divider} ${muted}`}>
                <p className="text-lg font-medium">Không có dữ liệu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/courses?cat=${cat.slug}`}
                    className={`group relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${catCard}`}
                  >
                    <div className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <BookOpen className="w-7 h-7 text-white drop-shadow-md" />
                    </div>
                    <h3 className={`relative z-10 text-xl font-bold mb-2 group-hover:text-indigo-500 transition-colors ${text}`}>{cat.name}</h3>
                    {cat.coursesCount !== undefined && (
                      <p className={`relative z-10 text-sm font-semibold ${muted}`}>{cat.coursesCount} Khóa học</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Popular Courses ── */}
        <section className={`py-24 px-6 transition-colors duration-300 ${sectionBg}`}>
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

            {loadingCourses ? (
              <div className="flex justify-center py-12"><Spinner size={48} /></div>
            ) : courses.length === 0 ? (
              <div className={`text-center py-12 border-2 border-dashed rounded-3xl ${divider} ${muted}`}>
                <p className="text-lg font-medium">Không có dữ liệu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course) => {
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className={`group flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-2 relative ${card} ${cardHover}`}
                    >
                      <div className="p-3 pb-0">
                        <div className={`relative h-48 w-full rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 flex items-center justify-center overflow-hidden shadow-inner`}>
                          {course.discountPrice && (
                            <div className="absolute top-4 right-4 z-10">
                              <span className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-rose-500/30">
                                Đang giảm giá
                              </span>
                            </div>
                          )}
                          <Play className="w-12 h-12 text-white/50 group-hover:text-white transition-colors duration-300" />
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${isDark ? "bg-[#22263a] text-indigo-300" : "bg-indigo-50 text-indigo-600"}`}>
                            {course.level}
                          </span>
                        </div>
                        
                        <h3 className={`text-xl font-bold leading-snug mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${text}`}>
                          {course.title}
                        </h3>
                        
                        <div className={`mt-auto flex items-center justify-between pt-5 border-t ${divider}`}>
                          <div className="flex flex-col">
                             {course.discountPrice ? (
                                <>
                                  <span className={`text-sm line-through font-medium ${subtle}`}>${course.price}</span>
                                  <span className={`text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none mt-0.5`}>${course.discountPrice}</span>
                                </>
                             ) : (
                                <span className={`text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none mt-0.5`}>${course.price}</span>
                             )}
                          </div>
                          
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white ${isDark ? "bg-[#22263a] text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                            <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className={`py-24 px-6 transition-colors duration-300 ${bg} overflow-hidden relative`}>
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
           <div className="max-w-7xl mx-auto">
             <div className="text-center mb-16">
                <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-4 ${text}`}>
                  Học viên nói gì về Elevate
                </h2>
                <p className={`text-lg ${muted} max-w-2xl mx-auto`}>
                  Hàng ngàn người đã thay đổi sự nghiệp của họ. Bạn cũng có thể.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: "Nguyễn Văn A", role: "Frontend Developer", quote: "Nhờ khóa học React tại Elevate, tôi đã đậu phỏng vấn vào một tập đoàn công nghệ lớn. Các bài giảng rất chi tiết và thực tế." },
                  { name: "Trần Thị B", role: "UX Designer", quote: "Cơ chế chống tua video khiến tôi bắt buộc phải học tập trung. Chứng chỉ từ nền tảng này được công ty tôi đánh giá rất cao." },
                  { name: "Lê Minh C", role: "Marketing Specialist", quote: "Giao diện web cực kỳ đẹp và mượt mà. Tôi có thể học mọi lúc mọi nơi trên cả điện thoại và máy tính mà không bị gián đoạn." },
                ].map((t, i) => (
                  <div key={i} className={`p-8 rounded-3xl border relative ${card}`}>
                     <Quote className={`absolute top-6 right-6 w-10 h-10 opacity-10 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                     <div className="flex items-center gap-1 mb-6 text-amber-500">
                        {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
                     </div>
                     <p className={`text-lg ${text} font-medium mb-8 italic`}>"{t.quote}"</p>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                           {t.name.charAt(0)}
                        </div>
                        <div>
                           <div className={`font-bold ${text}`}>{t.name}</div>
                           <div className={`text-sm ${muted}`}>{t.role}</div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x opacity-90"></div>
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Bạn đã sẵn sàng nâng cấp sự nghiệp?
            </h2>
            <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto">
              Tham gia cùng hàng ngàn học viên và bắt đầu hành trình của bạn ngay hôm nay. Truy cập trọn đời, học mọi lúc mọi nơi.
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
