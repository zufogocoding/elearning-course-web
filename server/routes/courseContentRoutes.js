const express = require('express');
const router = express.Router();
const courseContentController = require('../controllers/courseContentController');
const quizController = require('../controllers/quizController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');


// Áp dụng middleware Admin cho TOÀN BỘ file này
router.use(verifyToken, verifyAdmin);

// Routes cho Section (Chương)
router.post('/sections', courseContentController.createSection);
router.put('/sections/:id', courseContentController.updateSection);
router.delete('/sections/:id', courseContentController.deleteSection);

// Routes cho Lesson (Bài học)
router.post('/lessons', courseContentController.createLesson);
router.put('/lessons/:id', courseContentController.updateLesson);
router.delete('/lessons/:id', courseContentController.deleteLesson);

// Routes cho Quiz
router.get('/quizzes/:lessonId', quizController.getQuizzesByLesson);
router.post('/quizzes', quizController.createQuiz);
router.put('/quizzes/:id', quizController.updateQuiz);
router.delete('/quizzes/:id', quizController.deleteQuiz);
module.exports = router;