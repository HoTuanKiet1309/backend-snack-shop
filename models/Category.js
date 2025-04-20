const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryId: {
    type: String,
    required: true,
    unique: true,
    enum: ['banh', 'keo', 'mut', 'do_kho', 'hat']
  },
  categoryName: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema); 