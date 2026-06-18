const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Học viên tạo báo cáo
router.post('/', protect, reportController.createReport);

// Admin lấy danh sách báo cáo
router.get('/admin', protect, restrictTo('admin'), reportController.getReports);

module.exports = router;
