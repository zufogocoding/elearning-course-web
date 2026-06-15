'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
    AlertCircle,
    ChevronRight,
    Edit3,
    FolderTree,
    Loader2,
    Plus,
    RefreshCcw,
    Search,
    Tags,
    Trash2,
} from 'lucide-react';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parentId: number | null;
    children?: Category[];
};

type CategoryTreeItemProps = {
    category: Category;
    level: number;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function CategoryTreeItem({ category, level }: CategoryTreeItemProps) {
    const children = category.children || [];
    const hasChildren = children.length > 0;

    return (
        <div className="space-y-3">
            <div
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                style={{ marginLeft: `${level * 24}px` }}
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            {hasChildren ? (
                                <ChevronRight className="h-4 w-4 text-slate-500" />
                            ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            )}
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-medium text-slate-900">{category.name}</h3>

                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  Mã: {category.id}
                </span>

                                {category.parentId === null && (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Danh mục cha
                  </span>
                                )}
                            </div>

                            <p className="mt-1 text-sm text-slate-500">/{category.slug}</p>

                            {category.description && (
                                <p className="mt-2 text-sm text-slate-600">
                                    {category.description}
                                </p>
                            )}

                            {hasChildren && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Có {children.length} danh mục con
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Sửa
                        </button>

                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Xóa
                        </button>
                    </div>
                </div>
            </div>

            {hasChildren && (
                <div className="space-y-3">
                    {children.map((child) => (
                        <CategoryTreeItem
                            key={child.id}
                            category={child}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [keyword, setKeyword] = useState<string>('');
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

    const loadCategories = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
            setErrorMessage(null);
        }

        try {
            // TODO: Check API URL
            const response = await axios.get(`${API_BASE_URL}/api/categories`, {
                headers: getAuthHeaders(),
            });

            const responseData =
                response.data?.data?.categories ||
                response.data?.categories ||
                response.data?.data ||
                response.data ||
                [];

            setCategories(Array.isArray(responseData) ? responseData : []);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;

                if (status === 401) {
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
                        'Không thể tải danh sách danh mục.'
                    );
                }
            } else {
                setErrorMessage('Không thể tải danh sách danh mục.');
            }

            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCategories(false);
    }, [loadCategories]);

    const filterCategoryTree = (
        categoryList: Category[],
        searchKeyword: string
    ): Category[] => {
        if (!searchKeyword.trim()) return categoryList;

        const normalizedKeyword = searchKeyword.toLowerCase().trim();

        return categoryList
            .map((category) => {
                const matched =
                    category.name.toLowerCase().includes(normalizedKeyword) ||
                    category.slug.toLowerCase().includes(normalizedKeyword);

                const filteredChildren = filterCategoryTree(
                    category.children || [],
                    searchKeyword
                );

                if (matched || filteredChildren.length > 0) {
                    return {
                        ...category,
                        children: filteredChildren,
                    };
                }

                return null;
            })
            .filter(Boolean) as Category[];
    };

    const filteredCategories = filterCategoryTree(categories, keyword);

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
                            onClick={() => void loadCategories()}
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
                            Tìm kiếm danh mục
                        </label>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Nhập tên hoặc slug danh mục cần tìm"
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

                {!loading && filteredCategories.length === 0 && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                        <Tags className="mx-auto h-10 w-10 text-slate-400" />
                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            Không có dữ liệu
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Hiện chưa có danh mục nào phù hợp. Bấm Thêm danh mục để tạo danh
                            mục mới cho hệ thống khóa học.
                        </p>
                    </section>
                )}

                {!loading && filteredCategories.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="space-y-3">
                            {filteredCategories.map((category) => (
                                <CategoryTreeItem
                                    key={category.id}
                                    category={category}
                                    level={0}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}