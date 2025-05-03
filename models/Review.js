const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  snackId: {
    type: Schema.Types.ObjectId,
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

// Clear existing indexes and create a properly named index
reviewSchema.index({ userId: 1, snackId: 1 }, { 
  unique: true, 
  background: true,
  name: 'userId_snackId_unique'  // Explicitly name the index
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 