const prisma = require('../lib/prisma');

// POST /api/reports
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const userId = req.user.id;

    if (!['course', 'lesson'].includes(targetType)) {
      return res.status(400).json({ status: 'error', message: 'Loại báo cáo không hợp lệ.' });
    }

    if (!targetId || !reason) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp đủ thông tin.' });
    }

    // Verify target exists
    if (targetType === 'course') {
      const course = await prisma.course.findUnique({ where: { id: parseInt(targetId) } });
      if (!course) return res.status(404).json({ status: 'error', message: 'Không tìm thấy khóa học.' });
    } else {
      const lesson = await prisma.lesson.findUnique({ where: { id: parseInt(targetId) } });
      if (!lesson) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài học.' });
    }

    const report = await prisma.contentReport.create({
      data: {
        userId,
        targetType,
        targetId: parseInt(targetId),
        reason,
        details,
      },
    });

    res.status(201).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi tạo báo cáo.' });
  }
};

// GET /admin/reports
exports.getReports = async (req, res) => {
  try {
    // Chỉ lấy các report có kèm user
    const reports = await prisma.contentReport.findMany({
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Populate target title for better Admin UX
    const populatedReports = await Promise.all(reports.map(async (report) => {
      let targetTitle = 'Không xác định';
      let courseId = null;

      if (report.targetType === 'course') {
        const course = await prisma.course.findUnique({ where: { id: report.targetId }, select: { title: true, id: true } });
        if (course) {
          targetTitle = course.title;
          courseId = course.id;
        }
      } else if (report.targetType === 'lesson') {
        const lesson = await prisma.lesson.findUnique({ 
          where: { id: report.targetId }, 
          select: { title: true, section: { select: { courseId: true } } } 
        });
        if (lesson) {
          targetTitle = lesson.title;
          courseId = lesson.section?.courseId;
        }
      }

      return {
        ...report,
        targetTitle,
        courseId, // Để Admin có thể bấm chuyển hướng thẳng tới khóa học
      };
    }));

    res.status(200).json({
      status: 'success',
      data: populatedReports,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi tải báo cáo.' });
  }
};
