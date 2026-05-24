const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
const { verifyToken } = require('../middleware/authMiddleware');

// =====================================================
// LEARNING API - API học tập của user
// Tất cả route bên dưới đều yêu cầu đăng nhập
// =====================================================

// 1. Trang My Learning: các khóa học user đã đăng ký
router.get('/my-courses', verifyToken, learningController.getMyLearningCourses);

// 2. Vào học một khóa học: lấy course + section + lesson + progress
router.get('/courses/:courseId', verifyToken, learningController.getLearningCourse);

// 3. Xem tiến độ toàn khóa
router.get('/courses/:courseId/progress', verifyToken, learningController.getCourseProgress);

// 4. Mở chi tiết bài học
router.get('/lessons/:lessonId', verifyToken, learningController.getLessonDetail);

// 5. Lưu checkpoint/progress khi xem video
router.post('/lessons/:lessonId/progress', verifyToken, learningController.updateProgress);

// 6. Đánh dấu hoàn thành bài học
router.post('/lessons/:lessonId/complete', verifyToken, learningController.completeLesson);

// 7. Lấy bài học tiếp theo
router.get('/lessons/:lessonId/next', verifyToken, learningController.getNextLesson);

// 8. Lấy tài liệu đính kèm của bài học
router.get('/lessons/:lessonId/attachments', verifyToken, learningController.getLessonAttachments);

// 9. Lấy quiz gắn với bài học
router.get('/lessons/:lessonId/quiz', verifyToken, learningController.getLessonQuiz);

// 10. Bắt đầu làm quiz
router.post('/quizzes/:quizId/start', verifyToken, learningController.startQuiz);

// 11. Lấy câu hỏi của lượt làm quiz, không trả đáp án đúng
router.get('/quiz-attempts/:attemptId/questions', verifyToken, learningController.getQuizAttemptQuestions);

// 12. Nộp quiz để backend tự chấm điểm
router.post('/quiz-attempts/:attemptId/submit', verifyToken, learningController.submitQuizAttempt);

// 13. Xem kết quả quiz sau khi đã nộp
router.get('/quiz-attempts/:attemptId/result', verifyToken, learningController.getQuizAttemptResult);

// 14. Xem lịch sử làm quiz của user
router.get('/quizzes/:quizId/attempts', verifyToken, learningController.getQuizAttempts);

module.exports = router;
