import Image from "next/image";
import { Search, Monitor, Briefcase, Palette, Megaphone, Star, ChevronRight } from "lucide-react";

export default function Home() {
  const categories = [
    { name: "IT & Software", icon: <Monitor className="w-6 h-6" />, courses: "1,200+ Courses" },
    { name: "Business", icon: <Briefcase className="w-6 h-6" />, courses: "850+ Courses" },
    { name: "Design", icon: <Palette className="w-6 h-6" />, courses: "600+ Courses" },
    { name: "Marketing", icon: <Megaphone className="w-6 h-6" />, courses: "400+ Courses" },
  ];

  const popularCourses = [
    {
      id: 1,
      title: "UI/UX Design Masterclass: From Zero to Hero",
      instructor: "Jane Doe",
      price: "$89.99",
      rating: 4.8,
      students: "12k",
      thumbnail: "/course-design.png",
    },
    {
      id: 2,
      title: "Advanced React Patterns and Performance",
      instructor: "John Smith",
      price: "$129.99",
      rating: 4.9,
      students: "8.5k",
      thumbnail: "/course-react.png",
    },
    {
      id: 3,
      title: "Complete Digital Marketing Strategy 2026",
      instructor: "Sarah Jenkins",
      price: "$94.99",
      rating: 4.7,
      students: "20k",
      thumbnail: "/course-marketing.png",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header / Navbar Placeholder */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">E</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Elevate</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Courses</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Community</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log in</button>
            <button className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-sm">Sign up</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-6 overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Master your craft with <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
                world-class experts
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Join millions of learners accelerating their careers with cutting-edge courses in tech, business, and design.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-10 relative group">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl group-hover:bg-indigo-500/30 transition-all duration-300 opacity-50"></div>
              <div className="relative flex items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <Search className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
                <input 
                  type="text" 
                  placeholder="What do you want to learn today?" 
                  className="w-full px-4 py-3 text-slate-700 bg-transparent outline-none placeholder:text-slate-400 text-lg"
                />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shrink-0 shadow-sm shadow-indigo-600/20">
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 px-6 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Explore Categories</h2>
              <a href="#" className="flex items-center text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <div 
                  key={category.name} 
                  className="group flex flex-col items-start p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer"
                >
                  <div className="p-4 rounded-2xl bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 mb-6">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-900">{category.name}</h3>
                  <p className="text-slate-500 font-medium">{category.courses}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Courses Section */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-12 text-slate-900">Popular Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularCourses.map((course) => (
                <div 
                  key={course.id} 
                  className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    {course.thumbnail ? (
                      <Image 
                        src={course.thumbnail} 
                        alt={course.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3 text-sm font-medium">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-current mr-1" />
                        <span>{course.rating}</span>
                        <span className="text-slate-400 ml-1">({course.students})</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 flex-1">By {course.instructor}</p>
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                      <span className="text-2xl font-extrabold text-slate-900">{course.price}</span>
                      <button className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-semibold transition-colors duration-300">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Placeholder */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="font-bold text-slate-900">Elevate</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Elevate E-learning Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
