const Review = require('../models/Review');
const Snack = require('../models/Snack');
const mongoose = require('mongoose');

exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Log the request for debugging
    console.log('Review creation request:', {
      userId: req.user?.userId,
      snackId: req.params.snackId,
      rating,
      comment
    });
    
    // Validate authentication
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized - Login required' });
    }
    
    // Validate snackId format
    if (!req.params.snackId || !mongoose.Types.ObjectId.isValid(req.params.snackId)) {
      return res.status(400).json({ message: 'Invalid or missing snack ID' });
    }
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const snack = await Snack.findById(req.params.snackId);
    if (!snack) {
      return res.status(404).json({ message: 'Snack not found' });
    }

    // Convert string IDs to ObjectId to ensure proper comparison
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const snackId = new mongoose.Types.ObjectId(req.params.snackId);
    
    // Additional validation to ensure no null values
    if (!userId || !snackId) {
      return res.status(400).json({ 
        message: 'Cannot create review with null user or snack ID',
        details: { userId: userId || null, snackId: snackId || null }
      });
    }
    
    // Log the object IDs for debugging
    console.log('Converted IDs:', {
      userId: userId.toString(),
      snackId: snackId.toString()
    });
    
    // Check if user has already reviewed this snack - with better error handling
    const existingReview = await Review.findOne({
      userId: userId,
      snackId: snackId
    });
    
    if (existingReview) {
      console.log('Found existing review:', existingReview);
      return res.status(400).json({ 
        message: 'You have already reviewed this snack',
        reviewId: existingReview._id
      });
    }
    
    const review = new Review({
      userId: userId,
      snackId: snackId,
      rating: Number(rating),
      comment: comment
    });
    
    // Log the review object before saving
    console.log('Saving review:', review);
    
    const savedReview = await review.save();
    console.log('Review saved successfully with ID:', savedReview._id);
    
    // Update snack's average rating
    const reviews = await Review.find({ snackId: snackId });
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    snack.averageRating = averageRating;
    await snack.save();
    
    // Return populated review
    const populatedReview = await Review.findById(savedReview._id)
      .populate('userId', 'firstName lastName')
      .populate('snackId', 'snackName');
    
    res.status(201).json(populatedReview);
  } catch (error) {
    console.error('Review creation error:', error);
    
    if (error.code === 11000) {
      // Provide detailed information for duplicate key errors
      return res.status(400).json({ 
        message: 'Duplicate review error - you may have already reviewed this product',
        details: error.message,
        keyPattern: error.keyPattern || {},
        keyValue: error.keyValue || {},
        // Add request details for debugging
        requestData: {
          userId: req.user?.userId,
          snackId: req.params.snackId
        }
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create review',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const reviewId = new mongoose.Types.ObjectId(req.params.id);
    
    const review = await Review.findOne({
      _id: reviewId,
      userId: userId
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    review.rating = rating;
    review.comment = comment;
    await review.save();
    
    // Update snack's average rating
    const snack = await Snack.findById(review.snackId);
    if (!snack) {
      return res.status(404).json({ message: 'Snack not found' });
    }
    
    const reviews = await Review.find({ snackId: review.snackId });
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    snack.averageRating = averageRating;
    await snack.save();
    
    // Return populated review
    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'firstName lastName')
      .populate('snackId', 'snackName');
    
    res.json(populatedReview);
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ 
      message: 'Failed to update review',
      error: error.message
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid review ID format' });
    }
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const reviewId = new mongoose.Types.ObjectId(req.params.id);
    
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      userId: userId
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Update snack's average rating
    const snack = await Snack.findById(review.snackId);
    if (!snack) {
      return res.status(404).json({ message: 'Snack not found' });
    }
    
    const reviews = await Review.find({ snackId: review.snackId });
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;
    snack.averageRating = averageRating;
    await snack.save();
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

exports.getSnackReviews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.snackId)) {
      return res.status(400).json({ message: 'Invalid snack ID format' });
    }
    
    const snackId = new mongoose.Types.ObjectId(req.params.snackId);
    
    const reviews = await Review.find({ snackId: snackId })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get snack reviews error:', error);
    res.status(500).json({ 
      message: 'Failed to get snack reviews',
      error: error.message
    });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.userId })
      .populate('snackId', 'snackName images')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ 
      message: 'Failed to get user reviews',
      error: error.message
    });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('userId', 'firstName lastName')
      .populate('snackId', 'snackName');
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 