require('dotenv').config();
const prisma = require('../lib/prisma.js');
const crypto = require('crypto');
const axios = require('axios');

async function main() {
  console.log('--- BẮT ĐẦU GIẢ LẬP PAYOS WEBHOOK ---');

  // 1. Tìm một giao dịch thanh toán đang ở trạng thái 'pending'
  const pendingPayment = await prisma.paymentTransaction.findFirst({
    where: { status: 'pending', paymentMethod: 'vietqr' },
    orderBy: { createdAt: 'desc' },
    include: { enrollment: true }
  });

  if (!pendingPayment) {
    console.log('⚠️ Không tìm thấy giao dịch VietQR (PayOS) nào đang ở trạng thái "pending".');
    console.log('👉 Vui lòng mở Frontend, thực hiện bấm "Mua khóa học" để tạo một hóa đơn thanh toán mới trước.');
    process.exit(0);
  }

  console.log(`Found pending transaction ID: ${pendingPayment.id}`);
  console.log(`Course ID: ${pendingPayment.enrollment.courseId} | User ID: ${pendingPayment.enrollment.userId}`);
  console.log(`Amount: ${pendingPayment.amount} VND`);

  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!checksumKey) {
    console.error('❌ LỖI: Chưa cấu hình PAYOS_CHECKSUM_KEY trong file .env');
    process.exit(1);
  }

  // 2. Tạo dữ liệu giả lập từ PayOS Webhook
  // Công thức: orderCode = paymentId * 1000 + random
  const orderCode = pendingPayment.id * 1000 + 456;
  const webhookData = {
    orderCode: orderCode,
    amount: pendingPayment.amount,
    description: "Thanh toan khoa hoc",
    accountNumber: "970415XXXXXX8888",
    reference: "FT261689949102",
    transactionDateTime: new Date().toISOString(),
    currency: "VND",
    paymentLinkId: "pl_test_link_id_" + Date.now(),
    code: "00", // "00" có nghĩa là thanh toán thành công
    desc: "success"
  };

  // 3. Ký chữ ký bảo mật HMAC-SHA256 theo chuẩn PayOS
  const sortedKeys = Object.keys(webhookData).sort();
  const queryString = sortedKeys
    .map(key => {
      let val = webhookData[key];
      if (val === null || val === undefined) val = "";
      return `${key}=${val}`;
    })
    .join("&");

  const hmac = crypto.createHmac("sha256", checksumKey);
  hmac.update(queryString);
  const signature = hmac.digest("hex");

  const payload = {
    data: webhookData,
    signature: signature
  };

  console.log('Signing payload completed.');
  console.log(`Signature: ${signature}`);

  // 4. Gửi HTTP POST request đến API Webhook của Backend
  const targetUrl = process.env.WEBHOOK_TARGET_URL || 'http://localhost:5000/api/enrollments/payos-webhook';
  console.log(`Sending simulated webhook to: ${targetUrl}...`);

  try {
    const res = await axios.post(targetUrl, payload);
    console.log('Response from server:', res.status, res.data);

    // 5. Kiểm tra lại cơ sở dữ liệu xem trạng thái đã được cập nhật chưa
    console.log('Checking database status updates...');
    const updatedPayment = await prisma.paymentTransaction.findUnique({
      where: { id: pendingPayment.id },
      include: { enrollment: true }
    });

    console.log(`- Transaction Status: ${updatedPayment.status} (Expected: completed)`);
    console.log(`- Enrollment Status: ${updatedPayment.enrollment.status} (Expected: active)`);

    if (updatedPayment.status === 'completed' && updatedPayment.enrollment.status === 'active') {
      console.log('🎉 THÀNH CÔNG: Webhook hoạt động hoàn hảo! Khóa học đã được mở cho học viên.');
    } else {
      console.log('❌ THẤT BẠI: Webhook phản hồi tốt nhưng trạng thái DB chưa được cập nhật đúng.');
    }

  } catch (err) {
    console.error('❌ LỖI kết nối hoặc xử lý:', err.response?.data || err.message);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
