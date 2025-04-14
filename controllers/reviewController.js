const Review = require('../models/Review');
const Snack = require('../models/Snack');

exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const snack = await Snack.findById(req.params.snackId);
    
    if (!snack) {
      return res.status(404).json({ message: 'Snack not found' });
    }
    
    // Check if user has already reviewed this snack
    const existingReview = await Review.findOne({
      userId: req.user.userId,
      snackId: req.params.snackId
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this snack' });
    }
    
    const review = new Review({
      userId: req.user.userId,
      snackId: req.params.snackId,
      rating,
      comment
    });
    
    await review.save();
    
    // Update snack's average rating
    const reviews = await Review.find({ snackId: req.params.snackId });
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    snack.averageRating = averageRating;
    await snack.save();
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    review.rating = rating;
    review.comment = comment;
    await review.save();
    
    // Update snack's average rating
    const snack = await Snack.findById(review.snackId);
    const reviews = await Review.find({ snackId: review.snackId });
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    snack.averageRating = averageRating;
    await snack.save();
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Update snack's average rating
    const snack = await Snack.findById(review.snackId);
    const reviews = await Review.find({ snackId: review.snackId });
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;
    snack.averageRating = averageRating;
    await snack.save();
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSnackReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ snackId: req.params.snackId })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.userId })
      .populate('snackId', 'snackName')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
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