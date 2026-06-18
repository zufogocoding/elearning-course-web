"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import { useTheme } from "@/components/ui/ThemeProvider";
import { api } from "@/lib/api";
import Link from "next/link";
import { 
  ArrowLeft, BookOpen, Settings, LayoutDashboard, FileText, Loader2, Save 
} from "lucide-react";

import BasicInfoTab from "@/components/admin/courses/BasicInfoTab";
import CurriculumTab from "@/components/admin/courses/CurriculumTab";
import SettingsTab from "@/components/admin/courses/SettingsTab";

export default function UnifiedCourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = parseInt(resolvedParams.id, 10);
  
  const { isDark } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"basic" | "curriculum" | "settings">("basic");
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
      }
    } catch (error) {
      console.error("Failed to load course", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (updatedData: any) => {
    try {
      const res = await api.put(`/api/courses/${courseId}`, updatedData);
      if (res.ok) {
        fetchCourse(); // Reload
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-rose-500">
          Không tìm thấy khóa học.
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: "basic", label: "Thông tin cơ bản", icon: LayoutDashboard },
    { id: "curriculum", label: "Giáo trình", icon: BookOpen },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b shrink-0 ${isDark ? 'border-[#1e2235] bg-[#13151f]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/courses")}
              className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-[#22263a] text-[#a0aec0]' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {course.title}
              </h1>
              <p className={`text-xs ${isDark ? 'text-[#7a87a1]' : 'text-slate-500'}`}>
                Trình quản lý khóa học
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Link
                href={`/admin/courses/${course.slug}/content`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  isDark ? 'bg-[#22263a] text-[#e2e8f0] border-[#252840] hover:border-[#3a3f55]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                Quản lý nội dung bài học
              </Link>
          </div>
        </div>

        {/* Tab Nav */}
        <div className={`px-6 flex gap-6 border-b shrink-0 ${isDark ? 'border-[#1e2235] bg-[#13151f]' : 'border-slate-200 bg-white'}`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-semibold transition-all ${
                  isActive 
                    ? 'border-indigo-500 text-indigo-500' 
                    : `border-transparent ${isDark ? 'text-[#7a87a1] hover:text-[#e2e8f0]' : 'text-slate-500 hover:text-slate-900'}`
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'bg-[#0d0f1a]' : 'bg-[#f4f6fb]'}`}>
          {activeTab === "basic" && <BasicInfoTab course={course} onUpdate={handleUpdateCourse} />}
          {activeTab === "curriculum" && <CurriculumTab courseId={course.id} />}
          {activeTab === "settings" && <SettingsTab course={course} onUpdate={handleUpdateCourse} />}
        </div>
      </div>
    </AdminLayout>
  );
}
