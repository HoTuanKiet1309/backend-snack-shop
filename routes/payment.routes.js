const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const paypalService = require('../services/paypalService');

/**
 * @swagger
 * /api/payment/paypal/create:
 *   post:
 *     summary: Tạo giao dịch thanh toán PayPal
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số tiền muốn nạp (VND)
 *     responses:
 *       200:
 *         description: Tạo giao dịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentId:
 *                   type: string
 *                 approvalUrl:
 *                   type: string
 *                   description: URL để chuyển hướng người dùng đến trang thanh toán PayPal
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       500:
 *         description: Lỗi server
 */
router.post('/paypal/create', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Số tiền không hợp lệ' 
      });
    }
    
    // Tạo URL trả về
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const returnUrl = `${baseUrl}/api/payment/paypal/success`;
    const cancelUrl = `${baseUrl}/api/payment/paypal/cancel`;
    
    // Tạo payment với PayPal
    const payment = await paypalService.createPayment(
      amount, 
      req.user.userId,
      returnUrl,
      cancelUrl
    );
    
    // Trả về thông tin payment
    res.json({
      success: true,
      paymentId: payment.id,
      approvalUrl: payment.approvalUrl
    });
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Có lỗi xảy ra khi tạo giao dịch PayPal' 
    });
  }
});

/**
 * @swagger
 * /api/payment/paypal/success:
 *   get:
 *     summary: Xử lý khi thanh toán PayPal thành công
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: PayPal token
 *       - in: query
 *         name: PayerID
 *         schema:
 *           type: string
 *         required: true
 *         description: PayPal Payer ID
 *     responses:
 *       302:
 *         description: Chuyển hướng đến trang frontend
 *       500:
 *         description: Lỗi server
 */
router.get('/paypal/success', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Thiếu thông tin giao dịch`);
    }
    
    // Xác nhận payment với PayPal
    const captureData = await paypalService.capturePayment(token);
    
    if (captureData.status !== 'COMPLETED') {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Giao dịch chưa hoàn tất`);
    }
    
    // Lấy thông tin amount từ purchase unit với kiểm tra null
    let amountUSD = 0;
    try {
      const purchaseUnit = captureData.paymentDetails;
      if (purchaseUnit && purchaseUnit.amount && purchaseUnit.amount.value) {
        amountUSD = parseFloat(purchaseUnit.amount.value);
      } else {
        console.error('Missing amount value in response:', JSON.stringify(captureData));
        amountUSD = 10; // Giá trị mặc định 10 USD nếu không có
      }
    } catch (err) {
      console.error('Error parsing amount:', err);
      amountUSD = 10; // Giá trị mặc định
    }
    
    // Chuyển đổi từ USD sang VND (tỷ giá 1 USD = 23,000 VND)
    const amountVND = Math.round(amountUSD * 23000);
    
    // Lấy userId từ reference_id
    const userId = captureData.paymentDetails.reference_id || '';
    
    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Không tìm thấy thông tin người dùng trong giao dịch`);
    }
    
    // Cập nhật snackPoints cho user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Không tìm thấy người dùng`);
    }
    
    // Khởi tạo snackPoints nếu chưa có
    if (!user.snackPoints) {
      user.snackPoints = 0;
    }
    
    // Thêm điểm vào tài khoản
    user.snackPoints += amountVND;
    
    // Khởi tạo pointsHistory nếu chưa có
    if (!user.pointsHistory) {
      user.pointsHistory = [];
    }
    
    // Lưu lịch sử nạp điểm
    user.pointsHistory.push({
      amount: amountVND,
      type: 'load',
      paymentMethod: 'paypal',
      transactionId: captureData.transactionId,
      date: new Date(),
      note: `Nạp SnackPoints qua PayPal - OrderID: ${token}`
    });
    
    await user.save();
    
    // Chuyển hướng đến trang thành công
    res.redirect(`${process.env.FRONTEND_URL}/payment/success?amount=${amountVND}`);
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * @swagger
 * /api/payment/paypal/cancel:
 *   get:
 *     summary: Xử lý khi hủy thanh toán PayPal
 *     tags: [Payment]
 *     responses:
 *       302:
 *         description: Chuyển hướng đến trang frontend
 */
router.get('/paypal/cancel', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/payment/cancel`);
});

/**
 * @swagger
 * /api/payment/other/process:
 *   post:
 *     summary: Xử lý thanh toán qua MoMo/VNPay (demo)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - method
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số SnackPoints muốn nạp
 *               method:
 *                 type: string
 *                 enum: [momo, vnpay]
 *                 description: Phương thức thanh toán
 *     responses:
 *       200:
 *         description: Thanh toán thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       500:
 *         description: Lỗi server
 */
router.post('/other/process', auth, async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Số tiền không hợp lệ' 
      });
    }
    
    if (!method || !['momo', 'vnpay'].includes(method)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phương thức thanh toán không hợp lệ' 
      });
    }
    
    // Tìm người dùng
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng' 
      });
    }
    
    // Khởi tạo snackPoints nếu chưa có
    if (!user.snackPoints) {
      user.snackPoints = 0;
    }
    
    // Cập nhật số SnackPoints
    user.snackPoints += amount;
    
    // Khởi tạo pointsHistory nếu chưa có
    if (!user.pointsHistory) {
      user.pointsHistory = [];
    }
    
    // Tạo mã giao dịch ngẫu nhiên
    const transactionId = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
    
    // Lưu lịch sử nạp điểm
    user.pointsHistory.push({
      amount: amount,
      type: 'load',
      paymentMethod: method,
      transactionId: transactionId,
      date: new Date(),
      description: `Nạp SnackPoints qua ${method === 'momo' ? 'MoMo' : 'VNPay'}`
    });
    
    await user.save();
    
    // Trả về kết quả
    res.json({
      success: true,
      currentPoints: user.snackPoints,
      amount: amount,
      method: method,
      message: `Nạp thành công ${amount.toLocaleString('vi-VN')} SnackPoints!`
    });
  } catch (error) {
    console.error(`Error processing ${req.body.method} payment:`, error);
    res.status(500).json({ 
      success: false, 
      message: error.message || `Có lỗi xảy ra khi xử lý thanh toán ${req.body.method}` 
    });
  }
});

module.exports = router; 