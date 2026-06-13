const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Import các middleware bảo vệ
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Public
router.get('/', courseController.getAllCourses);

// [Protected - Admin Only] Đặt TRƯỚC route /:slug để tránh xung đột
router.get('/admin/all', verifyToken, verifyAdmin, courseController.getAdminCourses);
router.post('/', verifyToken, verifyAdmin, courseController.createCourse);
router.post('/upload', verifyToken, verifyAdmin, courseController.uploadImage);

// Public - Chi tiết khóa học theo slug
router.get('/:slug', courseController.getCourseBySlug);

// Admin CRUD
router.put('/:id', verifyToken, verifyAdmin, courseController.updateCourse);
router.delete('/:id', verifyToken, verifyAdmin, courseController.deleteCourse);

module.exports = router;