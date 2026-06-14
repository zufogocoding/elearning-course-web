const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validateUpdateMe } = require('../middleware/validators');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(authenticate);

// IMPORTANT: /me must come BEFORE /:id to avoid route shadowing
router.get('/me', userController.getMe);
router.put('/me', validateUpdateMe, userController.updateMe);

// API cập nhật Avatar: Đi qua Token -> Đi qua bộ lọc File -> Vào Controller
router.put(
  '/avatar', 
  verifyToken, 
  uploadImage, // Chuỗi bảo vệ file
  userController.updateAvatar 
);

module.exports = router;
