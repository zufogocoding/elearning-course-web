const prisma = require('../lib/prisma');

const getUserCertificates = async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user.id, isRevoked: false },
      include: {
        course: {
          select: { title: true, slug: true, thumbnailUrl: true }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });
    return res.status(200).json({ success: true, certificates });
  } catch (error) {
    console.error('Lỗi getUserCertificates:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;
    const certificate = await prisma.certificate.findUnique({
      where: { certificateCode: code },
      include: {
        user: { select: { username: true, email: true } },
        course: { select: { title: true } }
      }
    });

    if (!certificate || certificate.isRevoked) {
      return res.status(404).json({ success: false, message: 'Chứng chỉ không hợp lệ hoặc đã bị thu hồi' });
    }

    return res.status(200).json({ success: true, certificate });
  } catch (error) {
    console.error('Lỗi verifyCertificate:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

const { v4: uuidv4 } = require('uuid');

const checkAndIssueCertificate = async (userId, courseId) => {
  try {
    // Check if certificate already exists
    const existing = await prisma.certificate.findFirst({
      where: { userId, courseId, isRevoked: false }
    });
    if (existing) return existing;

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });
    if (!enrollment || enrollment.status !== 'active') return null;

    // Count total lessons
    const totalLessons = await prisma.lesson.count({
      where: { section: { courseId } }
    });
    if (totalLessons === 0) return null;

    // Count completed lessons
    const completedLessons = await prisma.lessonCompletion.count({
      where: {
        userId,
        lesson: { section: { courseId } },
        completedAt: { not: null }
      }
    });

    if (completedLessons >= totalLessons) {
      // Issue certificate
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { version: true } });
      const cert = await prisma.certificate.create({
        data: {
          enrollmentId: enrollment.id,
          userId,
          courseId,
          certificateCode: uuidv4(),
          courseVersion: course.version || 1
        }
      });
      return cert;
    }
    return null;
  } catch (error) {
    console.error('Lỗi checkAndIssueCertificate:', error);
    return null;
  }
};

module.exports = { getUserCertificates, verifyCertificate, checkAndIssueCertificate };
