"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  PlayCircle, Star, ShieldCheck, Clock, FileText, 
  MonitorPlay, CheckCircle, ChevronDown, Lock 
} from "lucide-react";

export default function CourseDetailPage() {
  const [activeTab, setActiveTab] = useState("description");
  const [couponCode, setCouponCode] = useState("");

  const course = {
    title: "UI/UX Design Masterclass: From Zero to Hero",
    subtitle: "Learn how to design beautiful, engaging user interfaces and experiences with Figma.",
    instructor: "Jane Doe",
    rating: 4.8,
    reviews: 1254,
    students: "12,400",
    price: 89.99,
    originalPrice: 149.99,
    updatedAt: "May 2026",
    language: "English"
  };

  const curriculum = [
    {
      module: "Module 1: Introduction to UI/UX",
      lessons: [
        { title: "What is UI/UX Design?", duration: "10:25", isPreview: true },
        { title: "The Design Thinking Process", duration: "15:40", isPreview: true },
      ]
    },
    {
      module: "Module 2: Figma Basics",
      lessons: [
        { title: "Setting up your workspace", duration: "08:15", isPreview: false },
        { title: "Frames, Shapes, and Colors", duration: "20:00", isPreview: false },
        { title: "Typography in Design", duration: "18:30", isPreview: false },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Placeholder */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">E</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Elevate</span>
          </div>
          <nav className="hidden md:flex gap-6 font-medium text-slate-600">
             <a href="/" className="hover:text-indigo-600 transition-colors">Home</a>
             <a href="#" className="hover:text-indigo-600 transition-colors">My Learning</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column - Course Content */}
          <div className="flex-1 lg:max-w-3xl xl:max-w-4xl space-y-8">
            
            {/* Title & Meta */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {course.title}
              </h1>
              <p className="text-lg text-slate-600">
                {course.subtitle}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-medium text-slate-600">
                <div className="flex items-center text-amber-500">
                  <Star className="w-5 h-5 fill-current mr-1.5" />
                  <span className="font-bold text-slate-900 mr-1">{course.rating}</span>
                  <span className="text-slate-500">({course.reviews} reviews)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-900 font-semibold mr-1">{course.students}</span> students
                </div>
                <div>Created by <span className="text-indigo-600 font-semibold">{course.instructor}</span></div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" /> Last updated {course.updatedAt}
                </div>
              </div>
            </div>

            {/* Video Player Placeholder */}
            <div className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden relative shadow-lg group">
              <div className="absolute inset-0 bg-[url('/course-design.png')] bg-cover bg-center opacity-60 mix-blend-overlay"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all group-hover:scale-110">
                  <PlayCircle className="w-10 h-10 text-white fill-white/20" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white text-sm font-medium">
                <span>Preview this course</span>
                <span>02:45</span>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-slate-200">
              <nav className="flex space-x-8">
                {['description', 'curriculum', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 text-base font-semibold border-b-2 transition-colors ${
                      activeTab === tab 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="py-6 min-h-[400px]">
              
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900">About this course</h3>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      Dive into the world of User Interface and User Experience design. This comprehensive masterclass will take you from complete beginner to confident designer. You'll learn the core principles of visual design, color theory, typography, and how to create intuitive user flows that solve real problems.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 sm:p-8">
                    <h4 className="text-xl font-bold text-slate-900 mb-6">What you'll learn</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Build wireframes, prototypes, and high-fidelity mockups.",
                        "Understand human-centered design principles.",
                        "Master Figma and its advanced features.",
                        "Create a professional portfolio to land jobs."
                      ].map((item, i) => (
                        <div key={i} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-indigo-600 mr-3 shrink-0 mt-0.5" />
                          <span className="text-slate-700 font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Curriculum Tab */}
              {activeTab === 'curriculum' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900">Course Curriculum</h3>
                    <span className="text-slate-500 font-medium hidden sm:inline-block">2 sections • 5 lessons • 1h 12m total length</span>
                  </div>
                  
                  <div className="space-y-4">
                    {curriculum.map((section, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                          <h4 className="font-bold text-slate-900">{section.module}</h4>
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="divide-y divide-slate-100">
                          {section.lessons.map((lesson, lIdx) => (
                            <div key={lIdx} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-3">
                              <div className="flex items-center">
                                {lesson.isPreview ? (
                                  <MonitorPlay className="w-5 h-5 text-indigo-600 mr-4 shrink-0" />
                                ) : (
                                  <Lock className="w-4 h-4 text-slate-400 mr-4 shrink-0" />
                                )}
                                <span className={`font-medium ${lesson.isPreview ? 'text-indigo-600' : 'text-slate-700'}`}>
                                  {lesson.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 ml-9 sm:ml-0">
                                {lesson.isPreview && (
                                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Preview</span>
                                )}
                                <span className="text-slate-500 text-sm font-medium">{lesson.duration}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h3 className="text-2xl font-bold text-slate-900">Student Reviews</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border border-slate-200 rounded-2xl">
                    <div className="text-center w-full sm:w-auto">
                      <div className="text-5xl font-extrabold text-slate-900">{course.rating}</div>
                      <div className="flex justify-center text-amber-500 my-2">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                      </div>
                      <div className="text-sm font-medium text-slate-500">Course Rating</div>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      {/* Fake bars */}
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center text-sm font-medium text-slate-500">
                          <span className="w-12">{star} stars</span>
                          <div className="flex-1 h-2 mx-3 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full" 
                              style={{ width: star === 5 ? '75%' : star === 4 ? '20%' : '2%' }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Single Review Item */}
                  <div className="border-b border-slate-100 pb-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 mr-4">
                        JD
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">John Doe</div>
                        <div className="flex items-center text-xs text-slate-500">
                          <div className="flex text-amber-500 mr-2">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                          </div>
                          2 weeks ago
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-600">
                      This course is amazing! Jane explains everything so clearly. I was able to redesign my company's landing page immediately after finishing module 2. Highly recommended!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0 relative">
            <div className="sticky top-28 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
              
              <div className="mb-6">
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-4xl font-extrabold text-slate-900">${course.price}</span>
                  <span className="text-lg text-slate-400 font-medium line-through mb-1">${course.originalPrice}</span>
                </div>
                <div className="text-sm font-medium text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-full">
                  40% off limited time
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg transition-colors shadow-sm shadow-indigo-600/20">
                  Enroll Now
                </button>
                
                <p className="text-center text-sm font-medium text-slate-500">
                  30-Day Money-Back Guarantee
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <h4 className="font-bold text-slate-900">This course includes:</h4>
                <ul className="space-y-3 text-sm font-medium text-slate-600">
                  <li className="flex items-center"><MonitorPlay className="w-4 h-4 mr-3" /> 12 hours on-demand video</li>
                  <li className="flex items-center"><FileText className="w-4 h-4 mr-3" /> 15 articles & resources</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-3" /> Full lifetime access</li>
                  <li className="flex items-center"><ShieldCheck className="w-4 h-4 mr-3" /> Certificate of completion</li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-900 mb-2">Apply Coupon</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase placeholder:normal-case"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-colors">
                    Apply
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer Placeholder */}
      <footer className="bg-white border-t border-slate-200 py-10 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-slate-500 text-sm font-medium">© 2026 Elevate Inc.</p>
        </div>
      </footer>
    </div>
  );
}
