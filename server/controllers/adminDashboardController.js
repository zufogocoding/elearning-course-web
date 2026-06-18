const prisma = require('../lib/prisma');

const getDashboardStats = async (req, res) => {
  try {
    const totalRevenueResult = await prisma.paymentTransaction.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true }
    });
    const totalRevenue = totalRevenueResult._sum.amount || 0;

    const activeEnrollments = await prisma.enrollment.count({
      where: { status: 'active' }
    });

    const totalCourses = await prisma.course.count({
      where: { deletedAt: null }
    });

    const totalUsers = await prisma.user.count({
      where: { deletedAt: null, role: 'user' }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue: Number(totalRevenue),
        activeEnrollments,
        totalCourses,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Lỗi getDashboardStats:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
};

module.exports = { getDashboardStats };
