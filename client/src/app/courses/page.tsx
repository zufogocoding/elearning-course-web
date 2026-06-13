import CourseCatalogClient from "@/components/courses/CourseCatalogClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchCourses() {
  try {
    const res = await fetch(`${API_BASE}/api/courses`, {
      cache: "no-store", // SSR: ensures request-time data fetching
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching courses during SSR:", error);
    return [];
  }
}

export default async function CourseCatalogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const courses = await fetchCourses();
  const categoryParam = searchParams?.category;
  const initialCategory = typeof categoryParam === 'string' ? categoryParam : undefined;

  return <CourseCatalogClient initialCourses={courses} initialCategory={initialCategory} />;
}
