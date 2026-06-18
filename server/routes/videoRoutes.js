const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { authenticate } = require('../middleware/auth');

// Frontend gọi API này để lấy link stream video (Bắt buộc phải đăng nhập)
router.get('/:lessonId/playback', authenticate, videoController.getVideoPlayback);

module.exports = router;