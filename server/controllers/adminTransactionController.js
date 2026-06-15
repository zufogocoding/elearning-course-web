const prisma = require('../lib/prisma');

// [GET] /api/admin/transactions - Lấy danh sách giao dịch (Admin)
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { gatewayTransactionId: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          enrollment: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true
                }
              }
            }
          }
        }
      }),
      prisma.paymentTransaction.count({ where })
    ]);

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách giao dịch admin:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách giao dịch' });
  }
};

// [POST] /api/admin/transactions/:id/refund - Hoàn tiền giao dịch (Admin)
const refundTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const txId = parseInt(id, 10);
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: txId },
      include: { enrollment: true }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({ error: 'Chỉ có thể hoàn tiền các giao dịch thành công (completed)' });
    }

    // Thực hiện hoàn tiền trong Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái giao dịch thành refunded
      await tx.paymentTransaction.update({
        where: { id: txId },
        data: { status: 'refunded' }
      });

      // 2. Thu hồi enrollment
      if (transaction.enrollmentId) {
        await tx.enrollment.update({
          where: { id: transaction.enrollmentId },
          data: {
            status: 'revoked',
            revokedAt: new Date()
          }
        });

        // 3. Thu hồi chứng chỉ (nếu có)
        await tx.certificate.updateMany({
          where: { enrollmentId: transaction.enrollmentId },
          data: { isRevoked: true }
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Hoàn tiền và thu hồi quyền truy cập khóa học thành công'
    });
  } catch (error) {
    console.error('Lỗi khi hoàn tiền giao dịch admin:', error);
    res.status(500).json({ error: 'Lỗi server khi xử lý hoàn tiền' });
  }
};

module.exports = {
  getAllTransactions,
  refundTransaction
};
