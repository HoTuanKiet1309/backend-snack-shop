const Coupon = require('../models/Coupon');

// Get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get coupon by id
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create coupon
exports.createCoupon = async (req, res) => {
  try {
    const { 
      code, 
      discountType, 
      discountValue, 
      minPurchase,
      startDate,
      endDate,
      isActive,
      description
    } = req.body;

    // Validate coupon code
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    // Validate dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(endDate);
    
    if (isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid end date format' });
    }
    
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Create new coupon
    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      discountType: discountType || 'percentage', // 'percentage' or 'fixed'
      discountValue,
      minPurchase: minPurchase || 0,
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? isActive : true,
      description
    });

    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { 
      code, 
      discountType, 
      discountValue, 
      minPurchase,
      startDate,
      endDate,
      isActive,
      description
    } = req.body;

    // Check if coupon exists
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // If code is being changed, check for duplicates
    if (code && code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon && existingCoupon._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
      coupon.code = code.toUpperCase();
    }

    // Update fields if provided
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
    if (startDate) coupon.startDate = startDate;
    if (endDate) coupon.endDate = endDate;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (description !== undefined) coupon.description = description;

    await coupon.save();
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Validate coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }
    
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Debug function - list all coupons
exports.listAllCoupons = async (req, res) => {
  try {
    const allCoupons = await Coupon.find();
    const now = new Date();
    
    // Add debug info to each coupon
    const couponsWithDebug = allCoupons.map(coupon => {
      const startDateCheck = coupon.startDate <= now;
      const endDateCheck = coupon.endDate >= now;
      const isActiveCheck = coupon.isActive;
      const isValid = startDateCheck && endDateCheck && isActiveCheck;
      
      return {
        ...coupon.toObject(),
        debug: {
          currentTime: now,
          startDateValid: startDateCheck,
          endDateValid: endDateCheck,
          isActive: isActiveCheck,
          isValidNow: isValid,
          reasons: !isValid ? [
            !startDateCheck ? 'Coupon not started yet' : null,
            !endDateCheck ? 'Coupon has expired' : null,
            !isActiveCheck ? 'Coupon is not active' : null
          ].filter(Boolean) : ['Coupon is valid']
        }
      };
    });
    
    res.json(couponsWithDebug);
  } catch (error) {
    console.error('Error listing coupons:', error);
    res.status(500).json({ message: error.message });
  }
};

// Seed coupon data (for testing)
exports.seedCoupons = async (req, res) => {
  try {
    // Check if coupons already exist
    const count = await Coupon.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Coupons already exist in database' });
    }

    const coupons = [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 0,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        description: 'Giảm 10% cho đơn hàng đầu tiên'
      },
      {
        code: 'SUMMER20',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 100000,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        isActive: true,
        description: 'Giảm 20% cho đơn hàng từ 100,000đ'
      },
      {
        code: 'FREESHIP',
        discountType: 'fixed',
        discountValue: 30000,
        minPurchase: 200000,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
        description: 'Miễn phí vận chuyển đơn hàng từ 200,000đ'
      }
    ];

    await Coupon.insertMany(coupons);
    res.status(201).json({ message: 'Coupons seeded successfully', count: coupons.length });
  } catch (error) {
    console.error('Error seeding coupons:', error);
    res.status(500).json({ message: error.message });
  }
}; 