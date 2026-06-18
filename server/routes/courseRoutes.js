const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Import các middleware bảo vệ
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public
router.get('/', courseController.getAllCourses);
router.get('/stats', courseController.getPublicStats);

// [Protected - Admin Only] Đặt TRƯỚC route /:slug để tránh xung đột
router.get('/admin/all', authenticate, requireAdmin, courseController.getAdminCourses);
router.post('/', authenticate, requireAdmin, courseController.createCourse);
router.post('/upload', authenticate, requireAdmin, courseController.uploadImage);

// Public - Chi tiết khóa học theo slug
router.get('/:slug', courseController.getCourseBySlug);

// Admin CRUD
router.put('/:id', authenticate, requireAdmin, courseController.updateCourse);
router.delete('/:id', authenticate, requireAdmin, courseController.deleteCourse);

module.exports = router;