const prisma = require('../lib/prisma');

// =====================================================
// QUIZ BUILDER CONTROLLER
// Phạm vi: Admin quản lý quiz, câu hỏi và đáp án
// Base route: /api/content
// =====================================================

const getParamId = (req, ...names) => {
  for (const name of names) {
    if (req.params[name] !== undefined) {
      const value = parseInt(req.params[name], 10);
      return Number.isInteger(value) && value > 0 ? value : null;
    }
  }
  return null;
};

const success = (res, data, message = 'Thành công') => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

const created = (res, data, message = 'Tạo mới thành công') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

const error = (res, status, message) => {
  return res.status(status).json({
    success: false,
    error: message,
  });
};

// =====================================================
// QUIZ CRUD
// =====================================================

// [GET] /api/content/quizzes/:lessonId
// Lấy quiz theo bài học
const getQuizzesByLesson = async (req, res) => {
  try {
    const lessonId = getParamId(req, 'lessonId');

    if (!lessonId) {
      return error(res, 400, 'lessonId không hợp lệ.');
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (
      !lesson ||
      lesson.deletedAt ||
      !lesson.section ||
      lesson.section.deletedAt ||
      !lesson.section.course ||
      lesson.section.course.deletedAt
    ) {
      return error(res, 404, 'Bài học không tồn tại hoặc đã bị xóa.');
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        lessonId,
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
      include: {
        questions: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            questionOptions: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
      },
    });

    return success(
      res,
      {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          contentType: lesson.contentType,
          sectionId: lesson.sectionId,
          courseId: lesson.section.courseId,
        },
        quizzes,
      },
      'Lấy danh sách quiz của bài học thành công.'
    );
  } catch (err) {
    console.error('Lỗi getQuizzesByLesson:', err);
    return error(res, 500, 'Lỗi server khi lấy danh sách quiz của bài học.');
  }
};

// [POST] /api/content/quizzes
// Tạo quiz mới cho một bài học
const createQuiz = async (req, res) => {
  try {
    const {
      lessonId,
      title,
      description,
      passingScore,
      timeLimitMinutes,
      maxAttempts,
    } = req.body;

    const parsedLessonId = Number(lessonId);
    const parsedPassingScore = Number(passingScore);
    const parsedTimeLimitMinutes =
      timeLimitMinutes === null || timeLimitMinutes === undefined || timeLimitMinutes === ''
        ? null
        : Number(timeLimitMinutes);
    const parsedMaxAttempts =
      maxAttempts === null || maxAttempts === undefined || maxAttempts === ''
        ? 0
        : Number(maxAttempts);

    if (!Number.isInteger(parsedLessonId) || parsedLessonId <= 0) {
      return error(res, 400, 'lessonId không hợp lệ.');
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return error(res, 400, 'Tiêu đề quiz không được để trống.');
    }

    if (
      !Number.isFinite(parsedPassingScore) ||
      parsedPassingScore < 0 ||
      parsedPassingScore > 100
    ) {
      return error(res, 400, 'Điểm đạt phải nằm trong khoảng từ 0 đến 100.');
    }

    if (
      parsedTimeLimitMinutes !== null &&
      (!Number.isInteger(parsedTimeLimitMinutes) || parsedTimeLimitMinutes <= 0)
    ) {
      return error(res, 400, 'Thời gian làm bài phải là số nguyên lớn hơn 0.');
    }

    if (!Number.isInteger(parsedMaxAttempts) || parsedMaxAttempts < 0) {
      return error(res, 400, 'Số lượt làm tối đa phải là số nguyên không âm.');
    }

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: parsedLessonId,
      },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (
      !lesson ||
      lesson.deletedAt ||
      !lesson.section ||
      lesson.section.deletedAt ||
      !lesson.section.course ||
      lesson.section.course.deletedAt
    ) {
      return error(res, 404, 'Bài học không tồn tại hoặc đã bị xóa.');
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId: parsedLessonId,
        title: title.trim(),
        description: description ? description.trim() : null,
        passingScore: parsedPassingScore,
        timeLimitMinutes: parsedTimeLimitMinutes,
        maxAttempts: parsedMaxAttempts,
      },
    });

    return created(res, quiz, 'Tạo quiz thành công.');
  } catch (err) {
    console.error('Lỗi createQuiz:', err);
    return error(res, 500, 'Lỗi server khi tạo quiz.');
  }
};

