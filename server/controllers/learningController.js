const prisma = require('../lib/prisma');

// =====================================================
// LEARNING CONTROLLER
// Phạm vi: API học tập của user sau khi đã đăng nhập/enroll
// =====================================================

const ACTIVE_ENROLLMENT_STATUS = 'active';
const PUBLISHED_COURSE_STATUS = 'published';

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
  return res.status(200).json({ success: true, message, data });
};

const created = (res, data, message = 'Tạo mới thành công') => {
  return res.status(201).json({ success: true, message, data });
};

const error = (res, status, message) => {
  return res.status(status).json({ success: false, error: message });
};

const isEnrollmentActive = (enrollment) => {
  if (!enrollment) return false;
  if (enrollment.status !== ACTIVE_ENROLLMENT_STATUS) return false;
  if (enrollment.revokedAt) return false;
  if (enrollment.expiresAt && enrollment.expiresAt < new Date()) return false;
  return true;
};

const findActiveEnrollment = async (userId, courseId) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  return isEnrollmentActive(enrollment) ? enrollment : null;
};

const getCourseProgressData = async (userId, courseId) => {
  const totalLessons = await prisma.lesson.count({
    where: {
      deletedAt: null,
      section: {
        deletedAt: null,
        courseId,
        course: { deletedAt: null },
      },
    },
  });

  const completedLessons = await prisma.lessonCompletion.count({
    where: {
      userId,
      completedAt: { not: null },
      lesson: {
        deletedAt: null,
        section: {
          deletedAt: null,
          courseId,
        },
      },
    },
  });

  const progressPercent = totalLessons === 0
    ? 0
    : Math.round((completedLessons / totalLessons) * 100);

  const lastProgress = await prisma.lessonCompletion.findFirst({
    where: {
      userId,
      lesson: {
        deletedAt: null,
        section: {
          deletedAt: null,
          courseId,
        },
      },
    },
    orderBy: [
      { completedAt: 'desc' },
      { id: 'desc' },
    ],
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return {
    courseId,
    totalLessons,
    completedLessons,
    progressPercent,
    lastLearningLessonId: lastProgress?.lesson?.id || null,
    lastLearningLessonTitle: lastProgress?.lesson?.title || null,
  };
};

const getLessonWithCourse = async (lessonId) => {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              deletedAt: true,
            },
          },
        },
      },
      attachments: true,
      quiz: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          description: true,
          passingScore: true,
          timeLimitMinutes: true,
          maxAttempts: true,
        },
      },
    },
  });
};

const checkLessonAccess = async (userId, lesson) => {
  if (!lesson || lesson.deletedAt || lesson.section?.deletedAt || lesson.section?.course?.deletedAt) {
    return { allowed: false, status: 404, message: 'Bài học không tồn tại hoặc đã bị xóa.' };
  }

  if (lesson.section.course.status !== PUBLISHED_COURSE_STATUS) {
    return {
      allowed: false,
      status: 403,
      message: 'Khóa học chưa được xuất bản nên chưa thể truy cập bài học.',
    };
  }

  const courseId = lesson.section.course.id;

  if (lesson.isPreview) {
    return { allowed: true, courseId, enrollment: null };
  }

  const enrollment = await findActiveEnrollment(userId, courseId);

  if (!enrollment) {
    return {
      allowed: false,
      status: 403,
      message: 'Bạn cần đăng ký/thanh toán khóa học để xem nội dung này.',
    };
  }

  return { allowed: true, courseId, enrollment };
};

