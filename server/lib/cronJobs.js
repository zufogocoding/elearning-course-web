const cron = require('node-cron');
const prisma = require('./prisma');

// 1. Cron Job dọn dẹp các Enrollment PENDING quá 15 phút
// Chạy mỗi 5 phút
const initCleanupEnrollmentsJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Đang quét các enrollment pending hết hạn...');
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    try {
      // Tìm các enrollment pending được tạo trước 15 phút trước
      const pendingEnrollments = await prisma.enrollment.findMany({
        where: {
          status: 'pending',
          enrolledAt: {
            lt: fifteenMinutesAgo
          }
        },
        include: {
          paymentTransaction: true
        }
      });

      if (pendingEnrollments.length === 0) {
        return;
      }

      console.log(`[CRON] Tìm thấy ${pendingEnrollments.length} enrollment pending cần dọn dẹp.`);

      // Xử lý từng cái một cách an toàn bằng transaction
      for (const enrollment of pendingEnrollments) {
        try {
          await prisma.$transaction(async (tx) => {
            // Cập nhật trạng thái enrollment
            await tx.enrollment.update({
              where: { id: enrollment.id },
              data: { status: 'expired' }
            });

            // Cập nhật trạng thái transaction
            if (enrollment.paymentTransaction && enrollment.paymentTransaction.status === 'pending') {
              await tx.paymentTransaction.update({
                where: { id: enrollment.paymentTransaction.id },
                data: { status: 'failed' }
              });
            }

            // Hoàn lại lượt dùng của coupon (nếu có và usedCount > 0)
            if (enrollment.couponId) {
              const coupon = await tx.coupon.findUnique({ where: { id: enrollment.couponId } });
              if (coupon && coupon.usedCount > 0) {
                await tx.coupon.update({
                  where: { id: enrollment.couponId },
                  data: { usedCount: { decrement: 1 } }
                });
              }
            }
          });
          console.log(`[CRON] Đã dọn dẹp enrollment ID ${enrollment.id} thành công.`);
        } catch (err) {
          console.error(`[CRON] Lỗi khi dọn dẹp enrollment ID ${enrollment.id}:`, err);
        }
      }
    } catch (error) {
      console.error('[CRON] Lỗi tổng quát khi chạy cleanup enrollments job:', error);
    }
  });
};

// 2. Cron Job dọn dẹp các Quiz Attempt "in_progress" quá 1 giờ
// Chạy mỗi 1 giờ
const initCleanupQuizAttemptsJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Đang quét các lượt làm quiz in_progress bị bỏ quên...');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    try {
      const result = await prisma.userQuizAttempt.updateMany({
        where: {
          status: 'in_progress',
          startedAt: {
            lt: oneHourAgo
          }
        },
        data: {
          status: 'abandoned'
        }
      });

      if (result.count > 0) {
        console.log(`[CRON] Đã chuyển ${result.count} lượt làm quiz sang trạng thái 'abandoned'.`);
      }
    } catch (error) {
      console.error('[CRON] Lỗi khi dọn dẹp quiz attempts:', error);
    }
  });
};

// 3. Cron Job dọn dẹp các OTP và Reset Token hết hạn
// Chạy mỗi 1 giờ
const initCleanupExpiredOtpsJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Đang quét dọn dẹp các mã OTP và Password Reset Token đã hết hạn...');
    const now = new Date();

    try {
      const emailOtpResult = await prisma.emailVerificationOtp.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });

      const passwordTokenResult = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });

      if (emailOtpResult.count > 0 || passwordTokenResult.count > 0) {
        console.log(`[CRON] Đã dọn dẹp: ${emailOtpResult.count} OTP xác thực email và ${passwordTokenResult.count} token reset mật khẩu đã hết hạn.`);
      }
    } catch (error) {
      console.error('[CRON] Lỗi khi dọn dẹp OTP/tokens hết hạn:', error);
    }
  });
};

const startCronJobs = () => {
  initCleanupEnrollmentsJob();
  initCleanupQuizAttemptsJob();
  initCleanupExpiredOtpsJob();
  console.log('[CRON] Các tác vụ nền dọn dẹp đã được khởi tạo.');
};

module.exports = {
  startCronJobs
};

