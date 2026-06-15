'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    Circle,
    Clock,
    Edit3,
    FileQuestion,
    Loader2,
    Plus,
    RefreshCcw,
    Save,
    Search,
    Target,
    Trash2,
    X,
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

type QuizFormData = {
    title: string;
    description: string;
    passingScore: string;
    timeLimitMinutes: string;
    maxAttempts: string;
};

type QuestionFormOption = {
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
};

type QuestionFormData = {
    questionText: string;
    questionType: 'single_choice' | 'multiple_choice' | 'true_false';
    orderIndex: string;
    options: QuestionFormOption[];
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function QuizBuilderPage() {
    const [lessonId, setLessonId] = useState('');
    const [lesson, setLesson] = useState<LessonInfo | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

    const [quizFormData, setQuizFormData] = useState<QuizFormData>({
        title: '',
        description: '',
        passingScore: '70',
        timeLimitMinutes: '',
        maxAttempts: '3',
    });

    const [questionFormData, setQuestionFormData] = useState<QuestionFormData>({
        questionText: '',
        questionType: 'single_choice',
        orderIndex: '1',
        options: [
            {
                optionText: '',
                isCorrect: true,
                orderIndex: 1,
            },
            {
                optionText: '',
                isCorrect: false,
                orderIndex: 2,
            },
        ],
    });

    const [isEditingQuiz, setIsEditingQuiz] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
        null
    );

    const [loading, setLoading] = useState<boolean>(true);
    const [savingQuiz, setSavingQuiz] = useState<boolean>(false);
    const [savingQuestion, setSavingQuestion] = useState<boolean>(false);
    const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(
        null
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

    const getQuestionTypeLabel = (
        questionType: 'single_choice' | 'multiple_choice' | 'true_false'
    ) => {
        if (questionType === 'single_choice') return 'Một đáp án';
        if (questionType === 'multiple_choice') return 'Nhiều đáp án';
        return 'Đúng / Sai';
    };

    const handleQuizFormChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        setQuizFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const resetQuizForm = () => {
        setIsEditingQuiz(false);
        setQuizFormData({
            title: '',
            description: '',
            passingScore: '70',
            timeLimitMinutes: '',
            maxAttempts: '3',
        });
    };

    const handlePrepareCreateQuiz = () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        resetQuizForm();
    };

    const handlePrepareEditQuiz = () => {
        if (!selectedQuiz) return;

        setErrorMessage(null);
        setSuccessMessage(null);
        setIsEditingQuiz(true);

        setQuizFormData({
            title: selectedQuiz.title,
            description: selectedQuiz.description || '',
            passingScore: String(selectedQuiz.passingScore),
            timeLimitMinutes: selectedQuiz.timeLimitMinutes
                ? String(selectedQuiz.timeLimitMinutes)
                : '',
            maxAttempts: String(selectedQuiz.maxAttempts),
        });
    };

    const loadQuizzesByLesson = async (
        targetLessonId: string,
        selectedQuizId?: number
    ) => {
        if (!targetLessonId.trim()) {
            setErrorMessage('Vui lòng nhập mã bài học.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        setLesson(null);
        setQuizzes([]);
        setSelectedQuiz(null);

        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/content/quizzes/${targetLessonId}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const responseData: QuizResponseData = response.data?.data;
            const quizList = responseData?.quizzes || [];
            const nextSelectedQuiz =
                quizList.find((quiz) => quiz.id === selectedQuizId) ||
                quizList[0] ||
                null;

            setLesson(responseData?.lesson || null);
            setQuizzes(quizList);
            setSelectedQuiz(nextSelectedQuiz);
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
                        'Không thể tải dữ liệu quiz.'
                    );
                }
            } else {
                setErrorMessage('Không thể tải dữ liệu quiz.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLoadQuiz = async () => {
        await loadQuizzesByLesson(lessonId);
    };

    const validateQuizForm = () => {
        if (!lessonId.trim()) {
            return 'Vui lòng nhập mã bài học trước khi lưu quiz.';
        }

        if (!quizFormData.title.trim()) {
            return 'Vui lòng nhập tiêu đề quiz.';
        }

        const passingScore = Number(quizFormData.passingScore);
        if (
            !Number.isInteger(passingScore) ||
            passingScore < 0 ||
            passingScore > 100
        ) {
            return 'Điểm đạt phải là số nguyên từ 0 đến 100.';
        }

        if (quizFormData.timeLimitMinutes.trim()) {
            const timeLimitMinutes = Number(quizFormData.timeLimitMinutes);

            if (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes <= 0) {
                return 'Thời gian làm bài phải là số nguyên lớn hơn 0.';
            }
        }

        const maxAttempts = Number(quizFormData.maxAttempts);
        if (!Number.isInteger(maxAttempts) || maxAttempts < 0) {
            return 'Số lượt làm tối đa phải là số nguyên không âm.';
        }

        if (isEditingQuiz && !selectedQuiz) {
            return 'Vui lòng chọn quiz cần cập nhật.';
        }

        return null;
    };

    const handleSubmitQuizForm = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationError = validateQuizForm();

        if (validationError) {
            setErrorMessage(validationError);
            setSuccessMessage(null);
            return;
        }

        setSavingQuiz(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const payload = {
            lessonId: Number(lessonId),
            title: quizFormData.title.trim(),
            description: quizFormData.description.trim() || null,
            passingScore: Number(quizFormData.passingScore),
            timeLimitMinutes: quizFormData.timeLimitMinutes.trim()
                ? Number(quizFormData.timeLimitMinutes)
                : null,
            maxAttempts: Number(quizFormData.maxAttempts),
        };

        try {
            let response;

            if (isEditingQuiz && selectedQuiz) {
                response = await axios.put(
                    `${API_BASE_URL}/api/content/quizzes/${selectedQuiz.id}`,
                    payload,
                    {
                        headers: getAuthHeaders(),
                    }
                );

                setSuccessMessage('Cập nhật quiz thành công.');
            } else {
                response = await axios.post(
                    `${API_BASE_URL}/api/content/quizzes`,
                    payload,
                    {
                        headers: getAuthHeaders(),
                    }
                );

                setSuccessMessage('Tạo quiz thành công.');
            }

            const savedQuiz: Quiz | undefined = response.data?.data;

            await loadQuizzesByLesson(
                lessonId,
                savedQuiz?.id || selectedQuiz?.id || undefined
            );

            if (!isEditingQuiz) {
                resetQuizForm();
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể lưu quiz.'
                );
            } else {
                setErrorMessage('Không thể lưu quiz.');
            }
        } finally {
            setSavingQuiz(false);
        }
    };

    const resetQuestionForm = () => {
        setQuestionFormData({
            questionText: '',
            questionType: 'single_choice',
            orderIndex: '1',
            options: [
                {
                    optionText: '',
                    isCorrect: true,
                    orderIndex: 1,
                },
                {
                    optionText: '',
                    isCorrect: false,
                    orderIndex: 2,
                },
            ],
        });

        setIsEditingQuestion(false);
        setEditingQuestionId(null);
    };

    const handleOpenCreateQuestionModal = () => {
        if (!selectedQuiz) {
            setErrorMessage('Vui lòng chọn quiz trước khi thêm câu hỏi.');
            return;
        }

        setErrorMessage(null);
        setSuccessMessage(null);
        resetQuestionForm();
        setShowQuestionModal(true);
    };

    const handleOpenEditQuestionModal = (question: Question) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setIsEditingQuestion(true);
        setEditingQuestionId(question.id);

        setQuestionFormData({
            questionText: question.questionText,
            questionType: question.questionType,
            orderIndex: String(question.orderIndex),
            options:
                question.questionOptions.length > 0
                    ? question.questionOptions.map((option, index) => ({
                        optionText: option.optionText,
                        isCorrect: option.isCorrect,
                        orderIndex: option.orderIndex || index + 1,
                    }))
                    : [
                        {
                            optionText: '',
                            isCorrect: true,
                            orderIndex: 1,
                        },
                        {
                            optionText: '',
                            isCorrect: false,
                            orderIndex: 2,
                        },
                    ],
        });

        setShowQuestionModal(true);
    };

    const handleCloseQuestionModal = () => {
        setShowQuestionModal(false);
        resetQuestionForm();
    };

    const handleQuestionFormChange = (
        event: ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = event.target;

        setQuestionFormData((prev) => ({
            ...prev,
            [name]: value,
            options:
                name === 'questionType' && value === 'true_false'
                    ? [
                        {
                            optionText: 'Đúng',
                            isCorrect: true,
                            orderIndex: 1,
                        },
                        {
                            optionText: 'Sai',
                            isCorrect: false,
                            orderIndex: 2,
                        },
                    ]
                    : prev.options,
        }));
    };

    const handleOptionTextChange = (index: number, value: string) => {
        setQuestionFormData((prev) => ({
            ...prev,
            options: prev.options.map((option, optionIndex) =>
                optionIndex === index
                    ? {
                        ...option,
                        optionText: value,
                    }
                    : option
            ),
        }));
    };

    const handleToggleCorrectOption = (index: number) => {
        setQuestionFormData((prev) => {
            if (
                prev.questionType === 'single_choice' ||
                prev.questionType === 'true_false'
            ) {
                return {
                    ...prev,
                    options: prev.options.map((option, optionIndex) => ({
                        ...option,
                        isCorrect: optionIndex === index,
                    })),
                };
            }

            return {
                ...prev,
                options: prev.options.map((option, optionIndex) =>
                    optionIndex === index
                        ? {
                            ...option,
                            isCorrect: !option.isCorrect,
                        }
                        : option
                ),
            };
        });
    };

    const handleAddOption = () => {
        setQuestionFormData((prev) => ({
            ...prev,
            options: [
                ...prev.options,
                {
                    optionText: '',
                    isCorrect: false,
                    orderIndex: prev.options.length + 1,
                },
            ],
        }));
    };

    const handleRemoveOption = (index: number) => {
        setQuestionFormData((prev) => {
            if (prev.options.length <= 2) {
                return prev;
            }

            return {
                ...prev,
                options: prev.options
                    .filter((_, optionIndex) => optionIndex !== index)
                    .map((option, optionIndex) => ({
                        ...option,
                        orderIndex: optionIndex + 1,
                    })),
            };
        });
    };

    const handleSubmitQuestionForm = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!selectedQuiz) {
            setErrorMessage('Vui lòng chọn quiz trước khi lưu câu hỏi.');
            return;
        }

        if (!questionFormData.questionText.trim()) {
            setErrorMessage('Vui lòng nhập nội dung câu hỏi.');
            return;
        }

        const orderIndex = Number(questionFormData.orderIndex);

        if (!Number.isInteger(orderIndex) || orderIndex < 0) {
            setErrorMessage('Thứ tự câu hỏi phải là số nguyên không âm.');
            return;
        }

        if (questionFormData.options.length < 2) {
            setErrorMessage('Câu hỏi phải có ít nhất 2 đáp án.');
            return;
        }

        if (
            questionFormData.questionType === 'true_false' &&
            questionFormData.options.length !== 2
        ) {
            setErrorMessage('Câu hỏi Đúng / Sai phải có đúng 2 đáp án.');
            return;
        }

        const hasEmptyOption = questionFormData.options.some(
            (option) => !option.optionText.trim()
        );

        if (hasEmptyOption) {
            setErrorMessage('Vui lòng nhập đầy đủ nội dung đáp án.');
            return;
        }

        const correctOptions = questionFormData.options.filter(
            (option) => option.isCorrect
        );

        if (correctOptions.length === 0) {
            setErrorMessage('Vui lòng chọn ít nhất một đáp án đúng.');
            return;
        }

        if (
            (questionFormData.questionType === 'single_choice' ||
                questionFormData.questionType === 'true_false') &&
            correctOptions.length !== 1
        ) {
            setErrorMessage('Loại câu hỏi này chỉ được có một đáp án đúng.');
            return;
        }

        setSavingQuestion(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const payload = {
            quizId: selectedQuiz.id,
            questionText: questionFormData.questionText.trim(),
            questionType: questionFormData.questionType,
            orderIndex,
            options: questionFormData.options.map((option, index) => ({
                optionText: option.optionText.trim(),
                isCorrect: option.isCorrect,
                orderIndex: index + 1,
            })),
        };

        try {
            let response;

            if (isEditingQuestion && editingQuestionId) {
                response = await axios.put(
                    `${API_BASE_URL}/api/content/questions/${editingQuestionId}`,
                    payload,
                    {
                        headers: getAuthHeaders(),
                    }
                );

                setSuccessMessage('Cập nhật câu hỏi thành công.');
            } else {
                response = await axios.post(
                    `${API_BASE_URL}/api/content/questions`,
                    payload,
                    {
                        headers: getAuthHeaders(),
                    }
                );

                setSuccessMessage('Thêm câu hỏi thành công.');
            }

            const savedQuestion: Question | undefined = response.data?.data;

            if (savedQuestion) {
                console.log('Saved question:', savedQuestion);
            }

            await loadQuizzesByLesson(lessonId, selectedQuiz.id);
            handleCloseQuestionModal();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể lưu câu hỏi.'
                );
            } else {
                setErrorMessage('Không thể lưu câu hỏi.');
            }
        } finally {
            setSavingQuestion(false);
        }
    };

    const handleDeleteQuestion = async (question: Question) => {
        if (!selectedQuiz) {
            setErrorMessage('Vui lòng chọn quiz trước khi xóa câu hỏi.');
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn xóa câu hỏi: "${question.questionText}"?`
        );

        if (!confirmed) return;

        setDeletingQuestionId(question.id);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await axios.delete(`${API_BASE_URL}/api/content/questions/${question.id}`, {
                headers: getAuthHeaders(),
            });

            setSuccessMessage('Xóa câu hỏi thành công.');
            await loadQuizzesByLesson(lessonId, selectedQuiz.id);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorMessage(
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Không thể xóa câu hỏi.'
                );
            } else {
                setErrorMessage('Không thể xóa câu hỏi.');
            }
        } finally {
            setDeletingQuestionId(null);
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
                        Mã bài học cần quản lý quiz
                    </label>
                    <p className="mb-3 text-sm text-slate-500">
                        Nhập ID bài học để tải danh sách quiz và câu hỏi tương ứng.
                    </p>

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
                            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            Tải dữ liệu
                        </button>
                    </div>

                    {errorMessage && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}
                </section>

                {loading && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-500" />
                        <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu...</p>
                    </section>
                )}

                {!loading && !lesson && quizzes.length === 0 && !errorMessage && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                        <FileQuestion className="mx-auto h-10 w-10 text-slate-400" />
                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            Chưa có dữ liệu quiz
                        </h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Vui lòng nhập mã bài học và bấm Tải dữ liệu để bắt đầu quản lý
                            quiz, câu hỏi và đáp án.
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
                                Mã bài học:{' '}
                                <span className="font-medium text-slate-900">{lesson.id}</span>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                Mã chương:{' '}
                                <span className="font-medium text-slate-900">
                  {lesson.sectionId}
                </span>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                Mã khóa học:{' '}
                                <span className="font-medium text-slate-900">
                  {lesson.courseId}
                </span>
                            </div>
                        </div>
                    </section>
                )}

                {!loading && lesson && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    {isEditingQuiz ? 'Cập nhật quiz' : 'Tạo quiz mới'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Nhập thông tin cơ bản của quiz cho bài học hiện tại.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handlePrepareCreateQuiz}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tạo mới
                                </button>

                                {selectedQuiz && (
                                    <button
                                        type="button"
                                        onClick={handlePrepareEditQuiz}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Sửa quiz đang chọn
                                    </button>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSubmitQuizForm} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Tiêu đề quiz
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={quizFormData.title}
                                    onChange={handleQuizFormChange}
                                    placeholder="Nhập tiêu đề quiz"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Mô tả
                                </label>
                                <textarea
                                    name="description"
                                    value={quizFormData.description}
                                    onChange={handleQuizFormChange}
                                    placeholder="Nhập mô tả quiz"
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Điểm đạt (%)
                                    </label>
                                    <input
                                        type="number"
                                        name="passingScore"
                                        value={quizFormData.passingScore}
                                        onChange={handleQuizFormChange}
                                        min="0"
                                        max="100"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Thời gian làm bài
                                    </label>
                                    <input
                                        type="number"
                                        name="timeLimitMinutes"
                                        value={quizFormData.timeLimitMinutes}
                                        onChange={handleQuizFormChange}
                                        min="1"
                                        placeholder="Bỏ trống nếu không giới hạn"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Số lượt làm tối đa
                                    </label>
                                    <input
                                        type="number"
                                        name="maxAttempts"
                                        value={quizFormData.maxAttempts}
                                        onChange={handleQuizFormChange}
                                        min="0"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={resetQuizForm}
                                    disabled={savingQuiz}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <X className="h-4 w-4" />
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingQuiz}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingQuiz ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isEditingQuiz ? 'Lưu cập nhật' : 'Tạo quiz'}
                                </button>
                            </div>
                        </form>
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

                                    <div className="border-t border-slate-200 pt-6">
                                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-base font-semibold text-slate-900">
                                                    Danh sách câu hỏi
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Hiển thị toàn bộ câu hỏi và đáp án thuộc quiz hiện tại.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleOpenCreateQuestionModal}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Thêm câu hỏi
                                            </button>
                                        </div>

                                        {selectedQuiz.questions.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                                                <FileQuestion className="mx-auto h-8 w-8 text-slate-400" />
                                                <p className="mt-3 text-sm text-slate-500">
                                                    Không có dữ liệu câu hỏi.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {selectedQuiz.questions.map(
                                                    (question, questionIndex) => (
                                                        <article
                                                            key={question.id}
                                                            className="rounded-2xl border border-slate-200 p-5"
                                                        >
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                      Câu {questionIndex + 1}
                                    </span>

                                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                      {getQuestionTypeLabel(
                                          question.questionType
                                      )}
                                    </span>
                                                                    </div>

                                                                    <h4 className="mt-3 text-sm font-semibold text-slate-900">
                                                                        {question.questionText}
                                                                    </h4>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs text-slate-500">
                                                                        Thứ tự: {question.orderIndex}
                                                                    </p>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleOpenEditQuestionModal(question)
                                                                        }
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                                    >
                                                                        <Edit3 className="h-3.5 w-3.5" />
                                                                        Sửa
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteQuestion(question)}
                                                                        disabled={deletingQuestionId === question.id}
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    >
                                                                        {deletingQuestionId === question.id ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        )}
                                                                        Xóa
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 space-y-2">
                                                                {question.questionOptions.length === 0 ? (
                                                                    <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                                                                        Không có dữ liệu đáp án.
                                                                    </p>
                                                                ) : (
                                                                    question.questionOptions.map((option) => (
                                                                        <div
                                                                            key={option.id}
                                                                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                                                                                option.isCorrect
                                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                                                    : 'border-slate-200 bg-white text-slate-700'
                                                                            }`}
                                                                        >
                                                                            {option.isCorrect ? (
                                                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                                            ) : (
                                                                                <Circle className="h-4 w-4 text-slate-400" />
                                                                            )}

                                                                            <span className="flex-1">
                                        {option.optionText}
                                      </span>

                                                                            {option.isCorrect && (
                                                                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                          Đáp án đúng
                                        </span>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </article>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Không có dữ liệu.</p>
                            )}
                        </section>
                    </section>
                )}
            </div>

            {showQuestionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {isEditingQuestion ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Nhập nội dung câu hỏi và thiết lập các đáp án.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseQuestionModal}
                                disabled={savingQuestion}
                                className="rounded-xl border border-slate-300 p-2 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitQuestionForm} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Nội dung câu hỏi
                                </label>
                                <textarea
                                    name="questionText"
                                    value={questionFormData.questionText}
                                    onChange={handleQuestionFormChange}
                                    rows={3}
                                    placeholder="Nhập nội dung câu hỏi"
                                    disabled={savingQuestion}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Loại câu hỏi
                                    </label>
                                    <select
                                        name="questionType"
                                        value={questionFormData.questionType}
                                        onChange={handleQuestionFormChange}
                                        disabled={savingQuestion}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    >
                                        <option value="single_choice">Một đáp án</option>
                                        <option value="multiple_choice">Nhiều đáp án</option>
                                        <option value="true_false">Đúng / Sai</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Thứ tự
                                    </label>
                                    <input
                                        type="number"
                                        name="orderIndex"
                                        value={questionFormData.orderIndex}
                                        onChange={handleQuestionFormChange}
                                        min="0"
                                        disabled={savingQuestion}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Danh sách đáp án
                                    </label>

                                    <button
                                        type="button"
                                        onClick={handleAddOption}
                                        disabled={
                                            savingQuestion ||
                                            questionFormData.questionType === 'true_false'
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Thêm đáp án
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {questionFormData.options.map((option, index) => (
                                        <div
                                            key={index}
                                            className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto_auto]"
                                        >
                                            <input
                                                type="text"
                                                value={option.optionText}
                                                onChange={(event) =>
                                                    handleOptionTextChange(index, event.target.value)
                                                }
                                                placeholder={`Đáp án ${index + 1}`}
                                                disabled={savingQuestion}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => handleToggleCorrectOption(index)}
                                                disabled={savingQuestion}
                                                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                    option.isCorrect
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Đúng
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(index)}
                                                disabled={
                                                    savingQuestion ||
                                                    questionFormData.options.length <= 2 ||
                                                    questionFormData.questionType === 'true_false'
                                                }
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Xóa
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCloseQuestionModal}
                                    disabled={savingQuestion}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingQuestion}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingQuestion ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isEditingQuestion ? 'Lưu cập nhật' : 'Thêm câu hỏi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}