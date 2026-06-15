const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const couponController = require('../controllers/couponController');
const adminTransactionController = require('../controllers/adminTransactionController');
const adminDashboardController = require('../controllers/adminDashboardController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Tất cả routes admin đều yêu cầu đăng nhập + quyền admin
router.use(authenticate);
router.use(requireAdmin);

// GET  /api/admin/users              - Danh sách users (phân trang, tìm kiếm, lọc)
router.get('/users', userController.adminGetAllUsers);

// GET /api/admin/dashboard           - Thống kê tổng quan
router.get('/dashboard', adminDashboardController.getDashboardStats);

// PUT  /api/admin/users/:id/status   - Khóa/Mở khóa tài khoản user
router.put('/users/:id/status', userController.adminUpdateUserStatus);

// --- Coupons Routes ---
router.get('/coupons', couponController.getAllCoupons);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// --- Transactions & Refunds Routes ---
router.get('/transactions', adminTransactionController.getAllTransactions);
router.post('/transactions/:id/refund', adminTransactionController.refundTransaction);

module.exports = router;
