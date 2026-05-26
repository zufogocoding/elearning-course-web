const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateResetPassword } = require('../middleware/validators');

// Registration flow
router.post('/register', validateRegister, authController.register);
router.post('/verify-email', authController.verifyEmailOtp);
router.post('/resend-otp', authController.resendEmailOtp);

// Login / Session
router.post('/login', validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Password reset flow (OTP-based)
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router;
