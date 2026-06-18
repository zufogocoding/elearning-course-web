'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/layout/AdminLayout';
import { useTheme } from '@/components/ui/ThemeProvider';
import {
    AlertCircle,
    ChevronRight,
    Edit3,
    FolderTree,
    Loader2,
    Plus,
    RefreshCcw,
    Save,
    Search,
    Tags,
    Trash2,
    X,
} from 'lucide-react';

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parentId: number | null;
    children?: Category[];
};

type CategoryFormData = {
    name: string;
    slug: string;
    description: string;
    parentId: string;
};

type CategoryTreeItemProps = {
    category: Category;
    level: number;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
};

type CategoryFormModalProps = {
    title: string;
    description: string;
    formData: CategoryFormData;
    categoryOptions: Category[];
    submitting: boolean;
    submitLabel: string;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => void;
};

type DeleteConfirmModalProps = {
    category: Category;
    submitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const initialFormData: CategoryFormData = {
    name: '',
    slug: '',
    description: '',
    parentId: '',
};

function generateSlug(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function flattenCategories(categoryList: Category[]): Category[] {
    return categoryList.flatMap((category) => [
        category,
        ...flattenCategories(category.children || []),
    ]);
}

function getCategoryAndDescendantIds(category: Category): number[] {
    const children = category.children || [];

    return [
        category.id,
        ...children.flatMap((child) => getCategoryAndDescendantIds(child)),
    ];
}

function CategoryFormModal({
                               title,
                               description,
                               formData,
                               categoryOptions,
                               submitting,
                               submitLabel,
                               onClose,
                               onSubmit,
                               onChange,
                           }: CategoryFormModalProps) {
    const { isDark } = useTheme();
    const bgWhite = isDark ? "bg-[#1a1d2e]" : "bg-white";
    const bgSlate50 = isDark ? "bg-[#13151f]" : "bg-slate-50";
    const bgSlate100 = isDark ? "bg-[#252840]" : "bg-slate-100";
    const borderSlate200 = isDark ? "border-[#252840]" : "border-slate-200";
    const borderSlate300 = isDark ? "border-[#2d314d]" : "border-slate-300";
    const textSlate900 = isDark ? "text-white" : "text-slate-900";
    const textSlate700 = isDark ? "text-[#e2e8f0]" : "text-slate-700";
    const textSlate600 = isDark ? "text-[#cbd5e1]" : "text-slate-600";
    const textSlate500 = isDark ? "text-[#a0aec0]" : "text-slate-500";
    const inputBg = isDark ? "bg-[#13151f] text-white placeholder-slate-500" : "bg-white text-slate-900";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className={`w-full max-w-xl rounded-2xl ${bgWhite} shadow-xl`}>
                <div className={`flex items-center justify-between border-b ${borderSlate200} p-5`}>
                    <div>
                        <h2 className={`text-lg font-semibold ${textSlate900}`}>{title}</h2>
                        <p className={`mt-1 text-sm ${textSlate500}`}>{description}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className={`rounded-lg p-2 ${textSlate500} transition hover:${bgSlate100} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 p-5">
                    <div>
                        <label className={`mb-2 block text-sm font-medium ${textSlate700}`}>
                            Tên danh mục
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={onChange}
                            placeholder="Ví dụ: Lập trình Web"
                            className={`w-full rounded-xl border ${borderSlate300} px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 ${inputBg}`}
                        />
                    </div>

                    <div>
                        <label className={`mb-2 block text-sm font-medium ${textSlate700}`}>
                            Slug
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={onChange}
                            placeholder="lap-trinh-web"
                            className={`w-full rounded-xl border ${borderSlate300} px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 ${inputBg}`}
                        />
                        <p className={`mt-1 text-xs ${textSlate500}`}>
                            Slug sẽ tự tạo theo tên danh mục và có thể chỉnh sửa.
                        </p>
                    </div>

                    <div>
                        <label className={`mb-2 block text-sm font-medium ${textSlate700}`}>
                            Mô tả
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={onChange}
                            rows={3}
                            placeholder="Nhập mô tả ngắn cho danh mục"
                            className={`w-full resize-none rounded-xl border ${borderSlate300} px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 ${inputBg}`}
                        />
                    </div>

                    <div>
                        <label className={`mb-2 block text-sm font-medium ${textSlate700}`}>
                            Danh mục cha
                        </label>
                        <select
                            name="parentId"
                            value={formData.parentId}
                            onChange={onChange}
                            className={`w-full rounded-xl border ${borderSlate300} px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 ${inputBg}`}
                        >
                            <option value="">Không có danh mục cha</option>
                            {categoryOptions.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={`flex items-center justify-end gap-3 border-t ${borderSlate200} pt-4`}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className={`rounded-xl border ${borderSlate300} px-4 py-2.5 text-sm font-medium ${textSlate700} transition hover:${bgSlate50} disabled:cursor-not-allowed disabled:opacity-60 ${inputBg}`}
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

function DeleteConfirmModal({
                                category,
                                submitting,
                                onClose,
                                onConfirm,
                            }: DeleteConfirmModalProps) {
    const { isDark } = useTheme();
    const bgWhite = isDark ? "bg-[#1a1d2e]" : "bg-white";
    const bgSlate50 = isDark ? "bg-[#13151f]" : "bg-slate-50";
    const bgSlate100 = isDark ? "bg-[#252840]" : "bg-slate-100";
    const borderSlate200 = isDark ? "border-[#252840]" : "border-slate-200";
    const borderSlate300 = isDark ? "border-[#2d314d]" : "border-slate-300";
    const textSlate900 = isDark ? "text-white" : "text-slate-900";
    const textSlate700 = isDark ? "text-[#e2e8f0]" : "text-slate-700";
    const textSlate600 = isDark ? "text-[#cbd5e1]" : "text-slate-600";
    const textSlate500 = isDark ? "text-[#a0aec0]" : "text-slate-500";
    const inputBg = isDark ? "bg-[#13151f] text-white placeholder-slate-500" : "bg-white text-slate-900";

    const childCount = category.children?.length || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className={`w-full max-w-md rounded-2xl ${bgWhite} shadow-xl`}>
                <div className={`border-b ${borderSlate200} p-5`}>
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-red-50 p-3">
                            <Trash2 className="h-5 w-5 text-red-600" />
                        </div>

                        <div>
                            <h2 className={`text-lg font-semibold ${textSlate900}`}>
                                Xác nhận xóa danh mục
                            </h2>
                            <p className={`mt-1 text-sm ${textSlate500}`}>
                                Hành động này sẽ xóa mềm danh mục khỏi hệ thống.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    <div className={`rounded-xl border ${borderSlate200} ${bgSlate50} p-4`}>
                        <p className={`text-sm ${textSlate500}`}>Danh mục cần xóa</p>
                        <h3 className={`mt-1 font-semibold ${textSlate900}`}>
                            {category.name}
                        </h3>
                        <p className={`mt-1 text-sm ${textSlate500}`}>/{category.slug}</p>

                        {childCount > 0 && (
                            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                Danh mục này đang có {childCount} danh mục con. Hãy kiểm tra
                                nghiệp vụ backend trước khi xóa.
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className={`rounded-xl border ${borderSlate300} px-4 py-2.5 text-sm font-medium ${textSlate700} transition hover:${bgSlate50} disabled:cursor-not-allowed disabled:opacity-60 ${inputBg}`}
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
                            Xóa danh mục
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CategoryTreeItem({
                              category,
                              level,
                              onEdit,
                              onDelete,
                          }: CategoryTreeItemProps) {
    const { isDark } = useTheme();
    const bgWhite = isDark ? "bg-[#1a1d2e]" : "bg-white";
    const bgSlate50 = isDark ? "bg-[#13151f]" : "bg-slate-50";
    const bgSlate100 = isDark ? "bg-[#252840]" : "bg-slate-100";
    const borderSlate200 = isDark ? "border-[#252840]" : "border-slate-200";
    const borderSlate300 = isDark ? "border-[#2d314d]" : "border-slate-300";
    const textSlate900 = isDark ? "text-white" : "text-slate-900";
    const textSlate700 = isDark ? "text-[#e2e8f0]" : "text-slate-700";
    const textSlate600 = isDark ? "text-[#cbd5e1]" : "text-slate-600";
    const textSlate500 = isDark ? "text-[#a0aec0]" : "text-slate-500";
    const inputBg = isDark ? "bg-[#13151f] text-white placeholder-slate-500" : "bg-white text-slate-900";

    const children = category.children || [];
    const hasChildren = children.length > 0;

    return (
        <div className="space-y-3">
            <div
                className={`rounded-xl border ${borderSlate200} ${bgWhite} p-4 transition hover:${borderSlate300} hover:${bgSlate50}`}
                style={{ marginLeft: `${level * 24}px` }}
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${bgSlate100}`}>
                            {hasChildren ? (
                                <ChevronRight className={`h-4 w-4 ${textSlate500}`} />
                            ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            )}
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`font-medium ${textSlate900}`}>{category.name}</h3>

                                <span className={`rounded-full ${bgSlate100} px-2.5 py-1 text-xs font-medium ${textSlate600}`}>
                  Mã: {category.id}
                </span>

                                {category.parentId === null && (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Danh mục cha
                  </span>
                                )}
                            </div>

                            <p className={`mt-1 text-sm ${textSlate500}`}>/{category.slug}</p>

                            {category.description && (
                                <p className={`mt-2 text-sm ${textSlate600}`}>
                                    {category.description}
                                </p>
                            )}

                            {hasChildren && (
                                <p className={`mt-2 text-xs ${textSlate500}`}>
                                    Có {children.length} danh mục con
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onEdit(category)}
                            className={`inline-flex items-center gap-1 rounded-lg border ${borderSlate300} px-3 py-1.5 text-xs font-medium ${textSlate700} transition hover:${bgWhite}`}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Sửa
                        </button>

                        <button
                            type="button"
                            onClick={() => onDelete(category)}
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
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminCategoriesPage() {
    const { isDark } = useTheme();
    const bgWhite = isDark ? "bg-[#1a1d2e]" : "bg-white";
    const bgSlate50 = isDark ? "bg-[#13151f]" : "bg-slate-50";
    const bgSlate100 = isDark ? "bg-[#252840]" : "bg-slate-100";
    const borderSlate200 = isDark ? "border-[#252840]" : "border-slate-200";
    const borderSlate300 = isDark ? "border-[#2d314d]" : "border-slate-300";
    const textSlate900 = isDark ? "text-white" : "text-slate-900";
    const textSlate700 = isDark ? "text-[#e2e8f0]" : "text-slate-700";
    const textSlate600 = isDark ? "text-[#cbd5e1]" : "text-slate-600";
    const textSlate500 = isDark ? "text-[#a0aec0]" : "text-slate-500";
    const inputBg = isDark ? "bg-[#13151f] text-white placeholder-slate-500" : "bg-white text-slate-900";

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [keyword, setKeyword] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null
    );
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
    const [submitting, setSubmitting] = useState<boolean>(false);

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

    const categoryOptions = flattenCategories(categories);
    const editingBlockedIds = editingCategory
        ? getCategoryAndDescendantIds(editingCategory)
        : [];
    const editCategoryOptions = categoryOptions.filter(
        (category) => !editingBlockedIds.includes(category.id)
    );

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

    const openCreateModal = () => {
        setFormData(initialFormData);
        setEditingCategory(null);
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        if (submitting) return;

        setIsCreateModalOpen(false);
        setFormData(initialFormData);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            parentId: category.parentId ? String(category.parentId) : '',
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        if (submitting) return;

        setIsEditModalOpen(false);
        setEditingCategory(null);
        setFormData(initialFormData);
    };

    const openDeleteModal = (category: Category) => {
        setDeletingCategory(category);
    };

    const closeDeleteModal = () => {
        if (submitting) return;

        setDeletingCategory(null);
    };

    const handleFormChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;

        if (name === 'name') {
            setFormData((currentFormData) => ({
                ...currentFormData,
                name: value,
                slug: generateSlug(value),
            }));
            return;
        }

        setFormData((currentFormData) => ({
            ...currentFormData,
            [name]: value,
        }));
    };

    const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!formData.name.trim()) {
            setErrorMessage('Vui lòng nhập tên danh mục.');
            return;
        }

        if (!formData.slug.trim()) {
            setErrorMessage('Vui lòng nhập slug danh mục.');
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.post(
                `${API_BASE_URL}/api/categories`,
                {
                    name: formData.name.trim(),
                    slug: formData.slug.trim(),
                    description: formData.description.trim() || null,
                    parentId: formData.parentId ? Number(formData.parentId) : null,
                },
                {
                    headers: getAuthHeaders(),
                }
            );

            setIsCreateModalOpen(false);
            setFormData(initialFormData);
            await loadCategories();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể thêm danh mục.'
                );
            } else {
                setErrorMessage('Không thể thêm danh mục.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateCategory = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingCategory) return;

        if (!formData.name.trim()) {
            setErrorMessage('Vui lòng nhập tên danh mục.');
            return;
        }

        if (!formData.slug.trim()) {
            setErrorMessage('Vui lòng nhập slug danh mục.');
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.put(
                `${API_BASE_URL}/api/categories/${editingCategory.id}`,
                {
                    name: formData.name.trim(),
                    slug: formData.slug.trim(),
                    description: formData.description.trim() || null,
                    parentId: formData.parentId ? Number(formData.parentId) : null,
                },
                {
                    headers: getAuthHeaders(),
                }
            );

            setIsEditModalOpen(false);
            setEditingCategory(null);
            setFormData(initialFormData);
            await loadCategories();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể cập nhật danh mục.'
                );
            } else {
                setErrorMessage('Không thể cập nhật danh mục.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!deletingCategory) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await axios.delete(`${API_BASE_URL}/api/categories/${deletingCategory.id}`, {
                headers: getAuthHeaders(),
            });

            setDeletingCategory(null);
            await loadCategories();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể xóa danh mục.'
                );
            } else {
                setErrorMessage('Không thể xóa danh mục.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout><div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className={`rounded-2xl border ${borderSlate200} ${bgWhite} p-6 shadow-sm`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className={`rounded-xl ${bgSlate100} p-3`}>
                                <FolderTree className={`h-6 w-6 ${textSlate700}`} />
                            </div>

                            <div>
                                <h1 className={`text-2xl font-semibold ${textSlate900}`}>
                                    Quản lý danh mục
                                </h1>
                                <p className={`mt-1 text-sm ${textSlate500}`}>
                                    Quản lý cây danh mục khóa học, danh mục cha và danh mục con.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm danh mục
                        </button>
                    </div>
                </section>

                <section className={`rounded-2xl border ${borderSlate200} ${bgWhite} p-6 shadow-sm`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className={`text-base font-semibold ${textSlate900}`}>
                                Danh sách danh mục
                            </h2>
                            <p className={`mt-1 text-sm ${textSlate500}`}>
                                Hiển thị danh mục theo dạng cây phân cấp cha → con.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void loadCategories()}
                            disabled={loading}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border ${borderSlate300} px-4 py-2.5 text-sm font-medium ${textSlate700} transition hover:${bgSlate50} disabled:cursor-not-allowed disabled:opacity-60 ${inputBg}`}
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
                        <label className={`mb-2 block text-sm font-medium ${textSlate700}`}>
                            Tìm kiếm danh mục
                        </label>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Nhập tên hoặc slug danh mục cần tìm"
                                className={`w-full rounded-xl border ${borderSlate300} py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100`}
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
                    <section className={`rounded-2xl border ${borderSlate200} ${bgWhite} p-10 text-center shadow-sm`}>
                        <Loader2 className={`mx-auto h-6 w-6 animate-spin ${textSlate500}`} />
                        <p className={`mt-3 text-sm ${textSlate500}`}>
                            Đang tải dữ liệu...
                        </p>
                    </section>
                )}

                {!loading && filteredCategories.length === 0 && (
                    <section className={`rounded-2xl border border-dashed ${borderSlate300} ${bgWhite} p-10 text-center shadow-sm`}>
                        <Tags className="mx-auto h-10 w-10 text-slate-400" />
                        <h3 className={`mt-4 text-base font-semibold ${textSlate900}`}>
                            Không có dữ liệu
                        </h3>
                        <p className={`mx-auto mt-2 max-w-md text-sm ${textSlate500}`}>
                            Hiện chưa có danh mục nào phù hợp. Bấm Thêm danh mục để tạo danh
                            mục mới cho hệ thống khóa học.
                        </p>
                    </section>
                )}

                {!loading && filteredCategories.length > 0 && (
                    <section className={`rounded-2xl border ${borderSlate200} ${bgWhite} p-6 shadow-sm`}>
                        <div className="space-y-3">
                            {filteredCategories.map((category) => (
                                <CategoryTreeItem
                                    key={category.id}
                                    category={category}
                                    level={0}
                                    onEdit={openEditModal}
                                    onDelete={openDeleteModal}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {isCreateModalOpen && (
                <CategoryFormModal
                    title="Thêm danh mục"
                    description="Tạo danh mục cha hoặc danh mục con cho khóa học."
                    formData={formData}
                    categoryOptions={categoryOptions}
                    submitting={submitting}
                    submitLabel="Lưu danh mục"
                    onClose={closeCreateModal}
                    onSubmit={handleCreateCategory}
                    onChange={handleFormChange}
                />
            )}

            {isEditModalOpen && editingCategory && (
                <CategoryFormModal
                    title="Sửa danh mục"
                    description="Cập nhật tên, slug, mô tả hoặc danh mục cha."
                    formData={formData}
                    categoryOptions={editCategoryOptions}
                    submitting={submitting}
                    submitLabel="Cập nhật danh mục"
                    onClose={closeEditModal}
                    onSubmit={handleUpdateCategory}
                    onChange={handleFormChange}
                />
            )}

            {deletingCategory && (
                <DeleteConfirmModal
                    category={deletingCategory}
                    submitting={submitting}
                    onClose={closeDeleteModal}
                    onConfirm={() => void handleDeleteCategory()}
                />
            )}
        </div></AdminLayout>
    );
}