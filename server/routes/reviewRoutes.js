const express = require('express');
const router = express.Router({ mergeParams: true }); // Để nhận courseId từ route cha
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, reviewController.createReview);
router.get('/', reviewController.getCourseReviews);

module.exports = router;
