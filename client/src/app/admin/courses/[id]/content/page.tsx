'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import {
    AlertCircle,
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    BookOpen,
    ChevronDown,
    ChevronRight,
    Edit3,
    FileQuestion,
    FileText,
    Layers,
    Loader2,
    PlayCircle,
    Plus,
    RefreshCcw,
    Save,
    Search,
    Trash2,
    X,
} from 'lucide-react';

type LessonContentType = 'video' | 'text' | 'quiz';

type Lesson = {
    id: number;
    title: string;
    contentType: LessonContentType | string;
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

type SectionFormData = {
    title: string;
    orderIndex: string;
};

type LessonFormData = {
    title: string;
    contentType: LessonContentType;
    contentUrl: string;
    durationSeconds: string;
    isPreview: boolean;
    orderIndex: string;
};

type SectionFormModalProps = {
    title: string;
    description: string;
    formData: SectionFormData;
    submitting: boolean;
    submitLabel: string;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type LessonFormModalProps = {
    title: string;
    description: string;
    formData: LessonFormData;
    submitting: boolean;
    submitLabel: string;
    sectionTitle: string;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => void;
};

type DeleteSectionConfirmModalProps = {
    section: Section;
    submitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

type DeleteLessonConfirmModalProps = {
    lesson: Lesson;
    sectionTitle: string;
    submitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const initialSectionFormData: SectionFormData = {
    title: '',
    orderIndex: '',
};

const initialLessonFormData: LessonFormData = {
    title: '',
    contentType: 'video',
    contentUrl: '',
    durationSeconds: '',
    isPreview: false,
    orderIndex: '',
};

function getAuthHeaders() {
    if (typeof window === 'undefined') return {};

    const token =
        localStorage.getItem('elearning_admin_token') ||
        localStorage.getItem('adminToken') ||
        localStorage.getItem('accessToken');

    if (!token) return {};

    return {
        Authorization: `Bearer ${token}`,
    };
}

function isCourse(value: unknown): value is Course {
    return Boolean(value && typeof value === 'object' && 'id' in value);
}

function normalizeCourseResponse(responseData: unknown): Course | null {
    const root = responseData as {
        data?: unknown;
        course?: Course;
    };

    if (isCourse(root?.course)) return root.course;
    if (isCourse(root?.data)) return root.data;

    const nestedData = root?.data as { course?: Course };

    if (isCourse(nestedData?.course)) return nestedData.course;
    if (isCourse(responseData)) return responseData;

    return null;
}

function sortLessons(lessons: Lesson[] = []) {
    return [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
}

function sortSections(sections: Section[] = []) {
    return [...sections]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((section) => ({
            ...section,
            lessons: sortLessons(section.lessons || []),
        }));
}

function formatDuration(durationSeconds: number | null) {
    if (!durationSeconds || durationSeconds <= 0) return 'Chưa có thời lượng';

    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    if (minutes === 0) return `${seconds}s`;
    if (seconds === 0) return `${minutes} phút`;

    return `${minutes} phút ${seconds}s`;
}

function getNextSectionOrderIndex(sections: Section[]) {
    if (sections.length === 0) return 1;

    return Math.max(...sections.map((section) => section.orderIndex || 0)) + 1;
}

function getNextLessonOrderIndex(section: Section | null) {
    const lessons = section?.lessons || [];

    if (lessons.length === 0) return 1;

    return Math.max(...lessons.map((lesson) => lesson.orderIndex || 0)) + 1;
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

function getLessonPayloadFromForm(
    formData: LessonFormData,
    sectionId?: number
) {
    return {
        sectionId,
        title: formData.title.trim(),
        contentType: formData.contentType,
        contentUrl: formData.contentUrl.trim() || null,
        durationSeconds: formData.durationSeconds.trim()
            ? Number(formData.durationSeconds)
            : null,
        isPreview: formData.isPreview,
        orderIndex: Number(formData.orderIndex),
    };
}

function getLessonPayloadFromLesson(lesson: Lesson, sectionId: number) {
    return {
        sectionId,
        title: lesson.title,
        contentType: lesson.contentType,
        contentUrl: lesson.contentUrl,
        durationSeconds: lesson.durationSeconds,
        isPreview: lesson.isPreview,
        orderIndex: lesson.orderIndex,
    };
}

function SectionFormModal({
                              title,
                              description,
                              formData,
                              submitting,
                              submitLabel,
                              onClose,
                              onSubmit,
                              onChange,
                          }: SectionFormModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-200 p-5">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 p-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Tên chương
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={onChange}
                            placeholder="Ví dụ: Giới thiệu khóa học"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Thứ tự hiển thị
                        </label>
                        <input
                            type="number"
                            name="orderIndex"
                            value={formData.orderIndex}
                            onChange={onChange}
                            min={1}
                            placeholder="Ví dụ: 1"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function LessonFormModal({
                             title,
                             description,
                             formData,
                             submitting,
                             submitLabel,
                             sectionTitle,
                             onClose,
                             onSubmit,
                             onChange,
                         }: LessonFormModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-200 p-5">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                            Chương: {sectionTitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 p-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Tên bài học
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={onChange}
                            placeholder="Ví dụ: Bài 1 - Tổng quan"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Loại nội dung
                            </label>
                            <select
                                name="contentType"
                                value={formData.contentType}
                                onChange={onChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            >
                                <option value="video">Video</option>
                                <option value="text">Bài đọc</option>
                                <option value="quiz">Quiz</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Thứ tự hiển thị
                            </label>
                            <input
                                type="number"
                                name="orderIndex"
                                value={formData.orderIndex}
                                onChange={onChange}
                                min={1}
                                placeholder="Ví dụ: 1"
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Đường dẫn nội dung
                        </label>
                        <input
                            type="text"
                            name="contentUrl"
                            value={formData.contentUrl}
                            onChange={onChange}
                            placeholder="Ví dụ: https://youtube.com/... hoặc đường dẫn tài liệu"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Thời lượng giây
                        </label>
                        <input
                            type="number"
                            name="durationSeconds"
                            value={formData.durationSeconds}
                            onChange={onChange}
                            min={0}
                            placeholder="Ví dụ: 600"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />
                    </div>

                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                        <div>
                            <p className="text-sm font-medium text-slate-900">
                                Cho phép học thử
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Bật tùy chọn này nếu bài học được xem miễn phí trước khi mua
                                khóa học.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            name="isPreview"
                            checked={formData.isPreview}
                            onChange={onChange}
                            className="h-5 w-5 rounded border-slate-300"
                        />
                    </label>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteSectionConfirmModal({
                                       section,
                                       submitting,
                                       onClose,
                                       onConfirm,
                                   }: DeleteSectionConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="border-b border-slate-200 p-5">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-red-50 p-3">
                            <Trash2 className="h-5 w-5 text-red-600" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Xóa chương học
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Thao tác này sẽ xóa mềm chương học khỏi khóa học.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <p className="text-sm text-slate-600">
                        Bạn có chắc chắn muốn xóa chương:
                    </p>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{section.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                            Chương #{section.id} • Thứ tự {section.orderIndex}
                        </p>
                    </div>

                    <p className="mt-3 text-sm text-red-600">
                        Nếu khóa học đã xuất bản, backend sẽ tự động tăng phiên bản nội
                        dung.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Xóa chương
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteLessonConfirmModal({
                                      lesson,
                                      sectionTitle,
                                      submitting,
                                      onClose,
                                      onConfirm,
                                  }: DeleteLessonConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="border-b border-slate-200 p-5">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-red-50 p-3">
                            <Trash2 className="h-5 w-5 text-red-600" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Xóa bài học
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Thao tác này sẽ xóa mềm bài học khỏi chương.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <p className="text-sm text-slate-600">
                        Bạn có chắc chắn muốn xóa bài học:
                    </p>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{lesson.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                            Chương: {sectionTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Bài #{lesson.id} • Thứ tự {lesson.orderIndex} •{' '}
                            {getContentTypeLabel(lesson.contentType)}
                        </p>
                    </div>

                    <p className="mt-3 text-sm text-red-600">
                        Nếu khóa học đã xuất bản, backend sẽ tự động tăng phiên bản nội
                        dung.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Hủy
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Xóa bài học
                    </button>
                </div>
            </div>
        </div>
    );
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

    const [isCreateSectionModalOpen, setIsCreateSectionModalOpen] =
        useState<boolean>(false);
    const [isEditSectionModalOpen, setIsEditSectionModalOpen] =
        useState<boolean>(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [deletingSection, setDeletingSection] = useState<Section | null>(null);

    const [isCreateLessonModalOpen, setIsCreateLessonModalOpen] =
        useState<boolean>(false);
    const [isEditLessonModalOpen, setIsEditLessonModalOpen] =
        useState<boolean>(false);
    const [selectedSectionForLesson, setSelectedSectionForLesson] =
        useState<Section | null>(null);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
    const [deleteLessonSectionTitle, setDeleteLessonSectionTitle] =
        useState<string>('');

    const [sectionFormData, setSectionFormData] = useState<SectionFormData>(
        initialSectionFormData
    );
    const [lessonFormData, setLessonFormData] = useState<LessonFormData>(
        initialLessonFormData
    );
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [reordering, setReordering] = useState<boolean>(false);

    const loadCourseContent = useCallback(
        async (showLoading = true) => {
            if (!courseSlug) return;

            if (showLoading) {
                setLoading(true);
                setErrorMessage(null);
            }

            try {
                const response = await axios.get(
                    `${API_BASE_URL}/api/courses/${courseSlug}`,
                    {
                        headers: getAuthHeaders(),
                    }
                );

                const courseData = normalizeCourseResponse(response.data);
                const sectionData = sortSections(courseData?.sections || []);

                setCourse(courseData);
                setSections(Array.isArray(sectionData) ? sectionData : []);
                setExpandedSectionIds(
                    Array.isArray(sectionData)
                        ? sectionData.map((section) => section.id)
                        : []
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
        },
        [courseSlug]
    );

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

    const openCreateSectionModal = () => {
        setSectionFormData({
            title: '',
            orderIndex: String(getNextSectionOrderIndex(sections)),
        });
        setEditingSection(null);
        setIsCreateSectionModalOpen(true);
    };

    const closeCreateSectionModal = () => {
        if (submitting) return;

        setIsCreateSectionModalOpen(false);
        setSectionFormData(initialSectionFormData);
    };

    const openEditSectionModal = (section: Section) => {
        setEditingSection(section);
        setSectionFormData({
            title: section.title,
            orderIndex: String(section.orderIndex),
        });
        setIsEditSectionModalOpen(true);
    };

    const closeEditSectionModal = () => {
        if (submitting) return;

        setIsEditSectionModalOpen(false);
        setEditingSection(null);
        setSectionFormData(initialSectionFormData);
    };

    const openDeleteSectionModal = (section: Section) => {
        setDeletingSection(section);
    };

    const closeDeleteSectionModal = () => {
        if (submitting) return;

        setDeletingSection(null);
    };

    const openCreateLessonModal = (section: Section) => {
        setSelectedSectionForLesson(section);
        setEditingLesson(null);
        setLessonFormData({
            ...initialLessonFormData,
            orderIndex: String(getNextLessonOrderIndex(section)),
        });
        setIsCreateLessonModalOpen(true);
    };

    const closeCreateLessonModal = () => {
        if (submitting) return;

        setIsCreateLessonModalOpen(false);
        setSelectedSectionForLesson(null);
        setLessonFormData(initialLessonFormData);
    };

    const openEditLessonModal = (section: Section, lesson: Lesson) => {
        setSelectedSectionForLesson(section);
        setEditingLesson(lesson);
        setLessonFormData({
            title: lesson.title,
            contentType:
                lesson.contentType === 'text' || lesson.contentType === 'quiz'
                    ? lesson.contentType
                    : 'video',
            contentUrl: lesson.contentUrl || '',
            durationSeconds:
                lesson.durationSeconds !== null && lesson.durationSeconds !== undefined
                    ? String(lesson.durationSeconds)
                    : '',
            isPreview: Boolean(lesson.isPreview),
            orderIndex: String(lesson.orderIndex),
        });
        setIsEditLessonModalOpen(true);
    };

    const closeEditLessonModal = () => {
        if (submitting) return;

        setIsEditLessonModalOpen(false);
        setSelectedSectionForLesson(null);
        setEditingLesson(null);
        setLessonFormData(initialLessonFormData);
    };

    const openDeleteLessonModal = (section: Section, lesson: Lesson) => {
        setDeletingLesson(lesson);
        setDeleteLessonSectionTitle(section.title);
    };

    const closeDeleteLessonModal = () => {
        if (submitting) return;

        setDeletingLesson(null);
        setDeleteLessonSectionTitle('');
    };

    const handleSectionFormChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setSectionFormData((currentFormData) => ({
            ...currentFormData,
            [name]: value,
        }));
    };

    const handleLessonFormChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const target = event.target;
        const { name, value } = target;

        if (target instanceof HTMLInputElement && name === 'isPreview') {
            setLessonFormData((currentFormData) => ({
                ...currentFormData,
                isPreview: target.checked,
            }));
            return;
        }

        setLessonFormData((currentFormData) => ({
            ...currentFormData,
            [name]: value,
        }));
    };

    const validateSectionForm = () => {
        if (!sectionFormData.title.trim()) {
            setErrorMessage('Vui lòng nhập tên chương.');
            return false;
        }

        if (!sectionFormData.orderIndex.trim()) {
            setErrorMessage('Vui lòng nhập thứ tự hiển thị.');
            return false;
        }

        if (Number(sectionFormData.orderIndex) < 1) {
            setErrorMessage('Thứ tự hiển thị phải lớn hơn hoặc bằng 1.');
            return false;
        }

        return true;
    };

    const validateLessonForm = () => {
        if (!lessonFormData.title.trim()) {
            setErrorMessage('Vui lòng nhập tên bài học.');
            return false;
        }

        if (!lessonFormData.contentType) {
            setErrorMessage('Vui lòng chọn loại nội dung.');
            return false;
        }

        if (!lessonFormData.orderIndex.trim()) {
            setErrorMessage('Vui lòng nhập thứ tự hiển thị của bài học.');
            return false;
        }

        if (Number(lessonFormData.orderIndex) < 1) {
            setErrorMessage('Thứ tự hiển thị của bài học phải lớn hơn hoặc bằng 1.');
            return false;
        }

        if (
            lessonFormData.durationSeconds.trim() &&
            Number(lessonFormData.durationSeconds) < 0
        ) {
            setErrorMessage('Thời lượng bài học không được nhỏ hơn 0.');
            return false;
        }

        return true;
    };

    const handleCreateSection = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!course?.id) {
            setErrorMessage('Không tìm thấy khóa học để thêm chương.');
            return;
        }

        if (!validateSectionForm()) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.post(
                `${API_BASE_URL}/api/content/sections`,
                {
                    courseId: course.id,
                    title: sectionFormData.title.trim(),
                    orderIndex: Number(sectionFormData.orderIndex),
                },
                {
                    headers: getAuthHeaders(),
                }
            );

            setIsCreateSectionModalOpen(false);
            setSectionFormData(initialSectionFormData);
            await loadCourseContent();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể thêm chương.'
                );
            } else {
                setErrorMessage('Không thể thêm chương.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateSection = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingSection) return;

        if (!validateSectionForm()) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.put(
                `${API_BASE_URL}/api/content/sections/${editingSection.id}`,
                {
                    title: sectionFormData.title.trim(),
                    orderIndex: Number(sectionFormData.orderIndex),
                },
                {
                    headers: getAuthHeaders(),
                }
            );

            setIsEditSectionModalOpen(false);
            setEditingSection(null);
            setSectionFormData(initialSectionFormData);
            await loadCourseContent();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể cập nhật chương.'
                );
            } else {
                setErrorMessage('Không thể cập nhật chương.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSection = async () => {
        if (!deletingSection) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.delete(
                `${API_BASE_URL}/api/content/sections/${deletingSection.id}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            setDeletingSection(null);
            await loadCourseContent();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể xóa chương.'
                );
            } else {
                setErrorMessage('Không thể xóa chương.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateLesson = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedSectionForLesson) {
            setErrorMessage('Không tìm thấy chương để thêm bài học.');
            return;
        }

        if (!validateLessonForm()) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.post(
                `${API_BASE_URL}/api/content/lessons`,
                getLessonPayloadFromForm(lessonFormData, selectedSectionForLesson.id),
                {
                    headers: getAuthHeaders(),
                }
            );

            setIsCreateLessonModalOpen(false);
            setSelectedSectionForLesson(null);
            setLessonFormData(initialLessonFormData);
            await loadCourseContent();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể thêm bài học.'
                );
            } else {
                setErrorMessage('Không thể thêm bài học.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateLesson = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingLesson || !selectedSectionForLesson) return;

        if (!validateLessonForm()) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.put(
                `${API_BASE_URL}/api/content/lessons/${editingLesson.id}`,
                getLessonPayloadFromForm(lessonFormData, selectedSectionForLesson.id),
                {
                    headers: getAuthHeaders(),
                }
            );

            setIsEditLessonModalOpen(false);
            setSelectedSectionForLesson(null);
            setEditingLesson(null);
            setLessonFormData(initialLessonFormData);
            await loadCourseContent();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể cập nhật bài học.'
                );
            } else {
                setErrorMessage('Không thể cập nhật bài học.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteLesson = async () => {
        if (!deletingLesson) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.delete(
                `${API_BASE_URL}/api/content/lessons/${deletingLesson.id}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            setDeletingLesson(null);
            setDeleteLessonSectionTitle('');
            await loadCourseContent();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể xóa bài học.'
                );
            } else {
                setErrorMessage('Không thể xóa bài học.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleMoveSection = async (sectionIndex: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

        if (targetIndex < 0 || targetIndex >= sections.length) return;

        const currentSection = sections[sectionIndex];
        const targetSection = sections[targetIndex];

        setReordering(true);
        setErrorMessage(null);

        try {
            await Promise.all([
                axios.put(
                    `${API_BASE_URL}/api/content/sections/${currentSection.id}`,
                    {
                        title: currentSection.title,
                        orderIndex: targetSection.orderIndex,
                    },
                    {
                        headers: getAuthHeaders(),
                    }
                ),
                axios.put(
                    `${API_BASE_URL}/api/content/sections/${targetSection.id}`,
                    {
                        title: targetSection.title,
                        orderIndex: currentSection.orderIndex,
                    },
                    {
                        headers: getAuthHeaders(),
                    }
                ),
            ]);

            await loadCourseContent();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể sắp xếp chương.'
                );
            } else {
                setErrorMessage('Không thể sắp xếp chương.');
            }
        } finally {
            setReordering(false);
        }
    };

    const handleMoveLesson = async (
        section: Section,
        lessonIndex: number,
        direction: 'up' | 'down'
    ) => {
        const lessons = section.lessons || [];
        const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;

        if (targetIndex < 0 || targetIndex >= lessons.length) return;

        const currentLesson = lessons[lessonIndex];
        const targetLesson = lessons[targetIndex];

        setReordering(true);
        setErrorMessage(null);

        try {
            await Promise.all([
                axios.put(
                    `${API_BASE_URL}/api/content/lessons/${currentLesson.id}`,
                    {
                        ...getLessonPayloadFromLesson(currentLesson, section.id),
                        orderIndex: targetLesson.orderIndex,
                    },
                    {
                        headers: getAuthHeaders(),
                    }
                ),
                axios.put(
                    `${API_BASE_URL}/api/content/lessons/${targetLesson.id}`,
                    {
                        ...getLessonPayloadFromLesson(targetLesson, section.id),
                        orderIndex: currentLesson.orderIndex,
                    },
                    {
                        headers: getAuthHeaders(),
                    }
                ),
            ]);

            await loadCourseContent();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể sắp xếp bài học.'
                );
            } else {
                setErrorMessage('Không thể sắp xếp bài học.');
            }
        } finally {
            setReordering(false);
        }
    };

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
                            onClick={openCreateSectionModal}
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
                            disabled={loading || reordering}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading || reordering ? (
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
                            const sectionIndex = sections.findIndex(
                                (item) => item.id === section.id
                            );
                            const isExpanded = expandedSectionIds.includes(section.id);
                            const lessons = section.lessons || [];

                            return (
                                <div
                                    key={section.id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4 p-5 transition hover:bg-slate-50">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(section.id)}
                                            className="flex flex-1 items-start gap-3 text-left"
                                        >
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
                                        </button>

                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void handleMoveSection(sectionIndex, 'up')}
                                                disabled={reordering || sectionIndex <= 0}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleMoveSection(sectionIndex, 'down')
                                                }
                                                disabled={
                                                    reordering ||
                                                    sectionIndex < 0 ||
                                                    sectionIndex >= sections.length - 1
                                                }
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openCreateLessonModal(section)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Thêm bài
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openEditSectionModal(section)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                                Sửa
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openDeleteSectionModal(section)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Xóa
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                                            {lessons.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                                                    <FileText className="mx-auto h-8 w-8 text-slate-400" />
                                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                                        Chưa có bài học
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Bấm Thêm bài để tạo bài học đầu tiên trong chương
                                                        này.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {lessons.map((lesson, lessonIndex) => (
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
                                        {getContentTypeLabel(
                                            lesson.contentType
                                        )}
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

                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            void handleMoveLesson(
                                                                                section,
                                                                                lessonIndex,
                                                                                'up'
                                                                            )
                                                                        }
                                                                        disabled={reordering || lessonIndex <= 0}
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            void handleMoveLesson(
                                                                                section,
                                                                                lessonIndex,
                                                                                'down'
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            reordering ||
                                                                            lessonIndex >= lessons.length - 1
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openEditLessonModal(section, lesson)
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                                    >
                                                                        <Edit3 className="h-3.5 w-3.5" />
                                                                        Sửa
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openDeleteLessonModal(section, lesson)
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                        Xóa
                                                                    </button>
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

            {isCreateSectionModalOpen && (
                <SectionFormModal
                    title="Thêm chương"
                    description="Tạo chương mới cho nội dung khóa học."
                    formData={sectionFormData}
                    submitting={submitting}
                    submitLabel="Lưu chương"
                    onClose={closeCreateSectionModal}
                    onSubmit={handleCreateSection}
                    onChange={handleSectionFormChange}
                />
            )}

            {isEditSectionModalOpen && editingSection && (
                <SectionFormModal
                    title="Sửa chương"
                    description="Cập nhật tên chương và thứ tự hiển thị."
                    formData={sectionFormData}
                    submitting={submitting}
                    submitLabel="Cập nhật chương"
                    onClose={closeEditSectionModal}
                    onSubmit={handleUpdateSection}
                    onChange={handleSectionFormChange}
                />
            )}

            {deletingSection && (
                <DeleteSectionConfirmModal
                    section={deletingSection}
                    submitting={submitting}
                    onClose={closeDeleteSectionModal}
                    onConfirm={handleDeleteSection}
                />
            )}

            {isCreateLessonModalOpen && selectedSectionForLesson && (
                <LessonFormModal
                    title="Thêm bài học"
                    description="Tạo bài học mới trong chương đã chọn."
                    formData={lessonFormData}
                    submitting={submitting}
                    submitLabel="Lưu bài học"
                    sectionTitle={selectedSectionForLesson.title}
                    onClose={closeCreateLessonModal}
                    onSubmit={handleCreateLesson}
                    onChange={handleLessonFormChange}
                />
            )}

            {isEditLessonModalOpen && selectedSectionForLesson && editingLesson && (
                <LessonFormModal
                    title="Sửa bài học"
                    description="Cập nhật thông tin bài học."
                    formData={lessonFormData}
                    submitting={submitting}
                    submitLabel="Cập nhật bài học"
                    sectionTitle={selectedSectionForLesson.title}
                    onClose={closeEditLessonModal}
                    onSubmit={handleUpdateLesson}
                    onChange={handleLessonFormChange}
                />
            )}

            {deletingLesson && (
                <DeleteLessonConfirmModal
                    lesson={deletingLesson}
                    sectionTitle={deleteLessonSectionTitle}
                    submitting={submitting}
                    onClose={closeDeleteLessonModal}
                    onConfirm={handleDeleteLesson}
                />
            )}
        </main>
    );
}