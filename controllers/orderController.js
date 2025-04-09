const Order = require('../models/Order');
const Cart = require('../models/Cart');

exports.createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const order = new Order({
      userId: req.user.userId,
      items: cart.items,
      totalAmount: cart.totalPrice,
      addressId,
      orderStatus: 'pending'
    });

    const newOrder = await order.save();

    // Clear cart after order creation
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate('items.snackId')
      .populate('addressId')
      .populate('paymentId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.snackId')
      .populate('addressId')
      .populate('paymentId');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.orderStatus = orderStatus;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 