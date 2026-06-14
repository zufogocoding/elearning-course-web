'use client';

import { useState } from 'react';
import { BookOpen, Loader2, Search } from 'lucide-react';

export default function QuizBuilderPage() {
    const [lessonId, setLessonId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleLoadQuiz = async () => {
        if (!lessonId.trim()) {
            setErrorMessage('Vui lòng nhập mã bài học.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            // TODO: Check API URL
            console.log('Load quiz by lessonId:', lessonId);
        } catch (error) {
            setErrorMessage('Không thể tải dữ liệu quiz.');
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
                        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
                    )}
                </section>

                <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-sm text-slate-500">
                        Chưa có dữ liệu. Vui lòng nhập mã bài học và bấm tải quiz.
                    </p>
                </section>
            </div>
        </main>
    );
}