// =====================================================
// 1. GET /api/learning/my-courses
// Lấy danh sách khóa học user đã enroll để hiển thị My Learning
// =====================================================
const getMyLearningCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: ACTIVE_ENROLLMENT_STATUS,
        revokedAt: null,
        course: { deletedAt: null },
      },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            shortDescription: true,
            status: true,
            creator: {
              select: { id: true, username: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const activeEnrollments = enrollments.filter(isEnrollmentActive);

    const data = await Promise.all(
      activeEnrollments.map(async (enrollment) => {
        const progress = await getCourseProgressData(userId, enrollment.courseId);

        return {
          enrollmentId: enrollment.id,
          courseId: enrollment.course.id,
          title: enrollment.course.title,
          slug: enrollment.course.slug,
          thumbnailUrl: enrollment.course.thumbnailUrl,
          shortDescription: enrollment.course.shortDescription,
          instructor: enrollment.course.creator,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          expiresAt: enrollment.expiresAt,
          progressPercent: progress.progressPercent,
          totalLessons: progress.totalLessons,
          completedLessons: progress.completedLessons,
          lastLearningLessonId: progress.lastLearningLessonId,
          lastLearningLessonTitle: progress.lastLearningLessonTitle,
        };
      })
    );

    return success(res, data, 'Lấy danh sách khóa học đang học thành công');
  } catch (err) {
    console.error('Lỗi getMyLearningCourses:', err);
    return error(res, 500, 'Lỗi server khi lấy danh sách khóa học đang học.');
  }
};

// =====================================================
// 2. GET /api/learning/courses/:courseId
// Lấy nội dung khóa học để user học: course -> sections -> lessons + progress
// =====================================================
const getLearningCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = getParamId(req, 'courseId');

    if (!courseId) return error(res, 400, 'courseId không hợp lệ.');

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: { select: { id: true, username: true, email: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        sections: {
          where: { deletedAt: null },
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                contentType: true,
                durationSeconds: true,
                isPreview: true,
                orderIndex: true,
                lessonCompletions: {
                  where: { userId },
                  select: {
                    completedAt: true,
                    lastCheckpointTime: true,
                    timeSpentSeconds: true,
                  },
                },
                quiz: {
                  where: { deletedAt: null },
                  select: { id: true, title: true, passingScore: true },
                },
                _count: { select: { attachments: true } },
              },
            },
          },
        },
      },
    });

    if (!course || course.deletedAt) {
      return error(res, 404, 'Khóa học không tồn tại hoặc đã bị xóa.');
    }
    
    if (course.status !== PUBLISHED_COURSE_STATUS) {
      return error(res, 403, 'Khóa học chưa được xuất bản nên chưa thể học.');
    }

    const enrollment = await findActiveEnrollment(userId, courseId);
    if (!enrollment) {
      return error(res, 403, 'Bạn cần đăng ký/thanh toán khóa học để vào trang học.');
    }

    const progress = await getCourseProgressData(userId, courseId);

    const sections = course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      orderIndex: section.orderIndex,
      lessons: section.lessons.map((lesson) => {
        const lessonProgress = lesson.lessonCompletions[0];
        return {
          id: lesson.id,
          title: lesson.title,
          contentType: lesson.contentType,
          durationSeconds: lesson.durationSeconds,
          isPreview: lesson.isPreview,
          orderIndex: lesson.orderIndex,
          isCompleted: !!lessonProgress?.completedAt,
          completedAt: lessonProgress?.completedAt || null,
          lastCheckpointTime: lessonProgress?.lastCheckpointTime || 0,
          timeSpentSeconds: lessonProgress?.timeSpentSeconds || 0,
          quizId: lesson.quiz?.id || null,
          attachmentCount: lesson._count.attachments,
        };
      }),
    }));

    return success(res, {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        level: course.level,
        status: course.status,
        category: course.category,
        instructor: course.creator,
        enrolledAt: enrollment.enrolledAt,
        expiresAt: enrollment.expiresAt,
        progressPercent: progress.progressPercent,
        totalLessons: progress.totalLessons,
        completedLessons: progress.completedLessons,
        lastLearningLessonId: progress.lastLearningLessonId,
        lastLearningLessonTitle: progress.lastLearningLessonTitle,
      },
      sections,
    }, 'Lấy nội dung khóa học đang học thành công');
  } catch (err) {
    console.error('Lỗi getLearningCourse:', err);
    return error(res, 500, 'Lỗi server khi lấy nội dung khóa học đang học.');
  }
};

