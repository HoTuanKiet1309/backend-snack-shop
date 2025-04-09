const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Address', addressSchema); 