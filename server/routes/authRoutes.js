const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration flow
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmailOtp);
router.post('/resend-otp', authController.resendEmailOtp);

// Login / Session
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Password reset flow (OTP-based)
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