// =====================================================
// 3. GET /api/learning/courses/:courseId/progress
// Lấy tiến độ toàn khóa
// =====================================================
const getCourseProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = getParamId(req, 'courseId');

    if (!courseId) return error(res, 400, 'courseId không hợp lệ.');

    const enrollment = await findActiveEnrollment(userId, courseId);
    if (!enrollment) {
      return error(res, 403, 'Bạn chưa đăng ký hoặc đã hết quyền học khóa học này.');
    }

    const progress = await getCourseProgressData(userId, courseId);
    return success(res, progress, 'Lấy tiến độ khóa học thành công');
  } catch (err) {
    console.error('Lỗi getCourseProgress:', err);
    return error(res, 500, 'Lỗi server khi lấy tiến độ khóa học.');
  }
};

// =====================================================
// 4. GET /api/learning/lessons/:lessonId
// Mở chi tiết bài học
// =====================================================
const getLessonDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const lessonId = getParamId(req, 'lessonId', 'id');

    if (!lessonId) return error(res, 400, 'lessonId không hợp lệ.');

    const lesson = await getLessonWithCourse(lessonId);
    const access = await checkLessonAccess(userId, lesson);

    if (!access.allowed) {
      return error(res, access.status, access.message);
    }

    const progress = await prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    return success(res, {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        contentType: lesson.contentType,
        contentUrl: lesson.contentUrl,
        durationSeconds: lesson.durationSeconds,
        isPreview: lesson.isPreview,
        orderIndex: lesson.orderIndex,
        quiz: lesson.quiz,
      },
      course: {
        id: lesson.section.course.id,
        title: lesson.section.course.title,
        slug: lesson.section.course.slug,
      },
      section: {
        id: lesson.section.id,
        title: lesson.section.title,
        orderIndex: lesson.section.orderIndex,
      },
      progress: {
        isCompleted: !!progress?.completedAt,
        completedAt: progress?.completedAt || null,
        lastCheckpointTime: progress?.lastCheckpointTime || 0,
        timeSpentSeconds: progress?.timeSpentSeconds || 0,
      },
      attachments: lesson.attachments,
    }, 'Mở bài học thành công');
  } catch (err) {
    console.error('Lỗi getLessonDetail:', err);
    return error(res, 500, 'Lỗi server khi mở bài học.');
  }
};

// =====================================================
// 5. POST /api/learning/lessons/:lessonId/progress
// Lưu checkpoint xem video/bài học
// Body: { currentTime } hoặc { current_time }
// =====================================================
const updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const lessonId = getParamId(req, 'lessonId', 'id');
    const rawCurrentTime = req.body.currentTime ?? req.body.current_time;
    const currentTime = Math.floor(Number(rawCurrentTime));

    if (!lessonId) return error(res, 400, 'lessonId không hợp lệ.');
    if (!Number.isFinite(currentTime) || currentTime < 0) {
      return error(res, 400, 'currentTime phải là số giây hợp lệ và >= 0.');
    }

    const lesson = await getLessonWithCourse(lessonId);
    const access = await checkLessonAccess(userId, lesson);

    if (!access.allowed) {
      return error(res, access.status, access.message);
    }

    if (lesson.contentType === 'quiz') {
      return error(res, 400, 'Bài quiz không cập nhật tiến độ bằng API xem video.');
    }

    const oldProgress = await prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    const safeCurrentTime = lesson.durationSeconds > 0
      ? Math.min(currentTime, lesson.durationSeconds)
      : currentTime;

    // Không ghi lùi checkpoint. Ví dụ DB đang 200s mà frontend gửi 100s thì giữ 200s.
    const nextCheckpoint = Math.max(oldProgress?.lastCheckpointTime || 0, safeCurrentTime);

    const progress = await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        lastCheckpointTime: nextCheckpoint,
        timeSpentSeconds: Math.max(oldProgress?.timeSpentSeconds || 0, nextCheckpoint),
      },
      create: {
        userId,
        lessonId,
        lastCheckpointTime: nextCheckpoint,
        timeSpentSeconds: nextCheckpoint,
      },
    });

    return success(res, {
      lessonId,
      lastCheckpointTime: progress.lastCheckpointTime,
      timeSpentSeconds: progress.timeSpentSeconds,
      isCompleted: !!progress.completedAt,
    }, 'Đã lưu tiến độ học');
  } catch (err) {
    console.error('Lỗi updateProgress:', err);
    return error(res, 500, 'Lỗi server khi lưu tiến độ học.');
  }
};

