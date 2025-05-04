const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Snack = require('../models/Snack');
const User = require('../models/User');
const Address = require('../models/Address');
const mongoose = require('mongoose');
const { sendOrderConfirmationEmail } = require('../config/emailConfig');
const { wardShippingInfo, SHIPPING_RULES } = require('../utils/shippingData');

exports.createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, note, sendEmail, useSnackPoints } = req.body;

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
    let shippingAddress;

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
        shippingAddress = anyAddress;
      } else {
        shippingAddressId = defaultAddress._id;
        shippingAddress = defaultAddress;
      }
    } else {
      // Validate provided address
      shippingAddress = await Address.findOne({
        _id: shippingAddressId,
        userId: req.user.userId
      });

      if (!shippingAddress) {
        return res.status(400).json({ message: 'Invalid shipping address' });
      }
    }

    // Calculate shipping fee based on ward
    let shippingFee = SHIPPING_RULES.HIGH; // Default shipping fee for far districts
    
    // Xử lý tên phường - loại bỏ tiền tố "Phường " hoặc "Quận " nếu có
    const ward = shippingAddress.ward;
    const processedWard = ward
      .replace(/^Phường\s+/i, '')
      .replace(/^Quận\s+/i, '');
    
    console.log(`Processing ward name for shipping: "${ward}" -> "${processedWard}"`);
    
    // Tìm thông tin phí vận chuyển theo phường
    const wardInfo = wardShippingInfo[processedWard];
    if (wardInfo) {
      shippingFee = wardInfo.fee;
      console.log(`Found shipping fee for ward "${processedWard}": ${shippingFee}`);
    } else {
      console.log(`Ward "${processedWard}" not found in shipping data, using default fee: ${shippingFee}`);
    }

    // Validate all items in cart
    const invalidItems = [];
    const updatedSnacks = [];
    let orderItems = [];
    let subtotal = 0;

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

      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;

      // Add to order items with additional details
      orderItems.push({
        snackId: item.snackId._id,
        quantity: item.quantity,
        price: item.price,
        originalPrice: snack.price,
        discount: snack.discount || 0,
        subtotal: itemSubtotal
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

    // Calculate final total amount
    const discount = cart.discount || 0;
    
    // Miễn phí ship cho đơn hàng trên 200k
    if (subtotal >= 200000) {
      console.log(`Order qualifies for free shipping: subtotal=${subtotal}`);
      shippingFee = 0;
    }
    
    const totalAmount = subtotal + shippingFee - discount;
    
    // Xử lý thanh toán bằng SnackPoints nếu được yêu cầu
    let actualPaymentMethod = paymentMethod || 'COD';
    let snackPointsUsed = 0;
    
    if (useSnackPoints) {
      // Lấy thông tin user để kiểm tra số SnackPoints hiện có
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Kiểm tra xem có đủ SnackPoints không (1 SnackPoint = 1 VND)
      if (user.snackPoints < totalAmount) {
        return res.status(400).json({ 
          message: 'Không đủ SnackPoints để thanh toán',
          currentPoints: user.snackPoints,
          requiredPoints: totalAmount
        });
      }
      
      // Sử dụng SnackPoints để thanh toán
      actualPaymentMethod = 'SnackPoints';
      snackPointsUsed = totalAmount;
      
      // Trừ SnackPoints từ tài khoản người dùng
      user.snackPoints -= snackPointsUsed;
      await user.save();
      
      console.log(`Used ${snackPointsUsed} SnackPoints from user ${user._id}`);
    }

    try {
      // Create order with additional details
      const order = new Order({
        userId: req.user.userId,
        items: orderItems,
        subtotal,
        totalAmount,
        shippingFee,
        discount,
        addressId: shippingAddressId,
        paymentMethod: actualPaymentMethod,
        snackPointsUsed,
        orderStatus: 'pending',
        orderDate: new Date(),
        note: note || '',
        couponApplied: cart.couponId ? {
          couponId: cart.couponId._id,
          code: cart.couponId.code,
          discount: cart.discount
        } : null
      });

      const savedOrder = await order.save();

      // Update stock for all valid items
      for (const { snack, quantity } of updatedSnacks) {
        snack.stock -= quantity;
        await snack.save();
      }

      // Clear cart
      cart.items = [];
      cart.totalPrice = 0;
      cart.totalPriceAfterDiscount = 0;
      cart.discount = 0;
      cart.couponId = null;
      await cart.save();

      // Get populated order for response
      const populatedOrder = await Order.findById(savedOrder._id)
        .populate('items.snackId')
        .populate('addressId')
        .lean(); // Convert to plain JavaScript object

      // Get user email and send confirmation if requested
      if (sendEmail) {
        console.log('Attempting to send email confirmation...');
        const user = await User.findById(req.user.userId);
        console.log('User found:', user);
        if (user && user.email) {
          try {
            console.log('Found user email:', user.email);
            // Make sure all required fields are present
            const orderForEmail = {
              ...populatedOrder,
              items: populatedOrder.items.map(item => ({
                ...item,
                price: item.price || 0,
                quantity: item.quantity || 0
              })),
              subtotal: populatedOrder.subtotal || 0,
              shippingFee: populatedOrder.shippingFee || 0,
              discount: populatedOrder.discount || 0,
              totalAmount: populatedOrder.totalAmount || 0
            };
            
            const emailResult = await sendOrderConfirmationEmail(orderForEmail, user.email);
            if (emailResult) {
              console.log('Email sent successfully');
            } else {
              console.log('Email sending failed');
            }
          } catch (emailError) {
            console.error('Error in email sending process:', emailError);
          }
        } else {
          console.log('No user email found');
        }
      } else {
        console.log('Email sending not requested');
      }

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
    const order = await Order.findById(req.params.id)
      .populate('items.snackId')
      .populate('addressId')
      .populate('userId', 'email firstName lastName phoneNumber')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.orderStatus = status;
    await order.save();
    
    // Return updated order with populated fields
    const updatedOrder = await Order.findById(order._id)
      .populate('items.snackId')
      .populate('addressId')
      .populate('userId', 'email firstName lastName phoneNumber')
      .lean();
    
    res.json({ 
      success: true, 
      message: 'Order status updated successfully',
      data: updatedOrder 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error updating order status' 
    });
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
    
    // Refund SnackPoints if payment was made with SnackPoints
    if (order.paymentMethod === 'SnackPoints' && order.snackPointsUsed > 0) {
      const user = await User.findById(req.user.userId);
      if (user) {
        user.snackPoints += order.snackPointsUsed;
        await user.save();
        console.log(`Refunded ${order.snackPointsUsed} SnackPoints to user ${user._id}`);
      }
    }
    
    order.orderStatus = 'cancelled';
    await order.save();
    
    res.json({ 
      order, 
      message: order.paymentMethod === 'SnackPoints' 
        ? `Đơn hàng đã được hủy và ${order.snackPointsUsed.toLocaleString('vi-VN')} SnackPoints đã được hoàn trả vào tài khoản của bạn.`
        : 'Đơn hàng đã được hủy thành công.' 
    });
  } catch (error) {
    console.error('Error canceling order:', error);
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

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'userId',
        select: 'username firstName lastName email'
      })
      .populate('items.snackId')
      .populate('addressId')
      .sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error getting all orders:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCompletedOrdersStatistics = async (req, res) => {
  try {
    // Get total revenue from completed orders
    const revenueStats = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Get top selling products from completed orders
    const topProducts = await Order.aggregate([
      { $match: { orderStatus: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.snackId',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $lookup: {
          from: 'snacks',
          localField: '_id',
          foreignField: '_id',
          as: 'snackDetails'
        }
      },
      { $unwind: '$snackDetails' },
      {
        $project: {
          _id: 1,
          name: '$snackDetails.snackName',
          totalSold: 1,
          totalRevenue: 1,
          image: '$snackDetails.images'
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        totalCompletedOrders: revenueStats[0]?.totalOrders || 0,
        topProducts
      }
    });
  } catch (error) {
    console.error('Error getting completed orders statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics'
    });
  }
}; 