// [PUT] /api/content/quizzes/:id
// Cập nhật thông tin quiz
const updateQuiz = async (req, res) => {
  try {
    const quizId = getParamId(req, 'id');

    if (!quizId) {
      return error(res, 400, 'quizId không hợp lệ.');
    }

    const {
      title,
      description,
      passingScore,
      timeLimitMinutes,
      maxAttempts,
    } = req.body;

    const existingQuiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (
      !existingQuiz ||
      existingQuiz.deletedAt ||
      !existingQuiz.lesson ||
      existingQuiz.lesson.deletedAt ||
      !existingQuiz.lesson.section ||
      existingQuiz.lesson.section.deletedAt ||
      !existingQuiz.lesson.section.course ||
      existingQuiz.lesson.section.course.deletedAt
    ) {
      return error(res, 404, 'Quiz không tồn tại hoặc đã bị xóa.');
    }

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return error(res, 400, 'Tiêu đề quiz không được để trống.');
      }

      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description =
        description === null || description === ''
          ? null
          : String(description).trim();
    }

    if (passingScore !== undefined) {
      const parsedPassingScore = Number(passingScore);

      if (
        !Number.isFinite(parsedPassingScore) ||
        parsedPassingScore < 0 ||
        parsedPassingScore > 100
      ) {
        return error(res, 400, 'Điểm đạt phải nằm trong khoảng từ 0 đến 100.');
      }

      updateData.passingScore = parsedPassingScore;
    }

    if (timeLimitMinutes !== undefined) {
      const parsedTimeLimitMinutes =
        timeLimitMinutes === null || timeLimitMinutes === ''
          ? null
          : Number(timeLimitMinutes);

      if (
        parsedTimeLimitMinutes !== null &&
        (!Number.isInteger(parsedTimeLimitMinutes) || parsedTimeLimitMinutes <= 0)
      ) {
        return error(res, 400, 'Thời gian làm bài phải là số nguyên lớn hơn 0.');
      }

      updateData.timeLimitMinutes = parsedTimeLimitMinutes;
    }

    if (maxAttempts !== undefined) {
      const parsedMaxAttempts =
        maxAttempts === null || maxAttempts === ''
          ? 0
          : Number(maxAttempts);

      if (!Number.isInteger(parsedMaxAttempts) || parsedMaxAttempts < 0) {
        return error(res, 400, 'Số lượt làm tối đa phải là số nguyên không âm.');
      }

      updateData.maxAttempts = parsedMaxAttempts;
    }

    if (Object.keys(updateData).length === 0) {
      return error(res, 400, 'Không có dữ liệu để cập nhật.');
    }

    const updatedQuiz = await prisma.quiz.update({
      where: {
        id: quizId,
      },
      data: updateData,
    });

    return success(res, updatedQuiz, 'Cập nhật quiz thành công.');
  } catch (err) {
    console.error('Lỗi updateQuiz:', err);
    return error(res, 500, 'Lỗi server khi cập nhật quiz.');
  }
};

// [DELETE] /api/content/quizzes/:id
// Xóa mềm quiz
const deleteQuiz = async (req, res) => {
  try {
    const quizId = getParamId(req, 'id');

    if (!quizId) {
      return error(res, 400, 'quizId không hợp lệ.');
    }

    const existingQuiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
        questions: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (
      !existingQuiz ||
      existingQuiz.deletedAt ||
      !existingQuiz.lesson ||
      existingQuiz.lesson.deletedAt ||
      !existingQuiz.lesson.section ||
      existingQuiz.lesson.section.deletedAt ||
      !existingQuiz.lesson.section.course ||
      existingQuiz.lesson.section.course.deletedAt
    ) {
      return error(res, 404, 'Quiz không tồn tại hoặc đã bị xóa.');
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.question.updateMany({
        where: {
          quizId,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      });

      await tx.quiz.update({
        where: {
          id: quizId,
        },
        data: {
          deletedAt: now,
        },
      });
    });

    return success(
      res,
      {
        id: quizId,
        deletedQuestionCount: existingQuiz.questions.length,
      },
      'Xóa quiz thành công.'
    );
  } catch (err) {
    console.error('Lỗi deleteQuiz:', err);
    return error(res, 500, 'Lỗi server khi xóa quiz.');
  }
};

// =====================================================
// QUESTION CRUD
// =====================================================