// =====================================================
// 6. POST /api/learning/lessons/:lessonId/complete
// Đánh dấu hoàn thành bài học
// =====================================================
const completeLesson = async (req, res) => {
  try {
    const userId = req.user.id;
    const lessonId = getParamId(req, 'lessonId', 'id');

    if (!lessonId) return error(res, 400, 'lessonId không hợp lệ.');

    const lesson = await getLessonWithCourse(lessonId);
    const access = await checkLessonAccess(userId, lesson);

    if (!access.allowed) {
      return error(res, access.status, access.message);
    }

    if (lesson.contentType === 'quiz') {
      return error(res, 400, 'Bài quiz phải hoàn thành bằng cách nộp bài quiz, không thể hoàn thành thủ công.');
    }

    const progress = await prisma.lessonCompletion.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (lesson.contentType === 'video' && lesson.durationSeconds > 0) {
      const lastCheckpoint = progress?.lastCheckpointTime || 0;
      const requiredSeconds = Math.floor(lesson.durationSeconds * 0.9);

      if (lastCheckpoint < requiredSeconds) {
        return error(
          res,
          400,
          `Bạn cần xem ít nhất 90% video. Hiện tại mới xem ${lastCheckpoint}/${lesson.durationSeconds} giây.`
        );
      }
    }

    const now = new Date();
    const completion = await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        completedAt: progress?.completedAt || now,
        lastCheckpointTime: Math.max(progress?.lastCheckpointTime || 0, lesson.durationSeconds || 0),
      },
      create: {
        userId,
        lessonId,
        completedAt: now,
        lastCheckpointTime: lesson.durationSeconds || 0,
        timeSpentSeconds: lesson.durationSeconds || 0,
      },
    });

    const courseProgress = await getCourseProgressData(userId, access.courseId);

    return success(res, {
      lessonId,
      isCompleted: true,
      completedAt: completion.completedAt,
      courseProgressPercent: courseProgress.progressPercent,
      courseProgress,
    }, 'Chúc mừng bạn đã hoàn thành bài học');
  } catch (err) {
    console.error('Lỗi completeLesson:', err);
    return error(res, 500, 'Lỗi server khi hoàn thành bài học.');
  }
};

// =====================================================
// 7. GET /api/learning/lessons/:lessonId/next
// Lấy bài học tiếp theo trong cùng khóa học
// =====================================================
const getNextLesson = async (req, res) => {
  try {
    const userId = req.user.id;
    const lessonId = getParamId(req, 'lessonId', 'id');

    if (!lessonId) return error(res, 400, 'lessonId không hợp lệ.');

    const currentLesson = await getLessonWithCourse(lessonId);
    const access = await checkLessonAccess(userId, currentLesson);

    if (!access.allowed) {
      return error(res, access.status, access.message);
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        deletedAt: null,
        section: {
          deletedAt: null,
          courseId: access.courseId,
        },
      },
      orderBy: [
        { section: { orderIndex: 'asc' } },
        { orderIndex: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        title: true,
        contentType: true,
        durationSeconds: true,
        isPreview: true,
        orderIndex: true,
        sectionId: true,
        section: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
          },
        },
      },
    });

    const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] || null : null;

    return success(res, {
      currentLessonId: lessonId,
      nextLesson,
      isCourseFinished: !nextLesson,
    }, nextLesson ? 'Lấy bài học tiếp theo thành công' : 'Bạn đã học đến bài cuối của khóa học');
  } catch (err) {
    console.error('Lỗi getNextLesson:', err);
    return error(res, 500, 'Lỗi server khi lấy bài học tiếp theo.');
  }
};

