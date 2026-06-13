import { use } from "react";
import CourseDetailClient from "@/components/courses/CourseDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchCourseDetail(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/courses/${slug}`, {
      cache: "no-store", // SSR: ensures request-time data fetching
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.error("Error fetching course detail during SSR:", error);
    return null;
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseDetail = await fetchCourseDetail(id);
  return <CourseDetailClient courseDetail={courseDetail} />;
}
