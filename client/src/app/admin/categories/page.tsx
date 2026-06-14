'use client';

import { useEffect, useState } from 'react';
import {
    FolderTree,
    Loader2,
    Plus,
    RefreshCcw,
    Search,
    Tags,
} from 'lucide-react';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parentId: number | null;
    children?: Category[];
};

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [keyword, setKeyword] = useState<string>('');

    useEffect(() => {
        setLoading(false);
    }, []);

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(keyword.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-slate-100 p-3">
                                <FolderTree className="h-6 w-6 text-slate-700" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    Quản lý danh mục
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Quản lý cây danh mục khóa học, danh mục cha và danh mục con.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm danh mục
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Danh sách danh mục
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Hiển thị danh mục theo dạng cây phân cấp cha → con.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Làm mới
                        </button>
                    </div>

                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Tìm kiếm danh mục
                        </label>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Nhập tên danh mục cần tìm"
                                className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>
                    </div>
                </section>

                {loading && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-500" />
                        <p className="mt-3 text-sm text-slate-500">
                            Đang tải dữ liệu...
                        </p>
                    </section>
                )}

                {!loading && filteredCategories.length === 0 && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                        <Tags className="mx-auto h-10 w-10 text-slate-400" />
                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            Không có dữ liệu
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Hiện chưa có danh mục nào. Bấm Thêm danh mục để tạo danh mục mới
                            cho hệ thống khóa học.
                        </p>
                    </section>
                )}

                {!loading && filteredCategories.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="space-y-3">
                            {filteredCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="rounded-xl border border-slate-200 p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-900">
                                                {category.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                /{category.slug}
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Mã: {category.id}
                    </span>
                                    </div>

                                    {category.description && (
                                        <p className="mt-3 text-sm text-slate-600">
                                            {category.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}