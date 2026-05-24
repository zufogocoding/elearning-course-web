const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/auth');

// POST /api/enrollments/payment - Bắt đầu thanh toán (Yêu cầu đăng nhập)
router.post('/payment', authenticate, enrollmentController.createPayment);

// GET /api/enrollments/vnpay-ipn - IPN Webhook xử lý kết quả từ VNPay (Không yêu cầu đăng nhập)
router.get('/vnpay-ipn', enrollmentController.vnpayIpn);

module.exports = router;
