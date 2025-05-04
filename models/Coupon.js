const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Thêm index cho code để tìm kiếm nhanh hơn
couponSchema.index({ code: 1 });

// Thêm index cho ngày để filter coupon hiệu lực
couponSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Coupon', couponSchema); 