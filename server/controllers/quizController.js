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
// Tạo quiz mới
const createQuiz = async (req, res) => {
  return error(res, 501, 'API tạo quiz chưa được triển khai.');
};

// [PUT] /api/content/quizzes/:id
// Cập nhật quiz
const updateQuiz = async (req, res) => {
  return error(res, 501, 'API cập nhật quiz chưa được triển khai.');
};

// [DELETE] /api/content/quizzes/:id
// Xóa mềm quiz
const deleteQuiz = async (req, res) => {
  return error(res, 501, 'API xóa quiz chưa được triển khai.');
};

// =====================================================
// QUESTION CRUD
// =====================================================

// [GET] /api/content/quizzes/:id/questions
// Lấy danh sách câu hỏi theo quiz
const getQuestionsByQuiz = async (req, res) => {
  return error(res, 501, 'API lấy danh sách câu hỏi chưa được triển khai.');
};

// [POST] /api/content/questions
// Tạo câu hỏi kèm options
const createQuestion = async (req, res) => {
  return error(res, 501, 'API tạo câu hỏi chưa được triển khai.');
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