// =====================================================
// 8. GET /api/learning/lessons/:lessonId/attachments
// Lấy tài liệu đính kèm của bài học
// =====================================================
const getLessonAttachments = async (req, res) => {
  try {
    const userId = req.user.id;
    const lessonId = getParamId(req, 'lessonId', 'id');

    if (!lessonId) return error(res, 400, 'lessonId không hợp lệ.');

    const lesson = await getLessonWithCourse(lessonId);
    const access = await checkLessonAccess(userId, lesson);

    if (!access.allowed) {
      return error(res, access.status, access.message);
    }

    return success(res, lesson.attachments, 'Lấy tài liệu đính kèm thành công');
  } catch (err) {
    console.error('Lỗi getLessonAttachments:', err);
    return error(res, 500, 'Lỗi server khi lấy tài liệu đính kèm.');
  }
};

// =====================================================
// 9. GET /api/learning/lessons/:lessonId/quiz
// Lấy thông tin quiz của bài học, không trả đáp án đúng
// =====================================================
const getLessonQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const lessonId = getParamId(req, 'lessonId', 'id');

    if (!lessonId) return error(res, 400, 'lessonId không hợp lệ.');

    const lesson = await getLessonWithCourse(lessonId);
    const access = await checkLessonAccess(userId, lesson);

    if (!access.allowed) {
      return error(res, access.status, access.message);
    }

    if (!lesson.quiz) {
      return error(res, 404, 'Bài học này chưa có quiz.');
    }

    const [totalQuestions, attemptCount] = await Promise.all([
      prisma.question.count({ where: { quizId: lesson.quiz.id, deletedAt: null } }),
      prisma.userQuizAttempt.count({ where: { userId, quizId: lesson.quiz.id } }),
    ]);

    const canAttempt = lesson.quiz.maxAttempts === 0 || attemptCount < lesson.quiz.maxAttempts;

    return success(res, {
      quiz: {
        id: lesson.quiz.id,
        lessonId: lesson.id,
        title: lesson.quiz.title,
        description: lesson.quiz.description,
        passingScore: lesson.quiz.passingScore,
        timeLimitMinutes: lesson.quiz.timeLimitMinutes,
        maxAttempts: lesson.quiz.maxAttempts,
        totalQuestions,
        attemptCount,
        canAttempt,
      },
    }, 'Lấy thông tin quiz thành công');
  } catch (err) {
    console.error('Lỗi getLessonQuiz:', err);
    return error(res, 500, 'Lỗi server khi lấy thông tin quiz.');
  }
};

