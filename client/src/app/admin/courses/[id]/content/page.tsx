'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    ChevronDown,
    ChevronRight,
    FileQuestion,
    FileText,
    Layers,
    Loader2,
    PlayCircle,
    Plus,
    RefreshCcw,
    Search,
} from 'lucide-react';

type Lesson = {
    id: number;
    title: string;
    contentType: 'video' | 'text' | 'quiz' | string;
    contentUrl: string | null;
    durationSeconds: number | null;
    isPreview: boolean;
    orderIndex: number;
};

type Section = {
    id: number;
    title: string;
    orderIndex: number;
    lessons?: Lesson[];
};

type Course = {
    id: number;
    title: string;
    slug: string;
    status?: string;
    version?: number;
    sections?: Section[];
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function formatDuration(durationSeconds: number | null) {
    if (!durationSeconds || durationSeconds <= 0) return 'Chưa có thời lượng';

    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    if (minutes === 0) return `${seconds}s`;
    if (seconds === 0) return `${minutes} phút`;

    return `${minutes} phút ${seconds}s`;
}

function getLessonIcon(contentType: string) {
    if (contentType === 'video') {
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
    }

    if (contentType === 'quiz') {
        return <FileQuestion className="h-4 w-4 text-purple-600" />;
    }

    return <FileText className="h-4 w-4 text-emerald-600" />;
}

function getContentTypeLabel(contentType: string) {
    if (contentType === 'video') return 'Video';
    if (contentType === 'quiz') return 'Quiz';
    if (contentType === 'text') return 'Bài đọc';

    return contentType;
}

export default function CourseContentEditorPage() {
    const params = useParams();
    const courseSlug = params?.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [expandedSectionIds, setExpandedSectionIds] = useState<number[]>([]);
    const [keyword, setKeyword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const getAuthHeaders = () => {
        if (typeof window === 'undefined') return {};

        const token =
            localStorage.getItem('elearning_admin_token') ||
            localStorage.getItem('adminToken') ||
            localStorage.getItem('accessToken');

        if (!token) return {};

        return {
            Authorization: `Bearer ${token}`,
        };
    };

    const normalizeCourseResponse = (responseData: unknown): Course | null => {
        const data = responseData as {
            data?: Course | { course?: Course };
            course?: Course;
        };

        if (data?.data && 'course' in data.data && data.data.course) {
            return data.data.course;
        }

        if (data?.course) {
            return data.course;
        }

        if (data?.data && 'id' in data.data) {
            return data.data as Course;
        }

        if (responseData && typeof responseData === 'object' && 'id' in responseData) {
            return responseData as Course;
        }

        return null;
    };

    const loadCourseContent = useCallback(async (showLoading = true) => {
        if (!courseSlug) return;

        if (showLoading) {
            setLoading(true);
            setErrorMessage(null);
        }

        try {
            // TODO: Check API URL
            const response = await axios.get(`${API_BASE_URL}/api/courses/${courseSlug}`, {
                headers: getAuthHeaders(),
            });

            const courseData = normalizeCourseResponse(response.data);
            const sectionData = courseData?.sections || [];

            setCourse(courseData);
            setSections(Array.isArray(sectionData) ? sectionData : []);
            setExpandedSectionIds(
                Array.isArray(sectionData) ? sectionData.map((section) => section.id) : []
            );
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;

                if (status === 404) {
                    setErrorMessage('Không tìm thấy khóa học cần quản lý nội dung.');
                } else if (status === 401) {
                    setErrorMessage(
                        'Từ chối truy cập: Vui lòng đăng nhập bằng tài khoản quản trị.'
                    );
                } else if (status === 403) {
                    setErrorMessage(
                        'Bạn không có quyền quản trị để truy cập chức năng này.'
                    );
                } else {
                    setErrorMessage(
                        error.response?.data?.error ||
                        error.response?.data?.message ||
                        'Không thể tải nội dung khóa học.'
                    );
                }
            } else {
                setErrorMessage('Không thể tải nội dung khóa học.');
            }

            setCourse(null);
            setSections([]);
            setExpandedSectionIds([]);
        } finally {
            setLoading(false);
        }
    }, [courseSlug]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCourseContent(false);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadCourseContent]);

    const toggleSection = (sectionId: number) => {
        setExpandedSectionIds((currentIds) =>
            currentIds.includes(sectionId)
                ? currentIds.filter((id) => id !== sectionId)
                : [...currentIds, sectionId]
        );
    };

    const filterSections = (
        sectionList: Section[],
        searchKeyword: string
    ): Section[] => {
        if (!searchKeyword.trim()) return sectionList;

        const normalizedKeyword = searchKeyword.toLowerCase().trim();

        return sectionList
            .map((section) => {
                const matchedSection = section.title
                    .toLowerCase()
                    .includes(normalizedKeyword);

                const filteredLessons = (section.lessons || []).filter((lesson) =>
                    lesson.title.toLowerCase().includes(normalizedKeyword)
                );

                if (matchedSection || filteredLessons.length > 0) {
                    return {
                        ...section,
                        lessons: matchedSection ? section.lessons || [] : filteredLessons,
                    };
                }

                return null;
            })
            .filter(Boolean) as Section[];
    };

    const filteredSections = filterSections(sections, keyword);
    const totalLessons = sections.reduce(
        (total, section) => total + (section.lessons?.length || 0),
        0
    );

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-slate-100 p-3">
                                <Layers className="h-6 w-6 text-slate-700" />
                            </div>

                            <div>
                                <div className="mb-3">
                                    <Link
                                        href="/admin/courses"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Quay lại danh sách khóa học
                                    </Link>
                                </div>

                                <h1 className="text-2xl font-semibold text-slate-900">
                                    Quản lý nội dung khóa học
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Xem, thêm, sửa, xóa và sắp xếp chương học cùng bài học trong
                                    khóa học.
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Khóa học: {course?.title || courseSlug}
                  </span>

                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {sections.length} chương
                  </span>

                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {totalLessons} bài học
                  </span>

                                    {course?.version !== undefined && (
                                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                      Phiên bản: {course.version}
                    </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm chương
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Cây nội dung khóa học
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Hiển thị cấu trúc chương học và bài học theo dạng Section →
                                Lesson.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadCourseContent()}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-4 w-4" />
                            )}
                            Làm mới
                        </button>
                    </div>

                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Tìm kiếm nội dung
                        </label>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Nhập tên chương hoặc tên bài học cần tìm"
                                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </section>

                {loading && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-500" />
                        <p className="mt-3 text-sm text-slate-500">
                            Đang tải dữ liệu...
                        </p>
                    </section>
                )}

                {!loading && filteredSections.length === 0 && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                        <BookOpen className="mx-auto h-10 w-10 text-slate-400" />

                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            Không có dữ liệu
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Hiện chưa có chương học hoặc bài học nào phù hợp. Bấm Thêm chương
                            để tạo nội dung đầu tiên cho khóa học.
                        </p>
                    </section>
                )}

                {!loading && filteredSections.length > 0 && (
                    <section className="space-y-3">
                        {filteredSections.map((section) => {
                            const isExpanded = expandedSectionIds.includes(section.id);
                            const lessons = section.lessons || [];

                            return (
                                <div
                                    key={section.id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(section.id)}
                                        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-600" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-600" />
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900">
                                                        {section.title}
                                                    </h3>

                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            Thứ tự: {section.orderIndex}
                          </span>

                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {lessons.length} bài học
                          </span>
                                                </div>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    Chương #{section.id}
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                                            {lessons.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                                                    <FileText className="mx-auto h-8 w-8 text-slate-400" />
                                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                                        Chưa có bài học
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Bước tiếp theo sẽ thêm chức năng tạo bài học trong
                                                        chương này.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {lessons.map((lesson) => (
                                                        <div
                                                            key={lesson.id}
                                                            className="rounded-xl border border-slate-200 bg-white p-4"
                                                        >
                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                                                                        {getLessonIcon(lesson.contentType)}
                                                                    </div>

                                                                    <div>
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <h4 className="font-medium text-slate-900">
                                                                                {lesson.title}
                                                                            </h4>

                                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                        {getContentTypeLabel(lesson.contentType)}
                                      </span>

                                                                            {lesson.isPreview && (
                                                                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                          Học thử
                                        </span>
                                                                            )}
                                                                        </div>

                                                                        <p className="mt-1 text-sm text-slate-500">
                                                                            Thứ tự: {lesson.orderIndex} •{' '}
                                                                            {formatDuration(lesson.durationSeconds)}
                                                                        </p>

                                                                        {lesson.contentUrl && (
                                                                            <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                                                                                URL: {lesson.contentUrl}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                )}
            </div>
        </main>
    );
}