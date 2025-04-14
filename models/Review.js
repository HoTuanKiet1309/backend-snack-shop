const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  snackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Snack',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Ensure one user can only review a snack once
reviewSchema.index({ userId: 1, snackId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema); 