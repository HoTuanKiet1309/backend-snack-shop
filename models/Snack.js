const mongoose = require('mongoose');

const snackSchema = new mongoose.Schema({
  snackName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  realPrice: {
    type: Number
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  categoryId: {
    type: String,
    required: true,
    enum: ['banh', 'keo', 'do_kho', 'mut', 'hat']
  },
  images: [{
    type: String
  }]
}, {
  timestamps: true
});

// Calculate realPrice before saving
snackSchema.pre('save', function(next) {
  this.realPrice = this.price * (1 - this.discount / 100);
  next();
});

module.exports = mongoose.model('Snack', snackSchema); 