// [GET] /api/content/quizzes/:id/questions
// Lấy danh sách câu hỏi và đáp án theo quiz
const getQuestionsByQuiz = async (req, res) => {
  try {
    const quizId = getParamId(req, 'id');

    if (!quizId) {
      return error(res, 400, 'quizId không hợp lệ.');
    }

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (
      !quiz ||
      quiz.deletedAt ||
      !quiz.lesson ||
      quiz.lesson.deletedAt ||
      !quiz.lesson.section ||
      quiz.lesson.section.deletedAt ||
      !quiz.lesson.section.course ||
      quiz.lesson.section.course.deletedAt
    ) {
      return error(res, 404, 'Quiz không tồn tại hoặc đã bị xóa.');
    }

    const questions = await prisma.question.findMany({
      where: {
        quizId,
        deletedAt: null,
      },
      orderBy: {
        orderIndex: 'asc',
      },
      include: {
        questionOptions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return success(
      res,
      {
        quiz: {
          id: quiz.id,
          lessonId: quiz.lessonId,
          title: quiz.title,
          description: quiz.description,
          passingScore: quiz.passingScore,
          timeLimitMinutes: quiz.timeLimitMinutes,
          maxAttempts: quiz.maxAttempts,
        },
        questions,
      },
      'Lấy danh sách câu hỏi của quiz thành công.'
    );
  } catch (err) {
    console.error('Lỗi getQuestionsByQuiz:', err);
    return error(res, 500, 'Lỗi server khi lấy danh sách câu hỏi của quiz.');
  }
};

// [POST] /api/content/questions
// Tạo câu hỏi kèm danh sách đáp án
const createQuestion = async (req, res) => {
  try {
    const {
      quizId,
      questionText,
      questionType,
      orderIndex,
      options,
    } = req.body;

    const parsedQuizId = Number(quizId);
    const parsedOrderIndex =
      orderIndex === null || orderIndex === undefined || orderIndex === ''
        ? 0
        : Number(orderIndex);

    const allowedQuestionTypes = ['single_choice', 'multiple_choice', 'true_false'];
    const finalQuestionType = questionType || 'single_choice';

    if (!Number.isInteger(parsedQuizId) || parsedQuizId <= 0) {
      return error(res, 400, 'quizId không hợp lệ.');
    }

    if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
      return error(res, 400, 'Nội dung câu hỏi không được để trống.');
    }

    if (!allowedQuestionTypes.includes(finalQuestionType)) {
      return error(
        res,
        400,
        'Loại câu hỏi không hợp lệ. Chỉ hỗ trợ single_choice, multiple_choice hoặc true_false.'
      );
    }

    if (!Number.isInteger(parsedOrderIndex) || parsedOrderIndex < 0) {
      return error(res, 400, 'Thứ tự câu hỏi phải là số nguyên không âm.');
    }

    if (!Array.isArray(options) || options.length < 2) {
      return error(res, 400, 'Câu hỏi phải có ít nhất 2 đáp án.');
    }

    const normalizedOptions = options.map((option, index) => {
      const optionText = option?.optionText;
      const optionOrderIndex =
        option?.orderIndex === null ||
        option?.orderIndex === undefined ||
        option?.orderIndex === ''
          ? index
          : Number(option.orderIndex);

      return {
        optionText: typeof optionText === 'string' ? optionText.trim() : '',
        isCorrect: Boolean(option?.isCorrect),
        orderIndex: Number.isInteger(optionOrderIndex) && optionOrderIndex >= 0
          ? optionOrderIndex
          : index,
      };
    });

    const hasInvalidOptionText = normalizedOptions.some(
      (option) => option.optionText.length === 0
    );

    if (hasInvalidOptionText) {
      return error(res, 400, 'Nội dung đáp án không được để trống.');
    }

    const correctOptionCount = normalizedOptions.filter((option) => option.isCorrect).length;

    if (correctOptionCount === 0) {
      return error(res, 400, 'Câu hỏi phải có ít nhất 1 đáp án đúng.');
    }

    if (finalQuestionType === 'single_choice' && correctOptionCount !== 1) {
      return error(res, 400, 'Câu hỏi single_choice chỉ được có 1 đáp án đúng.');
    }

    if (finalQuestionType === 'true_false') {
      if (normalizedOptions.length !== 2) {
        return error(res, 400, 'Câu hỏi true_false phải có đúng 2 đáp án.');
      }

      if (correctOptionCount !== 1) {
        return error(res, 400, 'Câu hỏi true_false phải có đúng 1 đáp án đúng.');
      }
    }

    const quiz = await prisma.quiz.findUnique({
      where: {
        id: parsedQuizId,
      },
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (
      !quiz ||
      quiz.deletedAt ||
      !quiz.lesson ||
      quiz.lesson.deletedAt ||
      !quiz.lesson.section ||
      quiz.lesson.section.deletedAt ||
      !quiz.lesson.section.course ||
      quiz.lesson.section.course.deletedAt
    ) {
      return error(res, 404, 'Quiz không tồn tại hoặc đã bị xóa.');
    }

    const question = await prisma.question.create({
      data: {
        quizId: parsedQuizId,
        questionText: questionText.trim(),
        questionType: finalQuestionType,
        orderIndex: parsedOrderIndex,
        questionOptions: {
          create: normalizedOptions,
        },
      },
      include: {
        questionOptions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return created(res, question, 'Tạo câu hỏi thành công.');
  } catch (err) {
    console.error('Lỗi createQuestion:', err);
    return error(res, 500, 'Lỗi server khi tạo câu hỏi.');
  }
};

// [PUT] /api/content/questions/:id
// Cập nhật câu hỏi kèm options
const updateQuestion = async (req, res) => {
  return error(res, 501, 'API cập nhật câu hỏi chưa được triển khai.');
};

// [DELETE] /api/content/questions/:id
// Xóa mềm câu hỏi
const deleteQuestion = async (req, res) => {
  return error(res, 501, 'API xóa câu hỏi chưa được triển khai.');
};

module.exports = {
  getQuizzesByLesson,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};