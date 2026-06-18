const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
// [BUG-06 FIX] Thống nhất dùng auth.js thay vì authMiddleware.js để tránh mismatch secret
const { authenticate } = require('../middleware/auth');

// =====================================================
// LEARNING API - API học tập của user
// Tất cả route bên dưới đều yêu cầu đăng nhập
// =====================================================

// 1. Trang My Learning: các khóa học user đã đăng ký
router.get('/my-courses', authenticate, learningController.getMyLearningCourses);

// 2. Vào học một khóa học: lấy course + section + lesson + progress
router.get('/courses/:courseId', authenticate, learningController.getLearningCourse);

// 3. Xem tiến độ toàn khóa
router.get('/courses/:courseId/progress', authenticate, learningController.getCourseProgress);

// 4. Mở chi tiết bài học
router.get('/lessons/:lessonId', authenticate, learningController.getLessonDetail);

// 5. Lưu checkpoint/progress khi xem video
router.post('/lessons/:lessonId/progress', authenticate, learningController.updateProgress);

// 6. Đánh dấu hoàn thành bài học
router.post('/lessons/:lessonId/complete', authenticate, learningController.completeLesson);

// 7. Lấy bài học tiếp theo
router.get('/lessons/:lessonId/next', authenticate, learningController.getNextLesson);

// 8. Lấy tài liệu đính kèm của bài học
router.get('/lessons/:lessonId/attachments', authenticate, learningController.getLessonAttachments);

// 9. Lấy quiz gắn với bài học
router.get('/lessons/:lessonId/quiz', authenticate, learningController.getLessonQuiz);

// 10. Bắt đầu làm quiz
router.post('/quizzes/:quizId/start', authenticate, learningController.startQuiz);

// 11. Lấy câu hỏi của lượt làm quiz, không trả đáp án đúng
router.get('/quiz-attempts/:attemptId/questions', authenticate, learningController.getQuizAttemptQuestions);

// 12. Nộp quiz để backend tự chấm điểm
router.post('/quiz-attempts/:attemptId/submit', authenticate, learningController.submitQuizAttempt);

// 13. Xem kết quả quiz sau khi đã nộp
router.get('/quiz-attempts/:attemptId/result', authenticate, learningController.getQuizAttemptResult);

// 14. Xem lịch sử làm quiz của user
router.get('/quizzes/:quizId/attempts', authenticate, learningController.getQuizAttempts);

module.exports = router;
