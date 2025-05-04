const Cart = require('../models/Cart');
const Snack = require('../models/Snack');
const User = require('../models/User');
const Coupon = require('../models/Coupon');

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.userId }).populate('items.snackId');
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { snackId, quantity } = req.body;

    // Validate input
    if (!snackId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    // Check if user exists
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if snack exists and has enough stock
    const snack = await Snack.findById(snackId);
    if (!snack) {
      return res.status(404).json({ message: 'Snack not found' });
    }
    
    if (snack.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    // Tính realPrice
    const realPrice = snack.discount ? snack.price * (1 - snack.discount / 100) : snack.price;
    
    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      cart = new Cart({ 
        userId: req.user.userId, 
        items: [],
        totalPrice: 0
      });
    }
    
    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.snackId.toString() === snackId);
    if (existingItem) {
      // Check if new quantity exceeds stock
      if (snack.stock < existingItem.quantity + quantity) {
        return res.status(400).json({ message: 'Not enough stock for additional quantity' });
      }
      existingItem.quantity += quantity;
      existingItem.price = realPrice; // Cập nhật giá mới
    } else {
      cart.items.push({
        snackId,
        quantity,
        price: realPrice // Sử dụng realPrice
      });
    }
    
    // Calculate total price using realPrice
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await cart.save();
    
    // Populate snack details for response
    const populatedCart = await Cart.findById(cart._id).populate('items.snackId');
    
    res.json(populatedCart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const item = cart.items.find(item => item.snackId.toString() === req.params.snackId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    const snack = await Snack.findById(req.params.snackId);
    if (!snack) {
      return res.status(404).json({ message: 'Snack not found' });
    }

    if (snack.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }
    
    // Tính realPrice
    const realPrice = snack.discount ? snack.price * (1 - snack.discount / 100) : snack.price;
    
    item.quantity = quantity;
    item.price = realPrice; // Cập nhật giá mới
    
    // Calculate total price using realPrice
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate('items.snackId');
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item.snackId.toString() !== req.params.snackId);
    
    // Calculate total price using realPrice
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    await cart.save();
    
    const populatedCart = await Cart.findById(cart._id).populate('items.snackId');
    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }
    
    if (cart.totalPrice < coupon.minPurchase) {
      return res.status(400).json({ message: `Minimum purchase amount not met. You need to spend at least ${coupon.minPurchase.toLocaleString('vi-VN')}đ to use this coupon.` });
    }
    
    const discountAmount = coupon.discountType === 'percentage'
      ? (cart.totalPrice * coupon.discountValue) / 100
      : coupon.discountValue;
    
    cart.discount = discountAmount;
    cart.totalPriceAfterDiscount = cart.totalPrice - discountAmount;
    cart.couponId = coupon._id;
    await cart.save();
    
    // Populate cart items before returning
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.snackId')
      .populate('couponId');
    
    res.json(populatedCart);
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.discount = 0;
    cart.totalPriceAfterDiscount = cart.totalPrice;
    cart.couponId = null;
    await cart.save();
    
    // Populate cart items before returning
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.snackId');
    
    res.json(populatedCart);
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500).json({ message: error.message });
  }
}; 