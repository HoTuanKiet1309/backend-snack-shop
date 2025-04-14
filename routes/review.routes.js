const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createReview,
  updateReview,
  deleteReview,
  getSnackReviews,
  getUserReviews,
  getReviewById
} = require('../controllers/reviewController');

// Review routes
router.post('/snacks/:snackId', auth, createReview);
router.put('/:id', auth, updateReview);
router.delete('/:id', auth, deleteReview);
router.get('/snacks/:snackId', getSnackReviews);
router.get('/users/me', auth, getUserReviews);
router.get('/:id', getReviewById);

module.exports = router; 