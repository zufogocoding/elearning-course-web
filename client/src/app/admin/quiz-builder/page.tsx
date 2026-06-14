'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    AlertCircle,
    BookOpen,
    Clock,
    FileQuestion,
    Loader2,
    RefreshCcw,
    Search,
    Target,
} from 'lucide-react';

type QuestionOption = {
    id: number;
    questionId: number;
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
};

type Question = {
    id: number;
    quizId: number;
    questionText: string;
    questionType: 'single_choice' | 'multiple_choice' | 'true_false';
    orderIndex: number;
    questionOptions: QuestionOption[];
};

type Quiz = {
    id: number;
    lessonId: number;
    title: string;
    description: string | null;
    passingScore: number;
    timeLimitMinutes: number | null;
    maxAttempts: number;
    questions: Question[];
};

type LessonInfo = {
    id: number;
    title: string;
    contentType: string;
    sectionId: number;
    courseId: number;
};

type QuizResponseData = {
    lesson: LessonInfo;
    quizzes: Quiz[];
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function QuizBuilderPage() {
    const [lessonId, setLessonId] = useState('');
    const [lesson, setLesson] = useState<LessonInfo | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        setLoading(false);
    }, []);

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

    const handleLoadQuiz = async () => {
        if (!lessonId.trim()) {
            setErrorMessage('Vui lòng nhập mã bài học.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        setLesson(null);
        setQuizzes([]);
        setSelectedQuiz(null);

        try {
            // TODO: Check API URL
            const response = await axios.get(
                `${API_BASE_URL}/api/content/quizzes/${lessonId}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const responseData: QuizResponseData = response.data?.data;

            setLesson(responseData?.lesson || null);
            setQuizzes(responseData?.quizzes || []);
            setSelectedQuiz(responseData?.quizzes?.[0] || null);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể tải dữ liệu quiz.'
                );
            } else {
                setErrorMessage('Không thể tải dữ liệu quiz.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-slate-100 p-3">
                            <BookOpen className="h-6 w-6 text-slate-700" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Quản lý Quiz
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Tạo, cập nhật câu hỏi và đáp án cho bài học trong khóa học.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Mã bài học
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="number"
                            value={lessonId}
                            onChange={(event) => setLessonId(event.target.value)}
                            placeholder="Nhập lessonId, ví dụ: 1"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />

                        <button
                            type="button"
                            onClick={handleLoadQuiz}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            Tải quiz
                        </button>
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

                {!loading && !lesson && quizzes.length === 0 && !errorMessage && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <p className="text-sm text-slate-500">
                            Không có dữ liệu. Vui lòng nhập mã bài học và bấm tải quiz.
                        </p>
                    </section>
                )}

                {!loading && lesson && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Bài học</p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">
                            {lesson.title}
                        </h2>
                        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                            <div className="rounded-xl bg-slate-50 p-3">
                                Mã bài học: <span className="font-medium">{lesson.id}</span>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                Mã chương: <span className="font-medium">{lesson.sectionId}</span>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                Mã khóa học: <span className="font-medium">{lesson.courseId}</span>
                            </div>
                        </div>
                    </section>
                )}

                {!loading && lesson && quizzes.length === 0 && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <FileQuestion className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-3 text-sm text-slate-500">
                            Không có dữ liệu quiz cho bài học này.
                        </p>
                    </section>
                )}

                {!loading && quizzes.length > 0 && (
                    <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
                        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                Danh sách quiz
                            </h3>

                            <div className="space-y-2">
                                {quizzes.map((quiz) => (
                                    <button
                                        key={quiz.id}
                                        type="button"
                                        onClick={() => setSelectedQuiz(quiz)}
                                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                                            selectedQuiz?.id === quiz.id
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <p className="font-medium">{quiz.title}</p>
                                        <p
                                            className={`mt-1 text-xs ${
                                                selectedQuiz?.id === quiz.id
                                                    ? 'text-slate-200'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            {quiz.questions?.length || 0} câu hỏi
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            {selectedQuiz ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">
                                                Thông tin quiz
                                            </p>
                                            <h2 className="mt-1 text-xl font-semibold text-slate-900">
                                                {selectedQuiz.title}
                                            </h2>
                                            <p className="mt-2 text-sm text-slate-500">
                                                {selectedQuiz.description || 'Không có mô tả'}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleLoadQuiz}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <RefreshCcw className="h-4 w-4" />
                                            Làm mới
                                        </button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Target className="h-4 w-4" />
                                                Điểm đạt
                                            </div>
                                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                                {selectedQuiz.passingScore}%
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Clock className="h-4 w-4" />
                                                Thời gian
                                            </div>
                                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                                {selectedQuiz.timeLimitMinutes
                                                    ? `${selectedQuiz.timeLimitMinutes} phút`
                                                    : 'Không giới hạn'}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <FileQuestion className="h-4 w-4" />
                                                Số lượt làm
                                            </div>
                                            <p className="mt-2 text-2xl font-semibold text-slate-900">
                                                {selectedQuiz.maxAttempts === 0
                                                    ? 'Không giới hạn'
                                                    : selectedQuiz.maxAttempts}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                            )}
                        </section>
                    </section>
                )}
            </div>
        </main>
    );
}