// =====================================================
// 10. POST /api/learning/quizzes/:quizId/start
// Bắt đầu làm quiz, tạo attempt
// =====================================================
const startQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = getParamId(req, 'quizId');

    if (!quizId) return error(res, 400, 'quizId không hợp lệ.');

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            section: {
              include: { course: true },
            },
          },
        },
      },
    });

    if (
      !quiz ||
      !quiz.lesson ||
      !quiz.lesson.section ||
      !quiz.lesson.section.course ||
      quiz.deletedAt ||
      quiz.lesson.deletedAt ||
      quiz.lesson.section.deletedAt ||
      quiz.lesson.section.course.deletedAt
    ) {
      return error(res, 404, 'Quiz không tồn tại hoặc đã bị xóa.');
    }

    const access = await checkLessonAccess(userId, quiz.lesson);
    if (!access.allowed) {
      return error(res, access.status, access.message);
    }

    const totalQuestions = await prisma.question.count({
      where: {
        quizId,
        deletedAt: null,
      },
    });

    if (totalQuestions === 0) {
      return error(res, 400, 'Quiz chưa có câu hỏi nên chưa thể bắt đầu làm bài.');
    }

    const inProgressAttempt = await prisma.userQuizAttempt.findFirst({
      where: { userId, quizId, status: 'in_progress' },
      orderBy: { startedAt: 'desc' },
    });

    if (inProgressAttempt) {
      const expiredAt = quiz.timeLimitMinutes
        ? new Date(inProgressAttempt.startedAt.getTime() + quiz.timeLimitMinutes * 60 * 1000)
        : null;

      return success(res, {
        attemptId: inProgressAttempt.id,
        quizId,
        attemptNumber: inProgressAttempt.attemptNumber,
        startedAt: inProgressAttempt.startedAt,
        expiredAt,
        totalQuestions,
        reused: true,
      }, 'Bạn đang có một lượt làm quiz chưa nộp, hệ thống trả lại lượt làm cũ');
    }

    const attemptCount = await prisma.userQuizAttempt.count({ where: { userId, quizId } });
    if (quiz.maxAttempts > 0 && attemptCount >= quiz.maxAttempts) {
      return error(res, 400, `Bạn đã dùng hết số lượt làm quiz. Tối đa: ${quiz.maxAttempts} lượt.`);
    }

    const attempt = await prisma.userQuizAttempt.create({
      data: {
        userId,
        quizId,
        status: 'in_progress',
        attemptNumber: attemptCount + 1,
      },
    });

    const expiredAt = quiz.timeLimitMinutes
      ? new Date(attempt.startedAt.getTime() + quiz.timeLimitMinutes * 60 * 1000)
      : null;

    return created(res, {
      attemptId: attempt.id,
      quizId,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt,
      expiredAt,
      totalQuestions,
    }, 'Bắt đầu làm quiz thành công');
  } catch (err) {
    console.error('Lỗi startQuiz:', err);
    return error(res, 500, 'Lỗi server khi bắt đầu làm quiz.');
  }
};

const checkAttemptOwnerAndTime = async (userId, attemptId) => {
  const attempt = await prisma.userQuizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          lesson: {
            include: {
              section: { include: { course: true } },
            },
          },
        },
      },
    },
  });

  if (!attempt) return { ok: false, status: 404, message: 'Không tìm thấy lượt làm quiz.' };
  if (attempt.userId !== userId) return { ok: false, status: 403, message: 'Bạn không có quyền truy cập lượt làm quiz này.' };

  if (attempt.status !== 'in_progress') {
    return { ok: false, status: 400, message: 'Lượt làm quiz này đã kết thúc.' };
  }

  if (attempt.quiz.timeLimitMinutes) {
    const expiredAt = new Date(attempt.startedAt.getTime() + attempt.quiz.timeLimitMinutes * 60 * 1000);
    if (new Date() > expiredAt) {
      await prisma.userQuizAttempt.update({
        where: { id: attemptId },
        data: { status: 'expired', finishedAt: new Date(), score: 0, passed: false },
      });
      return { ok: false, status: 400, message: 'Đã hết thời gian làm quiz.' };
    }
  }

  const access = await checkLessonAccess(userId, attempt.quiz.lesson);
  if (!access.allowed) return { ok: false, status: access.status, message: access.message };

  return { ok: true, attempt, courseId: access.courseId };
};

