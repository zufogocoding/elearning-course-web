const prisma = require('../lib/prisma');

// ==========================================
// QUẢN LÝ CHƯƠNG (SECTIONS)
// ==========================================

// [POST] Tạo Chương mới (Admin)
const createSection = async (req, res) => {
  try {
    const { courseId, title, orderIndex } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ error: 'courseId và title là bắt buộc.' });
    }

    const section = await prisma.section.create({
      data: {
        courseId: parseInt(courseId),
        title,
        orderIndex: parseInt(orderIndex) || 0,
      }
    });

    res.status(201).json({ message: 'Tạo chương thành công', section });
  } catch (error) {
    console.error('Lỗi tạo section:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo chương.' });
  }
};

// [PUT] Cập nhật Chương (Admin)
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, orderIndex } = req.body;
    const parsedId = parseInt(id);

    const result = await prisma.section.updateMany({
      where: { id: parsedId, deletedAt: null },
      data: {
        ...(title && { title }),
        ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex) })
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Không tìm thấy chương hoặc chương đã bị xóa.' });
    }

    const section = await prisma.section.findUnique({
      where: { id: parsedId }
    });

    res.status(200).json({ message: 'Cập nhật chương thành công', section });
  } catch (error) {
    console.error('Lỗi cập nhật section:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật chương.' });
  }
};

// [DELETE] Xóa mềm Chương (Admin)
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);

    const section = await prisma.section.findFirst({
      where: { id: parsedId, deletedAt: null }
    });

    if (!section) {
      return res.status(404).json({ error: 'Không tìm thấy chương hoặc chương đã bị xóa.' });
    }

    await prisma.$transaction([
      prisma.section.update({
        where: { id: parsedId },
        data: { deletedAt: new Date() }
      }),
      prisma.lesson.updateMany({
        where: { sectionId: parsedId, deletedAt: null },
        data: { deletedAt: new Date() }
      })
    ]);

    res.status(200).json({ message: 'Chương và các bài học bên trong đã được xóa mềm.' });
  } catch (error) {
    console.error('Lỗi xóa section:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa chương.' });
  }
};

// ==========================================
// QUẢN LÝ BÀI HỌC (LESSONS)
// ==========================================

// [POST] Tạo Bài học mới (Admin)
const createLesson = async (req, res) => {
  try {
    const { 
      sectionId, title, contentType, contentUrl, 
      durationSeconds, isPreview, orderIndex 
    } = req.body;

    if (!sectionId || !title || !contentType) {
      return res.status(400).json({ error: 'sectionId, title và contentType là bắt buộc.' });
    }

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: parseInt(sectionId),
        title,
        contentType, // "video", "text", "quiz"
        contentUrl,
        durationSeconds: parseInt(durationSeconds) || 0,
        isPreview: isPreview || false,
        orderIndex: parseInt(orderIndex) || 0,
      }
    });

    res.status(201).json({ message: 'Tạo bài học thành công', lesson });
  } catch (error) {
    console.error('Lỗi tạo lesson:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo bài học.' });
  }
};

// [PUT] Cập nhật Bài học (Admin)
const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      sectionId, title, contentType, contentUrl, 
      durationSeconds, isPreview, orderIndex 
    } = req.body;
    const parsedId = parseInt(id);

    const result = await prisma.lesson.updateMany({
      where: { id: parsedId, deletedAt: null },
      data: {
        ...(sectionId !== undefined && { sectionId: parseInt(sectionId) }),
        ...(title && { title }),
        ...(contentType && { contentType }),
        ...(contentUrl !== undefined && { contentUrl }),
        ...(durationSeconds !== undefined && { durationSeconds: parseInt(durationSeconds) }),
        ...(isPreview !== undefined && { isPreview }),
        ...(orderIndex !== undefined && { orderIndex: parseInt(orderIndex) }),
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài học hoặc bài học đã bị xóa.' });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: parsedId }
    });

    res.status(200).json({ message: 'Cập nhật bài học thành công', lesson });
  } catch (error) {
    console.error('Lỗi cập nhật lesson:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật bài học.' });
  }
};

// [DELETE] Xóa mềm Bài học (Admin)
const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);

    const lesson = await prisma.lesson.findFirst({
      where: { id: parsedId, deletedAt: null }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Không tìm thấy bài học hoặc bài học đã bị xóa.' });
    }

    await prisma.$transaction([
      prisma.lesson.update({
        where: { id: parsedId },
        data: { deletedAt: new Date() }
      }),
      prisma.quiz.updateMany({
        where: { lessonId: parsedId, deletedAt: null },
        data: { deletedAt: new Date() }
      })
    ]);

    res.status(200).json({ message: 'Bài học đã được xóa mềm.' });
  } catch (error) {
    console.error('Lỗi xóa lesson:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa bài học.' });
  }
};


