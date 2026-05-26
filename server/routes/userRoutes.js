const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validateUpdateMe } = require('../middleware/validators');

// All routes require authentication
router.use(authenticate);

// IMPORTANT: /me must come BEFORE /:id to avoid route shadowing
router.get('/me', userController.getMe);
router.put('/me', validateUpdateMe, userController.updateMe);

module.exports = router;