// =====================================================
// 11. GET /api/learning/quiz-attempts/:attemptId/questions
// Lấy câu hỏi trong attempt, tuyệt đối không trả isCorrect
// =====================================================
const getQuizAttemptQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const attemptId = getParamId(req, 'attemptId');

    if (!attemptId) return error(res, 400, 'attemptId không hợp lệ.');

    const checked = await checkAttemptOwnerAndTime(userId, attemptId);
    if (!checked.ok) return error(res, checked.status, checked.message);

    const questions = await prisma.question.findMany({
      where: { quizId: checked.attempt.quizId, deletedAt: null },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        orderIndex: true,
        questionOptions: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            optionText: true,
            orderIndex: true,
          },
        },
      },
    });

    const expiredAt = checked.attempt.quiz.timeLimitMinutes
      ? new Date(checked.attempt.startedAt.getTime() + checked.attempt.quiz.timeLimitMinutes * 60 * 1000)
      : null;

    return success(res, {
      attemptId,
      quizId: checked.attempt.quizId,
      startedAt: checked.attempt.startedAt,
      expiredAt,
      questions: questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        orderIndex: question.orderIndex,
        options: question.questionOptions,
      })),
    }, 'Lấy câu hỏi quiz thành công');
  } catch (err) {
    console.error('Lỗi getQuizAttemptQuestions:', err);
    return error(res, 500, 'Lỗi server khi lấy câu hỏi quiz.');
  }
};

// =====================================================
// 12. POST /api/learning/quiz-attempts/:attemptId/submit
// Nộp quiz và backend tự chấm điểm
// Body: { answers: [{ questionId, selectedOptionId }] }
// =====================================================
const submitQuizAttempt = async (req, res) => {
  try {
    const userId = req.user.id;
    const attemptId = getParamId(req, 'attemptId');
    const { answers } = req.body;

    if (!attemptId) return error(res, 400, 'attemptId không hợp lệ.');
    if (!Array.isArray(answers)) return error(res, 400, 'answers phải là một mảng.');

    const checked = await checkAttemptOwnerAndTime(userId, attemptId);
    if (!checked.ok) return error(res, checked.status, checked.message);

    const questions = await prisma.question.findMany({
      where: { quizId: checked.attempt.quizId, deletedAt: null },
      include: {
        questionOptions: true,
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (questions.length === 0) {
      return error(res, 400, 'Quiz chưa có câu hỏi nên không thể nộp bài.');
    }

    const answerMap = new Map(
      answers.map((answer) => [Number(answer.questionId), Number(answer.selectedOptionId)])
    );

    let correctAnswers = 0;
    const userAnswersData = [];

    for (const question of questions) {
      const selectedOptionId = answerMap.get(question.id) || null;

      const selectedOption = selectedOptionId
        ? question.questionOptions.find((option) => option.id === selectedOptionId)
        : null;

      if (selectedOptionId && !selectedOption) {
        return error(
          res,
          400,
          `Đáp án đã chọn không hợp lệ cho câu hỏi ${question.id}.`
        );
      }

      const isCorrect = !!selectedOption?.isCorrect;
      if (isCorrect) correctAnswers += 1;

      userAnswersData.push({
        attemptId,
        questionId: question.id,
        selectedOptionId: selectedOption ? selectedOption.id : null,
        isCorrect,
      });
    }

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= checked.attempt.quiz.passingScore;
    const finishedAt = new Date();

    await prisma.$transaction([
      ...userAnswersData.map((answerData) =>
        prisma.userAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: answerData.attemptId,
              questionId: answerData.questionId,
            },
          },
          update: {
            selectedOptionId: answerData.selectedOptionId,
            isCorrect: answerData.isCorrect,
          },
          create: answerData,
        })
      ),
      prisma.userQuizAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'submitted',
          finishedAt,
          score,
          passed,
        },
      }),
      ...(passed
        ? [
            prisma.lessonCompletion.upsert({
              where: {
                userId_lessonId: {
                  userId,
                  lessonId: checked.attempt.quiz.lessonId,
                },
              },
              update: { completedAt: finishedAt },
              create: {
                userId,
                lessonId: checked.attempt.quiz.lessonId,
                completedAt: finishedAt,
              },
            }),
          ]
        : []),
    ]);

    const courseProgress = await getCourseProgressData(userId, checked.courseId);

    return success(res, {
      attemptId,
      quizId: checked.attempt.quizId,
      score,
      passed,
      correctAnswers,
      totalQuestions: questions.length,
      finishedAt,
      courseProgressPercent: courseProgress.progressPercent,
      courseProgress,
    }, 'Nộp bài quiz thành công');
  } catch (err) {
    console.error('Lỗi submitQuizAttempt:', err);
    return error(res, 500, 'Lỗi server khi nộp bài quiz.');
  }
};

