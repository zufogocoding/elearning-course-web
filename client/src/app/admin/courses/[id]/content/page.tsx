'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    BookOpen,
    ChevronDown,
    FileText,
    Layers,
    Loader2,
    Plus,
    Search,
} from 'lucide-react';

export default function CourseContentEditorPage() {
    const params = useParams();
    const courseId = params?.id as string;

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

                                <p className="mt-2 text-xs text-slate-400">
                                    Mã khóa học hiện tại: {courseId}
                                </p>
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
                    </div>

                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Tìm kiếm nội dung
                        </label>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Nhập tên chương hoặc tên bài học cần tìm"
                                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
                        <BookOpen className="mx-auto h-10 w-10 text-slate-400" />

                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            Khung quản lý nội dung đã sẵn sàng
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Bước tiếp theo sẽ gọi API lấy cây nội dung khóa học từ backend và
                            hiển thị danh sách chương học cùng bài học.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 p-4 text-left">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                    <ChevronDown className="h-4 w-4" />
                                    Chương học
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    Hiển thị theo nhóm có thể thu gọn hoặc mở rộng.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 text-left">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                    <FileText className="h-4 w-4" />
                                    Bài học
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    Hiển thị bên trong từng chương với loại nội dung tương ứng.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 text-left">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                    <Loader2 className="h-4 w-4" />
                                    Trạng thái
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    Bổ sung loading, empty state và thông báo lỗi API ở bước sau.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}