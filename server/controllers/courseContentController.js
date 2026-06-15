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

    const parsedCourseId = parseInt(courseId, 10);
    const course = await prisma.course.findFirst({
      where: { id: parsedCourseId, deletedAt: null }
    });

    if (!course) {
      return res.status(404).json({ error: 'Khóa học không tồn tại hoặc đã bị xóa.' });
    }

    const section = await prisma.section.create({
      data: {
        courseId: parsedCourseId,
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

    // Lấy danh sách ID các bài học đang hoạt động trong chương này
    const activeLessons = await prisma.lesson.findMany({
      where: { sectionId: parsedId, deletedAt: null },
      select: { id: true }
    });
    const lessonIds = activeLessons.map(l => l.id);

    await prisma.$transaction([
      prisma.section.update({
        where: { id: parsedId },
        data: { deletedAt: new Date() }
      }),
      prisma.lesson.updateMany({
        where: { sectionId: parsedId, deletedAt: null },
        data: { deletedAt: new Date() }
      }),
      ...(lessonIds.length > 0 ? [
        prisma.quiz.updateMany({
          where: { lessonId: { in: lessonIds }, deletedAt: null },
          data: { deletedAt: new Date() }
        })
      ] : [])
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

    const parsedSectionId = parseInt(sectionId, 10);
    const section = await prisma.section.findFirst({
      where: { id: parsedSectionId, deletedAt: null }
    });

    if (!section) {
      return res.status(404).json({ error: 'Chương học không tồn tại hoặc đã bị xóa.' });
    }

    const lesson = await prisma.lesson.create({
      data: {
        sectionId: parsedSectionId,
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
              attachments: true,
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

    // 3. Schema & Nested validation + DoS prevention
    if (questions !== undefined) {
      if (!Array.isArray(questions)) {
        return res.status(400).json({ error: 'questions phải là một mảng.' });
      }
      if (questions.length > 100) {
        return res.status(400).json({ error: 'Số lượng câu hỏi vượt quá giới hạn (tối đa 100).' });
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || typeof q.questionText !== 'string' || !q.questionText.trim()) {
          return res.status(400).json({ error: `Nội dung câu hỏi thứ ${i + 1} không được để trống.` });
        }
        if (q.questionText.length > 5000) {
          return res.status(400).json({ error: `Nội dung câu hỏi thứ ${i + 1} quá dài (tối đa 5000 ký tự).` });
        }
        if (!Array.isArray(q.options) || q.options.length === 0) {
          return res.status(400).json({ error: `Câu hỏi thứ ${i + 1} phải có ít nhất một lựa chọn trả lời.` });
        }
        if (q.options.length > 10) {
          return res.status(400).json({ error: `Câu hỏi thứ ${i + 1} có quá nhiều lựa chọn (tối đa 10).` });
        }
        
        let hasCorrect = false;
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          if (!opt.optionText || typeof opt.optionText !== 'string' || !opt.optionText.trim()) {
            return res.status(400).json({ error: `Nội dung lựa chọn thứ ${j + 1} của câu hỏi thứ ${i + 1} không được để trống.` });
          }
          if (opt.optionText.length > 1000) {
            return res.status(400).json({ error: `Nội dung lựa chọn thứ ${j + 1} của câu hỏi thứ ${i + 1} quá dài (tối đa 1000 ký tự).` });
          }
          if (opt.isCorrect) {
            hasCorrect = true;
          }
        }
        
        if (!hasCorrect) {
          return res.status(400).json({ error: `Câu hỏi thứ ${i + 1} phải có ít nhất một đáp án đúng.` });
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

    const sectionIds = sections.map(s => parseInt(s.id));
    const activeSectionsCount = await prisma.section.count({
      where: { id: { in: sectionIds }, deletedAt: null }
    });
    if (activeSectionsCount !== sections.length) {
      return res.status(400).json({ error: 'Một hoặc nhiều chương không tồn tại hoặc đã bị xóa.' });
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

    const lessonIds = lessons.map(l => parseInt(l.id));
    const activeLessonsCount = await prisma.lesson.count({
      where: { id: { in: lessonIds }, deletedAt: null }
    });
    if (activeLessonsCount !== lessons.length) {
      return res.status(400).json({ error: 'Một hoặc nhiều bài học không tồn tại hoặc đã bị xóa.' });
    }

    const targetSectionIds = [...new Set(lessons.filter(l => l.sectionId !== undefined).map(l => parseInt(l.sectionId)))];
    if (targetSectionIds.length > 0) {
      const activeSectionsCount = await prisma.section.count({
        where: { id: { in: targetSectionIds }, deletedAt: null }
      });
      if (activeSectionsCount !== targetSectionIds.length) {
        return res.status(400).json({ error: 'Một hoặc nhiều chương đích không tồn tại hoặc đã bị xóa.' });
      }
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

// ==========================================
// QUẢN LÝ TÀI LIỆU ĐÍNH KÈM (ATTACHMENTS)
// ==========================================

// [POST] Upload tài liệu đính kèm
const uploadAttachment = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (!lessonId || isNaN(lessonId)) {
      return res.status(400).json({ error: 'lessonId không hợp lệ.' });
    }

    if (!req.file || !req.file.safeUrl) {
      return res.status(400).json({ error: 'Không tìm thấy file tải lên.' });
    }

    // Validate lesson
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null }
    });
    if (!lesson) {
      return res.status(404).json({ error: 'Không tìm thấy bài học hoặc bài học đã bị xóa.' });
    }

    const attachment = await prisma.attachment.create({
      data: {
        lessonId: lessonId,
        fileName: req.file.originalName || req.file.originalname || 'unknown',
        fileUrl: req.file.safeUrl,
        fileType: req.file.mimetype || 'application/octet-stream',
        fileSize: req.file.size || 0
      }
    });

    res.status(201).json({ success: true, message: 'Tải file đính kèm thành công.', attachment });
  } catch (error) {
    console.error('Lỗi upload attachment:', error);
    res.status(500).json({ error: 'Lỗi server khi lưu tài liệu đính kèm.' });
  }
};

// [DELETE] Xóa tài liệu đính kèm
const deleteAttachment = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID tài liệu không hợp lệ.' });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Không tìm thấy tài liệu đính kèm.' });
    }

    await prisma.attachment.delete({
      where: { id }
    });

    // Cố gắng xóa file vật lý
    const fs = require('fs');
    const path = require('path');
    if (attachment.fileUrl.startsWith('/api/files/')) {
      const fileName = attachment.fileUrl.replace('/api/files/', '');
      const filePath = path.join(__dirname, '../../storage/uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json({ success: true, message: 'Đã xóa tài liệu đính kèm.' });
  } catch (error) {
    console.error('Lỗi xoá attachment:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa tài liệu.' });
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
  reorderLessons,
  uploadAttachment,
  deleteAttachment
};