// =====================================================
// 13. GET /api/learning/quiz-attempts/:attemptId/result
// Xem kết quả quiz sau khi đã nộp
// =====================================================
const getQuizAttemptResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const attemptId = getParamId(req, 'attemptId');

    if (!attemptId) return error(res, 400, 'attemptId không hợp lệ.');

    const attempt = await prisma.userQuizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            lesson: {
              include: {
                section: { include: { course: true } },
              },
            },
          },
        },
        userAnswers: {
          include: {
            question: {
              include: {
                questionOptions: true,
              },
            },
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) return error(res, 404, 'Không tìm thấy lượt làm quiz.');
    if (attempt.userId !== userId) return error(res, 403, 'Bạn không có quyền xem kết quả này.');
    if (attempt.status === 'in_progress') return error(res, 400, 'Quiz chưa được nộp nên chưa có kết quả.');

    const questions = attempt.userAnswers
      .sort((a, b) => a.question.orderIndex - b.question.orderIndex)
      .map((answer) => {
        const correctOption = answer.question.questionOptions.find((option) => option.isCorrect);
        return {
          questionId: answer.questionId,
          questionText: answer.question.questionText,
          selectedOptionId: answer.selectedOptionId,
          selectedOptionText: answer.selectedOption?.optionText || null,
          correctOptionId: correctOption?.id || null,
          correctOptionText: correctOption?.optionText || null,
          isCorrect: answer.isCorrect,
        };
      });

    return success(res, {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz.title,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: attempt.score,
      passed: attempt.passed,
      passingScore: attempt.quiz.passingScore,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      questions,
    }, 'Lấy kết quả quiz thành công');
  } catch (err) {
    console.error('Lỗi getQuizAttemptResult:', err);
    return error(res, 500, 'Lỗi server khi lấy kết quả quiz.');
  }
};

// =====================================================
// 14. GET /api/learning/quizzes/:quizId/attempts
// Lấy lịch sử làm quiz của user
// =====================================================
const getQuizAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = getParamId(req, 'quizId');

    if (!quizId) return error(res, 400, 'quizId không hợp lệ.');

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            section: { include: { course: true } },
          },
        },
      },
    });

    if (!quiz || quiz.deletedAt) return error(res, 404, 'Quiz không tồn tại.');

    const access = await checkLessonAccess(userId, quiz.lesson);
    if (!access.allowed) return error(res, access.status, access.message);

    const attempts = await prisma.userQuizAttempt.findMany({
      where: { userId, quizId },
      orderBy: { attemptNumber: 'asc' },
      select: {
        id: true,
        attemptNumber: true,
        status: true,
        score: true,
        passed: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    return success(res, attempts.map((attempt) => ({
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: attempt.score,
      passed: attempt.passed,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
    })), 'Lấy lịch sử làm quiz thành công');
  } catch (err) {
    console.error('Lỗi getQuizAttempts:', err);
    return error(res, 500, 'Lỗi server khi lấy lịch sử làm quiz.');
  }
};

module.exports = {
  getMyLearningCourses,
  getLearningCourse,
  getCourseProgress,
  getLessonDetail,
  updateProgress,
  completeLesson,
  getNextLesson,
  getLessonAttachments,
  getLessonQuiz,
  startQuiz,
  getQuizAttemptQuestions,
  submitQuizAttempt,
  getQuizAttemptResult,
  getQuizAttempts,
};
