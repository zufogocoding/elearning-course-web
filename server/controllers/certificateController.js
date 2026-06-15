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

module.exports = { getUserCertificates, verifyCertificate };
