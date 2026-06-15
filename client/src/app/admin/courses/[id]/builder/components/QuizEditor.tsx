import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, CheckCircle, Save, Loader2, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Option, Question, Quiz } from "../types";

interface QuizEditorProps {
  lessonId: number;
  initialQuiz: Quiz | null | undefined;
  isDark: boolean;
  onSaveSuccess: () => void;
  setSaveState: (state: "saved" | "saving" | "error" | "") => void;
}

export default function QuizEditor({
  lessonId,
  initialQuiz,
  isDark,
  onSaveSuccess,
  setSaveState,
}: QuizEditorProps) {
  // Helper to ensure all questions and options have stable React keys
  const ensureKeys = (qz: Quiz | null | undefined): Quiz => {
    return {
      title: qz?.title || "Bài Quiz Kiểm Tra",
      description: qz?.description || "",
      passingScore: qz?.passingScore || 80,
      timeLimitMinutes: qz?.timeLimitMinutes || null,
      maxAttempts: (qz?.maxAttempts !== undefined && qz?.maxAttempts !== null) ? qz.maxAttempts : 3,
      questions: qz?.questions?.map((q) => ({
        id: q.id,
        key: q.id ? String(q.id) : `q_${Math.random()}_${Date.now()}`,
        questionText: q.questionText,
        questionType: q.questionType || "single_choice",
        options: q.options?.map((o) => ({
          id: o.id,
          key: o.id ? String(o.id) : `o_${Math.random()}_${Date.now()}`,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
        })) || [],
      })) || [],
    };
  };

  const [quiz, setQuiz] = useState<Quiz>(ensureKeys(initialQuiz));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state ONLY when the active lessonId changes (switching lessons)
  useEffect(() => {
    setQuiz(ensureKeys(initialQuiz));
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [lessonId]);

  // Sync database IDs ONLY when initialQuiz changes (after backend save resolves)
  // This prevents resetting user text inputs while they are actively typing.
  useEffect(() => {
    if (!initialQuiz || !initialQuiz.questions) return;
    setQuiz((prev) => {
      const mergedQuestions = prev.questions.map((q, qIdx) => {
        const initialQ = initialQuiz.questions[qIdx];
        if (!initialQ) return q;
        const mergedOptions = q.options.map((opt, oIdx) => {
          const initialOpt = initialQ.options ? initialQ.options[oIdx] : null;
          return { ...opt, id: initialOpt?.id || opt.id };
        });
        return { ...q, id: initialQ.id || q.id, options: mergedOptions };
      });
      return { ...prev, id: initialQuiz.id || prev.id, questions: mergedQuestions };
    });
  }, [initialQuiz]);

  // Maintain latest quiz in a ref for unmount/switch saving
  const latestQuizRef = useRef(quiz);
  useEffect(() => {
    latestQuizRef.current = quiz;
  }, [quiz]);

  // Flush unsaved edits immediately on unmount or lesson change
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const lastQuiz = latestQuizRef.current;
        api.post(`/api/content/lessons/${lessonId}/quiz`, lastQuiz)
          .catch((err) => console.error("Lỗi lưu bài quiz khi chuyển bài:", err));
      }
    };
  }, [lessonId]);

  // Trigger auto-save
  const triggerAutoSave = (updatedQuiz: Quiz) => {
    setSaveState("saving");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.post(`/api/content/lessons/${lessonId}/quiz`, updatedQuiz);
        if (res.ok) {
          setSaveState("saved");
          onSaveSuccess();
        } else {
          setSaveState("error");
        }
      } catch {
        setSaveState("error");
      } finally {
        timerRef.current = null;
      }
    }, 1200); // 1.2-second debounce for complex quiz structures
  };

  // State update helper
  const updateQuizState = (updater: (prev: Quiz) => Quiz) => {
    setQuiz((prev) => {
      const next = updater(prev);
      setTimeout(() => {
        triggerAutoSave(next);
      }, 0);
      return next;
    });
  };

  // --- Handlers ---
  const handleSettingChange = (field: keyof Quiz, value: any) => {
    updateQuizState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddQuestion = () => {
    updateQuizState((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          key: `q_new_${Math.random()}_${Date.now()}`,
          questionText: "Nội dung câu hỏi trắc nghiệm mới",
          questionType: "single_choice",
          options: [
            { key: `o_new_a_${Math.random()}_${Date.now()}`, optionText: "Lựa chọn A", isCorrect: true },
            { key: `o_new_b_${Math.random()}_${Date.now()}`, optionText: "Lựa chọn B", isCorrect: false },
          ],
        },
      ],
    }));
  };

  const handleRemoveQuestion = (qIdx: number) => {
    updateQuizState((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIdx),
    }));
  };

  const handleQuestionTextChange = (qIdx: number, textVal: string) => {
    updateQuizState((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === qIdx ? { ...q, questionText: textVal } : q
      ),
    }));
  };

  const handleQuestionTypeChange = (qIdx: number, typeVal: string) => {
    updateQuizState((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        let newOptions = [...q.options];
        if (typeVal === "true_false") {
          newOptions = [
            { key: `o_tf_t_${Math.random()}_${Date.now()}`, optionText: "Đúng", isCorrect: true },
            { key: `o_tf_f_${Math.random()}_${Date.now()}`, optionText: "Sai", isCorrect: false },
          ];
        } else if (q.questionType === "true_false" && typeVal !== "true_false") {
          newOptions = [
            { key: `o_mc_a_${Math.random()}_${Date.now()}`, optionText: "Lựa chọn A", isCorrect: true },
            { key: `o_mc_b_${Math.random()}_${Date.now()}`, optionText: "Lựa chọn B", isCorrect: false },
          ];
        }
        return { ...q, questionType: typeVal, options: newOptions };
      }),
    }));
  };

  const handleAddOption = (qIdx: number) => {
    updateQuizState((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        return {
          ...q,
          options: [...q.options, { key: `o_add_${Math.random()}_${Date.now()}`, optionText: "Lựa chọn mới", isCorrect: false }],
        };
      }),
    }));
  };

  const handleRemoveOption = (qIdx: number, oIdx: number) => {
    updateQuizState((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        return {
          ...q,
          options: q.options.filter((_, oIndex) => oIndex !== oIdx),
        };
      }),
    }));
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, textVal: string) => {
    updateQuizState((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        return {
          ...q,
          options: q.options.map((opt, oIndex) =>
            oIndex === oIdx ? { ...opt, optionText: textVal } : opt
          ),
        };
      }),
    }));
  };

  const handleSetCorrectOption = (qIdx: number, oIdx: number) => {
    updateQuizState((prev) => ({
      ...prev,
      questions: prev.questions.map((q, idx) => {
        if (idx !== qIdx) return q;
        const isMultiple = q.questionType === "multiple_choice";
        return {
          ...q,
          options: q.options.map((opt, oIndex) => {
            if (oIndex === oIdx) {
              return { ...opt, isCorrect: isMultiple ? !opt.isCorrect : true };
            }
            return isMultiple ? opt : { ...opt, isCorrect: false };
          }),
        };
      }),
    }));
  };

  // --- Design tokens ---
  const card = isDark ? "bg-[#1a1d2e] border-[#252840]" : "bg-white border-slate-200";
  const text = isDark ? "text-[#e2e8f0]" : "text-slate-900";
  const muted = isDark ? "text-[#7a87a1]" : "text-slate-500";
  const inputStyle = isDark
    ? "bg-[#22263a] border-[#252840] text-[#e2e8f0] placeholder-[#4a5568] focus:ring-indigo-500/40"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/40";

  return (
    <div className={`border rounded-2xl p-6 ${card} space-y-6 shadow-sm`}>
      <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-[#252840]">
        <HelpCircle className="w-5 h-5 text-amber-500" />
        <div>
          <h2 className={`text-base font-bold ${text}`}>Bộ câu hỏi trắc nghiệm (Quiz Builder)</h2>
          <p className={`text-xs ${muted}`}>Thiết lập cấu trúc câu hỏi và cài đặt bài kiểm tra</p>
        </div>
      </div>

      {/* Quiz Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${muted}`}>Điểm đạt (%)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={quiz.passingScore}
            onChange={(e) => handleSettingChange("passingScore", parseInt(e.target.value, 10) || 80)}
            className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
          />
        </div>
        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${muted}`}>Thời gian (phút)</label>
          <input
            type="number"
            placeholder="Không giới hạn"
            value={quiz.timeLimitMinutes || ""}
            onChange={(e) =>
              handleSettingChange("timeLimitMinutes", e.target.value ? parseInt(e.target.value, 10) : null)
            }
            className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
          />
        </div>
        <div>
          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${muted}`}>Lượt thử tối đa</label>
          <input
            type="number"
            placeholder="Không giới hạn"
            value={quiz.maxAttempts}
            onChange={(e) => handleSettingChange("maxAttempts", parseInt(e.target.value, 10) || 0)}
            className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
          />
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-5 pt-3">
        <div className="flex items-center justify-between">
          <h3 className={`text-xs font-bold ${text}`}>Danh sách câu hỏi ({quiz.questions.length})</h3>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center gap-1.5 px-3 py-2 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 text-xs font-bold rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
          </button>
        </div>

        {quiz.questions.length === 0 ? (
          <p className={`text-xs text-center py-10 italic ${muted}`}>
            Chưa có câu hỏi nào. Nhấp "Thêm câu hỏi" để tạo câu hỏi đầu tiên.
          </p>
        ) : (
          <div className="space-y-4">
            {quiz.questions.map((q, qIdx) => (
              <div
                key={q.key || qIdx}
                className={`border rounded-2xl p-5 space-y-4 shadow-sm transition-all ${
                  isDark ? "bg-[#13151f]/50 border-[#1e2235]" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-xs font-extrabold ${text}`}>Câu hỏi {qIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="text-[#7a87a1] hover:text-rose-500 p-1.5 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
                  placeholder="Nhập nội dung câu hỏi..."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[9px] font-bold uppercase tracking-wider mb-2 ${muted}`}>Loại câu hỏi</label>
                    <select
                      value={q.questionType}
                      onChange={(e) => handleQuestionTypeChange(qIdx, e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle}`}
                    >
                      <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                      <option value="multiple_choice">Trắc nghiệm nhiều đáp án</option>
                      <option value="true_false">Đúng / Sai</option>
                    </select>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-3 pl-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Các lựa chọn đáp án</span>
                    {q.questionType !== "true_false" && (
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIdx)}
                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400"
                      >
                        + Thêm lựa chọn
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {q.options?.map((opt, oIdx) => (
                      <div key={opt.key || oIdx} className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(qIdx, oIdx)}
                          className={`p-2 rounded-xl border transition-all ${
                            opt.isCorrect
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "border-slate-500/20 text-slate-500 hover:text-slate-400"
                          }`}
                          title={opt.isCorrect ? "Đáp án đúng" : "Đánh dấu là đáp án đúng"}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>

                        <input
                          type="text"
                          value={opt.optionText}
                          onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                          readOnly={q.questionType === "true_false"}
                          className={`flex-1 px-3 py-2 border rounded-xl outline-none focus:ring-2 text-xs transition-all ${inputStyle} ${
                            q.questionType === "true_false" ? "opacity-75 cursor-not-allowed" : ""
                          }`}
                          placeholder="Nhập phương án..."
                        />

                        {q.questionType !== "true_false" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(qIdx, oIdx)}
                            disabled={q.options.length <= 2}
                            className="text-[#7a87a1] hover:text-rose-500 p-2 rounded disabled:opacity-30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
