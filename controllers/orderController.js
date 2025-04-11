const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Snack = require('../models/Snack');

exports.createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.snackId');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Check stock and update
    for (const item of cart.items) {
      const snack = await Snack.findById(item.snackId._id);
      if (snack.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${snack.snackName}` });
      }
      snack.stock -= item.quantity;
      await snack.save();
    }
    
    const order = new Order({
      userId: req.user.userId,
      items: cart.items.map(item => ({
        snackId: item.snackId._id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: cart.totalPriceAfterDiscount || cart.totalPrice,
      addressId,
      paymentMethod,
      orderStatus: 'pending'
    });
    
    await order.save();
    
    // Clear cart after successful order
    cart.items = [];
    cart.totalPrice = 0;
    cart.totalPriceAfterDiscount = 0;
    cart.discount = 0;
    await cart.save();
    
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate('items.snackId')
      .populate('addressId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId
    })
      .populate('items.snackId')
      .populate('addressId');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.orderStatus = status;
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel order in current status' });
    }
    
    // Restore stock
    for (const item of order.items) {
      const snack = await Snack.findById(item.snackId);
      snack.stock += item.quantity;
      await snack.save();
    }
    
    order.orderStatus = 'cancelled';
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = { userId: req.user.userId };
    
    if (status) query.orderStatus = status;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const orders = await Order.find(query)
      .populate('items.snackId')
      .populate('addressId')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderStatistics = async (req, res) => {
  try {
    const statistics = await Order.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    res.json(statistics[0] || {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 