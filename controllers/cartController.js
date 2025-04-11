const Cart = require('../models/Cart');
const Snack = require('../models/Snack');
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
    const snack = await Snack.findById(snackId);
    
    if (!snack) {
      return res.status(404).json({ message: 'Snack not found' });
    }
    
    if (snack.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }
    
    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }
    
    const existingItem = cart.items.find(item => item.snackId.toString() === snackId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        snackId,
        quantity,
        price: snack.realPrice
      });
    }
    
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();
    
    res.json(cart);
  } catch (error) {
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
    if (snack.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }
    
    item.quantity = quantity;
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();
    
    res.json(cart);
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
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();
    
    res.json(cart);
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
      code: couponCode,
      isActive: true,
      expiryDate: { $gt: new Date() }
    });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired coupon' });
    }
    
    if (cart.totalPrice < coupon.minPurchase) {
      return res.status(400).json({ message: 'Minimum purchase amount not met' });
    }
    
    const discountAmount = coupon.discountType === 'percentage'
      ? (cart.totalPrice * coupon.discountValue) / 100
      : coupon.discountValue;
    
    cart.discount = discountAmount;
    cart.totalPriceAfterDiscount = cart.totalPrice - discountAmount;
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 