// ==========================================
// QUẢN LÝ GIÁO TRÌNH & BÀI QUIZ (Admin)
// ==========================================

// [GET] Lấy toàn bộ giáo trình (Admin)
const getCourseCurriculum = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    if (!courseId) return res.status(400).json({ error: 'courseId không hợp lệ.' });

    const [sections, course] = await Promise.all([
      prisma.section.findMany({
        where: { courseId, deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { orderIndex: 'asc' },
            include: {
              quiz: {
                where: { deletedAt: null },
                include: {
                  questions: {
                    where: { deletedAt: null },
                    orderBy: { orderIndex: 'asc' },
                    include: {
                      questionOptions: {
                        orderBy: { orderIndex: 'asc' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
      })
    ]);

    res.status(200).json({ success: true, data: sections, courseTitle: course?.title || '' });
  } catch (error) {
    console.error('Lỗi lấy giáo trình:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy giáo trình.' });
  }
};

// [POST] Lưu/Upsert Bài Quiz (Admin - Reconciled Transaction)
const saveLessonQuiz = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { title, description, passingScore, maxAttempts, timeLimitMinutes, questions } = req.body;

    if (!lessonId || isNaN(lessonId)) {
      return res.status(400).json({ error: 'lessonId không hợp lệ.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Tiêu đề quiz là bắt buộc.' });
    }

    // 1. Kiểm tra bài học tồn tại và hoạt động (Security & Integrity)
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null }
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Không tìm thấy bài học hoặc bài học đã bị xóa.' });
    }

    // 2. Validate quiz settings
    const parsedPassingScore = (passingScore !== undefined && passingScore !== null && passingScore !== '') ? parseInt(passingScore) : 80;
    if (isNaN(parsedPassingScore) || parsedPassingScore < 1 || parsedPassingScore > 100) {
      return res.status(400).json({ error: 'Điểm số đạt yêu cầu phải nằm trong khoảng từ 1 đến 100.' });
    }

    const parsedMaxAttempts = parseInt(maxAttempts);
    if (!isNaN(parsedMaxAttempts) && parsedMaxAttempts < 0) {
      return res.status(400).json({ error: 'Lượt làm tối đa không được âm.' });
    }

    const parsedTimeLimit = timeLimitMinutes ? parseInt(timeLimitMinutes) : null;
    if (parsedTimeLimit !== null && parsedTimeLimit < 0) {
      return res.status(400).json({ error: 'Giới hạn thời gian không được âm.' });
    }

    // 3. DoS prevention (restrict nested array lengths)
    if (Array.isArray(questions)) {
      if (questions.length > 100) {
        return res.status(400).json({ error: 'Số lượng câu hỏi vượt quá giới hạn (tối đa 100).' });
      }
      for (const q of questions) {
        if (Array.isArray(q.options) && q.options.length > 10) {
          return res.status(400).json({ error: 'Số lượng lựa chọn cho mỗi câu hỏi vượt quá giới hạn (tối đa 10).' });
        }
      }
    }

    const quiz = await prisma.$transaction(async (tx) => {
      // Upsert Quiz
      const quizRecord = await tx.quiz.upsert({
        where: { lessonId },
        update: {
          title,
          description,
          passingScore: parsedPassingScore,
          maxAttempts: isNaN(parsedMaxAttempts) ? 0 : parsedMaxAttempts,
          timeLimitMinutes: parsedTimeLimit,
          deletedAt: null
        },
        create: {
          lessonId,
          title,
          description,
          passingScore: parsedPassingScore,
          maxAttempts: isNaN(parsedMaxAttempts) ? 0 : parsedMaxAttempts,
          timeLimitMinutes: parsedTimeLimit
        }
      });

      const quizId = quizRecord.id;

      // Only perform question/option reconciliation if questions are explicitly passed
      if (questions !== undefined && Array.isArray(questions)) {
        // Lấy các câu hỏi hiện có để đối soát xóa
        const existingQuestions = await tx.question.findMany({
          where: { quizId, deletedAt: null }
        });
        const existingQuestionIds = existingQuestions.map(q => q.id);
        const incomingQuestionIds = [];

        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
          const q = questions[qIdx];
          const qId = q.id ? parseInt(q.id) : null;

          let questionRecord;
          if (qId && existingQuestionIds.includes(qId)) {
            // Cập nhật câu hỏi cũ
            questionRecord = await tx.question.update({
              where: { id: qId },
              data: {
                questionText: q.questionText,
                questionType: q.questionType || 'single_choice',
                orderIndex: q.orderIndex !== undefined ? parseInt(q.orderIndex) : qIdx,
                deletedAt: null
              }
            });
            incomingQuestionIds.push(qId);
          } else {
            // Tạo câu hỏi mới
            questionRecord = await tx.question.create({
              data: {
                quizId,
                questionText: q.questionText,
                questionType: q.questionType || 'single_choice',
                orderIndex: q.orderIndex !== undefined ? parseInt(q.orderIndex) : qIdx
              }
            });
            incomingQuestionIds.push(questionRecord.id);
          }

          const targetQuestionId = questionRecord.id;

          // Lấy phương án trả lời hiện có
          const existingOptions = await tx.questionOption.findMany({
            where: { questionId: targetQuestionId }
          });
          const existingOptionIds = existingOptions.map(o => o.id);
          const incomingOptionIds = [];

          // Upsert options
          if (Array.isArray(q.options)) {
            for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
              const opt = q.options[oIdx];
              const optId = opt.id ? parseInt(opt.id) : null;

              if (optId && existingOptionIds.includes(optId)) {
                // Cập nhật option
                await tx.questionOption.update({
                  where: { id: optId },
                  data: {
                    optionText: opt.optionText,
                    isCorrect: !!opt.isCorrect,
                    orderIndex: opt.orderIndex !== undefined ? parseInt(opt.orderIndex) : oIdx
                  }
                });
                incomingOptionIds.push(optId);
              } else {
                // Tạo option mới
                const optionRecord = await tx.questionOption.create({
                  data: {
                    questionId: targetQuestionId,
                    optionText: opt.optionText,
                    isCorrect: !!opt.isCorrect,
                    orderIndex: opt.orderIndex !== undefined ? parseInt(opt.orderIndex) : oIdx
                  }
                });
                incomingOptionIds.push(optionRecord.id);
              }
            }
          }

          // Xóa các option không còn gửi lên
          const optionsToDelete = existingOptionIds.filter(id => !incomingOptionIds.includes(id));
          if (optionsToDelete.length > 0) {
            await tx.questionOption.deleteMany({
              where: { id: { in: optionsToDelete } }
            });
          }
        }

        // Xóa các câu hỏi không còn trong danh sách gửi lên (xóa mềm)
        const questionsToDelete = existingQuestionIds.filter(id => !incomingQuestionIds.includes(id));
        if (questionsToDelete.length > 0) {
          await tx.question.updateMany({
            where: { id: { in: questionsToDelete } },
            data: { deletedAt: new Date() }
          });
        }
      }

      return quizRecord;
    });

    res.status(200).json({ success: true, message: 'Lưu bài quiz thành công', quiz });
  } catch (error) {
    console.error('Lỗi lưu quiz:', error);
    res.status(500).json({ error: 'Lỗi server khi lưu bài quiz.' });
  }
};

