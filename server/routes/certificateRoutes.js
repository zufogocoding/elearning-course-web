const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticate } = require('../middleware/auth');

// Lấy danh sách chứng chỉ của user
router.get('/my-certificates', authenticate, certificateController.getUserCertificates);

// Xác thực chứng chỉ public (không cần authenticate)
router.get('/verify/:code', certificateController.verifyCertificate);

module.exports = router;
