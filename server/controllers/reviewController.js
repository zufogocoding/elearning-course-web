const prisma = require('../lib/prisma');

const createReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating từ 1 đến 5' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: Number(courseId) } }
    });

    if (!enrollment || (enrollment.status !== 'active' && enrollment.status !== 'revoked')) {
      return res.status(403).json({ success: false, error: 'Bạn phải mua khóa học mới được đánh giá' });
    }

    const existingReview = await prisma.courseReview.findUnique({
      where: { userId_courseId: { userId, courseId: Number(courseId) } }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, error: 'Bạn đã đánh giá khóa học này rồi' });
    }

    const review = await prisma.courseReview.create({
      data: {
        userId,
        courseId: Number(courseId),
        rating,
        comment
      }
    });

    return res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Lỗi createReview:', error);
    return res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

const getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const reviews = await prisma.courseReview.findMany({
      where: { courseId: Number(courseId) },
      include: {
        user: { select: { username: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const avgRating = reviews.length > 0 
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
      : 0;

    return res.status(200).json({ success: true, reviews, avgRating, totalReviews: reviews.length });
  } catch (error) {
    console.error('Lỗi getCourseReviews:', error);
    return res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

module.exports = { createReview, getCourseReviews };
