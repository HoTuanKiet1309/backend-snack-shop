const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Snack = require('../models/Snack');
const User = require('../models/User');
const Address = require('../models/Address');

exports.createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, note } = req.body;

    // Get cart and check if empty
    const cart = await Cart.findOne({ userId: req.user.userId })
      .populate('items.snackId')
      .populate({
        path: 'couponId',
        select: 'code discount'
      });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Get user's default address if not provided
    let shippingAddressId = addressId;
    if (!shippingAddressId) {
      const defaultAddress = await Address.findOne({ 
        userId: req.user.userId,
        isDefault: true 
      });
      
      if (!defaultAddress) {
        const anyAddress = await Address.findOne({ userId: req.user.userId });
        if (!anyAddress) {
          return res.status(400).json({ message: 'No shipping address found. Please add an address first.' });
        }
        shippingAddressId = anyAddress._id;
      } else {
        shippingAddressId = defaultAddress._id;
      }
    }

    // Validate all items in cart
    const invalidItems = [];
    const updatedSnacks = [];
    let orderItems = [];

    for (const item of cart.items) {
      const snack = await Snack.findById(item.snackId._id);
      
      // Check if snack still exists
      if (!snack) {
        invalidItems.push({ item, reason: 'Product no longer exists' });
        continue;
      }

      // Check if snack is still in stock
      if (snack.stock < item.quantity) {
        invalidItems.push({ 
          item, 
          reason: `Not enough stock. Available: ${snack.stock}, Requested: ${item.quantity}` 
        });
        continue;
      }

      // Calculate current real price
      const currentRealPrice = snack.discount ? 
        snack.price * (1 - snack.discount / 100) : 
        snack.price;

      // Check if price has changed
      if (currentRealPrice !== item.price) {
        invalidItems.push({ 
          item, 
          reason: `Price has changed. Current: ${currentRealPrice}, Cart: ${item.price}` 
        });
        continue;
      }

      // Add to order items with additional details
      orderItems.push({
        snackId: item.snackId._id,
        quantity: item.quantity,
        price: item.price,
        originalPrice: snack.price,
        discount: snack.discount || 0,
        subtotal: item.price * item.quantity
      });

      // Add to update queue
      updatedSnacks.push({
        snack,
        quantity: item.quantity
      });
    }

    // If any items are invalid, return error
    if (invalidItems.length > 0) {
      return res.status(400).json({ 
        message: 'Some items in your cart need attention',
        invalidItems: invalidItems.map(({ item, reason }) => ({
          snackName: item.snackId.snackName,
          reason
        }))
      });
    }

    try {
      // Update stock for all valid items
      for (const { snack, quantity } of updatedSnacks) {
        snack.stock -= quantity;
        await snack.save();
      }

      // Create order with additional details
      const order = new Order({
        userId: req.user.userId,
        items: orderItems,
        totalAmount: cart.totalPriceAfterDiscount || cart.totalPrice,
        discount: cart.discount || 0,
        originalAmount: cart.totalPrice,
        addressId: shippingAddressId,
        paymentMethod: paymentMethod || 'COD',
        orderStatus: 'pending',
        orderDate: new Date(),
        note: note || '',
        couponApplied: cart.couponId ? {
          couponId: cart.couponId._id,
          code: cart.couponId.code,
          discount: cart.discount
        } : null
      });

      await order.save();

      // Clear cart
      cart.items = [];
      cart.totalPrice = 0;
      cart.totalPriceAfterDiscount = 0;
      cart.discount = 0;
      cart.couponId = null;
      await cart.save();

      // Get populated order for response
      const populatedOrder = await Order.findById(order._id)
        .populate('items.snackId')
        .populate('addressId');

      res.status(201).json({
        message: 'Order created successfully',
        order: populatedOrder
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: error.message });
    }
  } catch (error) {
    console.error('Error creating order:', error);
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