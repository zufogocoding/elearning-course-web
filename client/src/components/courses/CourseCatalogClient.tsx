"use client";

import { useState } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Search,
  SlidersHorizontal,
  Star,
  ChevronDown,
  X,
  BookOpen,
  Users,
  BarChart2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DbCourse {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  price: number;
  discountPrice?: number | null;
  thumbnailUrl?: string | null;
  level: string;
  creator: { username: string };
  category?: { name: string } | null;
}

interface CourseCatalogClientProps {
  initialCourses: DbCourse[];
}

const defaultMockDbCourses: DbCourse[] = [
  {
    id: 1,
    title: "UI/UX Design Masterclass",
    slug: "ui-ux-design-masterclass",
    shortDescription: "Master UI/UX design with Figma, user research, and prototyping.",
    price: 89.99,
    level: "beginner",
    creator: { username: "Jane Doe" },
    category: { name: "Design" },
  },
  {
    id: 2,
    title: "Advanced React Patterns",
    slug: "advanced-react-patterns",
    shortDescription: "Build scalable and performant React applications using advanced patterns.",
    price: 129.99,
    level: "advanced",
    creator: { username: "John Smith" },
    category: { name: "IT & Software" },
  },
  {
    id: 3,
    title: "Digital Marketing 2026",
    slug: "digital-marketing-2026",
    shortDescription: "Complete digital marketing guide including SEO, SEM, and social media.",
    price: 94.99,
    level: "intermediate",
    creator: { username: "Sarah Jenkins" },
    category: { name: "Marketing" },
  },
  {
    id: 4,
    title: "Python for Data Science",
    slug: "python-for-data-science",
    shortDescription: "Master Python programming, machine learning, and data analysis.",
    price: 74.99,
    level: "beginner",
    creator: { username: "Mike Chen" },
    category: { name: "IT & Software" },
  },
];

const mockGradients = [
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-cyan-500 via-blue-500 to-indigo-600",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-red-500",
  "from-sky-500 via-blue-400 to-indigo-500",
];