// [POST] Sắp xếp các chương (Bulk Reorder - Admin)
const reorderSections = async (req, res) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Mảng sections là bắt buộc.' });
    }

    await prisma.$transaction(
      sections.map(s => prisma.section.update({
        where: { id: parseInt(s.id) },
        data: { orderIndex: parseInt(s.orderIndex) }
      }))
    );

    res.status(200).json({ success: true, message: 'Sắp xếp chương thành công.' });
  } catch (error) {
    console.error('Lỗi reorder sections:', error);
    res.status(500).json({ error: 'Lỗi server khi sắp xếp chương.' });
  }
};

// [POST] Sắp xếp các bài học (Bulk Reorder - Admin)
const reorderLessons = async (req, res) => {
  try {
    const { lessons } = req.body;
    if (!Array.isArray(lessons)) {
      return res.status(400).json({ error: 'Mảng lessons là bắt buộc.' });
    }

    await prisma.$transaction(
      lessons.map(l => prisma.lesson.update({
        where: { id: parseInt(l.id) },
        data: {
          orderIndex: parseInt(l.orderIndex),
          ...(l.sectionId !== undefined && { sectionId: parseInt(l.sectionId) })
        }
      }))
    );

    res.status(200).json({ success: true, message: 'Sắp xếp bài học thành công.' });
  } catch (error) {
    console.error('Lỗi reorder lessons:', error);
    res.status(500).json({ error: 'Lỗi server khi sắp xếp bài học.' });
  }
};

module.exports = {
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  getCourseCurriculum,
  saveLessonQuiz,
  reorderSections,
  reorderLessons
};