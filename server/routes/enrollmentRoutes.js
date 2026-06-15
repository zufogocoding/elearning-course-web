const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');

// Import middleware xác thực token để bảo vệ API
const { authenticate } = require('../middleware/auth'); 

// 1. API Bắt đầu thanh toán nhập học 
// URL đầy đủ sẽ là: POST /api/enrollments/checkout
router.post('/checkout', authenticate, enrollmentController.createPayment);

// 2. API Webhook nhận kết quả từ VNPAY
// URL đầy đủ sẽ là: GET /api/enrollments/vnpay-ipn
// KHÔNG THÊM verifyToken ở đây vì đây là API để SERVER VNPAY gọi ngầm dưới nền
router.get('/vnpay-ipn', enrollmentController.vnpayIpn);

// API Webhook nhận kết quả từ PayOS (VietQR)
// URL đầy đủ sẽ là: POST /api/enrollments/payos-webhook
// KHÔNG THÊM verifyToken ở đây vì đây là API để SERVER PayOS gọi ngầm dưới nền
router.post('/payos-webhook', enrollmentController.payosWebhook);

// API Webhook nhận kết quả từ MoMo
router.post('/momo-ipn', enrollmentController.momoIpn);

// API Verify Payment dành riêng cho localhost/dev
router.get('/verify-payment/:paymentId', authenticate, enrollmentController.verifyPayment);

// 3. API Kiểm tra mã giảm giá
// URL đầy đủ sẽ là: GET /api/enrollments/coupon/:code
router.get('/coupon/:code', authenticate, enrollmentController.validateCoupon);

module.exports = router;