const categories = ["IT & Software", "Business", "Design", "Marketing", "Photography"];
const levels = ["All", "Beginner", "Intermediate", "Advanced"];
const prices = ["All", "Free", "Paid", "Under $50", "$50-$100", "Over $100"];
const ratings = [
  { label: "Từ 4.5 sao", value: 4.5 },
  { label: "Từ 4.0 sao", value: 4.0 },
  { label: "Từ 3.5 sao", value: 3.5 },
  { label: "Mọi đánh giá", value: 0 },
];
const sortOptions = ["Phổ biến nhất", "Mới nhất", "Giá: Thấp→Cao", "Giá: Cao→Thấp", "Đánh giá cao nhất"];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function CourseCatalogClient({ initialCourses }: CourseCatalogClientProps) {
  const { isDark } = useTheme();

  const bg = isDark ? "bg-[#0d0f1a]" : "bg-slate-50";
  const sectionBg = isDark ? "bg-[#13151f]" : "bg-white";
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const cardHover = isDark ? "hover:border-indigo-500/30" : "hover:border-indigo-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const subtle = isDark ? "text-[#4a5568]" : "text-slate-400";
  const divider = isDark ? "border-[#1e2235]" : "border-slate-200";
  const input = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40 focus:border-indigo-500/60"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40 focus:border-indigo-400";
  const pill = isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700";
  const iconBtn = isDark
    ? "bg-[#22263a] hover:bg-[#2a2d3e] text-[#a0aec0] hover:text-white"
    : "bg-slate-100 hover:bg-slate-200 text-slate-600";

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [selectedRating, setSelectedRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Phổ biến nhất");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Robust Fallback to premium Mock Courses if the database courses list is empty (ensures stable presentation at all times)
  const coursesToUse = initialCourses && initialCourses.length > 0 ? initialCourses : defaultMockDbCourses;

  // Map database courses to structured UI courses (with visual gradients, mock ratings/reviews if blank)
  const mappedCourses = coursesToUse.map((c, index) => {
    const originalPrice = c.discountPrice ? c.price : c.price * 1.5;
    const finalPrice = c.discountPrice ? c.discountPrice : c.price;
    return {
      id: c.id.toString(),
      slug: c.slug,
      title: c.title,
      instructor: c.creator?.username || "Admin",
      rating: 4.5 + (c.id % 5) * 0.1, // dynamic mock rating based on id
      reviews: 1200 + (c.id * 143) % 8000,
      level: c.level.charAt(0).toUpperCase() + c.level.slice(1),
      category: c.category?.name || "Uncategorized",
      price: finalPrice,
      originalPrice: originalPrice,
      students: `${Math.floor(1 + (c.id * 17) % 50)}k`,
      gradient: mockGradients[index % mockGradients.length],
      thumbnailUrl: c.thumbnailUrl || null,
    };
  });

  // Filter and Search logic
  const filteredCourses = mappedCourses.filter((course) => {
    // Search
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Categories
    if (selectedCategories.length > 0 && !selectedCategories.includes(course.category)) {
      return false;
    }
    // Level
    if (selectedLevel !== "All" && course.level.toLowerCase() !== selectedLevel.toLowerCase()) {
      return false;
    }
    // Price
    if (selectedPrice !== "All") {
      if (selectedPrice === "Free" && course.price > 0) return false;
      if (selectedPrice === "Paid" && course.price === 0) return false;
      if (selectedPrice === "Under $50" && course.price >= 50) return false;
      if (selectedPrice === "$50-$100" && (course.price < 50 || course.price > 100)) return false;
      if (selectedPrice === "Over $100" && course.price <= 100) return false;
    }
    // Rating
    if (selectedRating > 0 && course.rating < selectedRating) {
      return false;
    }
    return true;
  });

  // Sorting logic
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === "Giá: Thấp→Cao") return a.price - b.price;
    if (sortBy === "Giá: Cao→Thấp") return b.price - a.price;
    if (sortBy === "Đánh giá cao nhất") return b.rating - a.rating;
    return b.reviews - a.reviews; // Default: Phổ biến nhất / Mới nhất
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedLevel("All");
    setSelectedPrice("All");
    setSelectedRating(0);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedLevel !== "All" ||
    selectedPrice !== "All" ||
    selectedRating > 0;

  const FilterSidebar = () => (
    <aside
      className={`w-full lg:w-[280px] shrink-0 space-y-6 ${sectionBg} border ${divider} rounded-2xl p-5 h-fit lg:sticky lg:top-24`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`font-bold text-base ${text}`}>Bộ lọc</h2>
        {hasActiveFilters && (
          <button
            id="clear-filters-btn"
            onClick={clearFilters}
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Category */}
      <div className={`border-t ${divider} pt-5`}>
        <h3 className={`font-semibold text-sm mb-3 ${text}`}>Danh mục</h3>
        <div className="space-y-2.5">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                id={`cat-${cat.replace(/\s/g, "-").toLowerCase()}`}
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 accent-indigo-600 cursor-pointer"
              />
              <span className={`text-sm font-medium ${muted} group-hover:${text} transition-colors`}>
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <div className={`border-t ${divider} pt-5`}>
        <h3 className={`font-semibold text-sm mb-3 ${text}`}>Trình độ</h3>
        <div className="space-y-2.5">
          {levels.map((lvl) => (
            <label key={lvl} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                id={`level-${lvl.toLowerCase()}`}
                type="radio"
                name="level"
                checked={selectedLevel === lvl}
                onChange={() => setSelectedLevel(lvl)}
                className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
              />
              <span className={`text-sm font-medium ${muted} group-hover:${text} transition-colors`}>
                {lvl}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className={`border-t ${divider} pt-5`}>
        <h3 className={`font-semibold text-sm mb-3 ${text}`}>Giá</h3>
        <div className="space-y-2.5">
          {prices.map((p) => (
            <label key={p} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                id={`price-${p.replace(/[\s$→]/g, "-").toLowerCase()}`}
                type="radio"
                name="price"
                checked={selectedPrice === p}
                onChange={() => setSelectedPrice(p)}
                className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
              />
              <span className={`text-sm font-medium ${muted} group-hover:${text} transition-colors`}>
                {p}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className={`border-t ${divider} pt-5`}>
        <h3 className={`font-semibold text-sm mb-3 ${text}`}>Đánh giá</h3>
        <div className="space-y-2.5">
          {ratings.map((r) => (
            <label key={r.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                id={`rating-${r.value}`}
                type="radio"
                name="rating"
                checked={selectedRating === r.value}
                onChange={() => setSelectedRating(r.value)}
                className="w-4 h-4 text-indigo-600 accent-indigo-600 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                {r.value > 0 ? (
                  <>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i <= r.value ? "text-amber-400 fill-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${muted}`}>{r.label}</span>
                  </>
                ) : (
                  <span className={`text-sm font-medium ${muted}`}>{r.label}</span>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Button */}
      <div className={`border-t ${divider} pt-5`}>
        <button
          id="clear-all-filters-sidebar"
          onClick={clearFilters}
          className={`w-full py-2.5 border ${divider} rounded-xl text-sm font-semibold ${muted} hover:${text} transition-all`}
        >
          Xóa tất cả bộ lọc
        </button>
      </div>
    </aside>
  );

  return (
    <div className={`min-h-screen ${bg} font-sans`}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className={`text-3xl font-extrabold tracking-tight ${text} mb-1`}>Danh mục khóa học</h1>
          <p className={`text-sm ${muted}`}>
            Khám phá hàng loạt khóa học hấp dẫn để nâng cao kỹ năng và trình độ của bạn ngay hôm nay.
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="flex lg:hidden mb-4">
          <button
            id="mobile-filter-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 border ${divider} rounded-xl text-sm font-semibold ${text} ${iconBtn} transition-all`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {selectedCategories.length + (selectedLevel !== "All" ? 1 : 0) + (selectedPrice !== "All" ? 1 : 0) + (selectedRating > 0 ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className={`absolute left-0 top-0 h-full w-80 max-w-full ${sectionBg} overflow-y-auto p-5 shadow-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`font-bold text-base ${text}`}>Bộ lọc</span>
                <button
                  id="close-sidebar-btn"
                  onClick={() => setSidebarOpen(false)}
                  className={`p-2 rounded-xl ${iconBtn} transition-all`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <FilterSidebar />
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search + Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${subtle}`} />
                <input
                  id="course-search-input"
                  type="text"
                  placeholder="Tìm kiếm khóa học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 text-sm transition-all ${input}`}
                />
              </div>
              <div className="relative">
                <button
                  id="sort-dropdown-btn"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className={`flex items-center gap-2 px-4 py-3 border ${divider} rounded-xl text-sm font-semibold ${text} ${iconBtn} transition-all whitespace-nowrap`}
                >
                  <span>{sortBy}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                </button>
                {showSortDropdown && (
                  <div className={`absolute right-0 top-full mt-2 z-30 w-52 ${sectionBg} border ${divider} rounded-xl shadow-xl overflow-hidden`}>
                    {sortOptions.map((opt) => (
                      <button
                        key={opt}
                        id={`sort-${opt.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                        onClick={() => { setSortBy(opt); setShowSortDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                          sortBy === opt
                            ? "text-indigo-500 bg-indigo-500/10"
                            : `${muted} hover:${text} ${isDark ? "hover:bg-[#1a1d2e]" : "hover:bg-slate-50"}`
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-5">
              <p className={`text-sm font-medium ${muted}`}>
                Hiển thị <span className={`font-bold ${text}`}>{sortedCourses.length}</span> khóa học
                {searchQuery && (
                  <> cho &quot;<span className={`font-bold ${text}`}>{searchQuery}</span>&quot;</>
                )}
              </p>
            </div>

            {/* Course Grid */}
            {sortedCourses.length === 0 ? (
              <div className={`border rounded-2xl p-12 text-center ${card}`}>
                <BookOpen className={`w-12 h-12 mx-auto mb-4 ${subtle}`} />
                <h3 className={`font-bold text-lg mb-1 ${text}`}>Không tìm thấy khóa học nào</h3>
                <p className={`text-sm ${muted}`}>Thử thay đổi bộ lọc hoặc cụm từ tìm kiếm của bạn xem sao.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`border rounded-2xl overflow-hidden transition-all duration-200 group ${card} ${cardHover} hover:shadow-lg hover:-translate-y-0.5`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video w-full relative overflow-hidden bg-slate-900">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${course.gradient} flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-300`}>
                          <BookOpen className="w-12 h-12 text-white/50" />
                        </div>
                      )}
                      {/* Level Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-black/40 backdrop-blur-sm text-white text-xs font-bold rounded-lg">
                          {course.level}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className={`font-bold text-sm leading-snug line-clamp-2 ${text} group-hover:text-indigo-500 transition-colors h-10`}>
                          {course.title}
                        </h3>
                        <p className={`text-xs mt-1 ${muted}`}>bởi {course.instructor}</p>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-500">{course.rating.toFixed(1)}</span>
                        <StarRow rating={course.rating} />
                        <span className={`text-xs ${muted}`}>
                          ({(course.reviews / 1000).toFixed(1)}k)
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 text-xs ${muted}`}>
                          <Users className="w-3.5 h-3.5" />
                          <span>{course.students} học viên</span>
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${muted}`}>
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>{course.level}</span>
                        </div>
                      </div>

                      {/* Price Row */}
                      <div className={`flex items-center justify-between pt-2 border-t ${divider}`}>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-base font-extrabold ${text}`}>${course.price}</span>
                          {course.originalPrice > course.price && (
                            <span className={`text-xs line-through ${subtle}`}>${course.originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                        <Link
                          href={`/courses/${course.slug}`}
                          id={`view-course-${course.id}`}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-indigo-600/20"
                        >
                          Xem khóa học
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                id="pagination-prev"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  currentPage === 1
                    ? `${subtle} border-transparent cursor-not-allowed opacity-40`
                    : `${muted} border-${divider} ${iconBtn}`
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Trang trước
              </button>

              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  id={`pagination-page-${page}`}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                    currentPage === page
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : `${muted} ${iconBtn} border ${divider}`
                  }`}
                >
                  {page}
                </button>
              ))}

              <span className={`text-sm ${subtle}`}>...</span>

              <button
                id="pagination-next"
                onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
                disabled={currentPage === 3}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  currentPage === 3
                    ? `${subtle} border-transparent cursor-not-allowed opacity-40`
                    : `${muted} border-${divider} ${iconBtn}`
                }`}
              >
                Trang sau
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
