const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const tokenService = require('../services/tokenService');
const { sendResetPasswordEmail } = require('../services/emailService');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - phoneNumber
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email người dùng
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: "123456"
 *               firstName:
 *                 type: string
 *                 description: Tên
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Họ
 *                 example: "Doe"
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại
 *                 example: "0123456789"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - source
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email người dùng
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: "123456"
 *               source:
 *                 type: string
 *                 description: Nguồn đăng nhập (admin hoặc user)
 *                 example: "admin"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Sai email hoặc mật khẩu
 *       403:
 *         description: Không có quyền truy cập
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, source } = req.body;
        console.log('Login attempt for email:', email);

        // Kiểm tra user có tồn tại không
        const user = await User.findOne({ email });
        console.log('Found user:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Kiểm tra quyền truy cập dựa trên source
        if (source === 'admin' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Kiểm tra status
        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Your account has been blocked' });
        }

        // Kiểm tra password
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation:', isValidPassword ? 'Success' : 'Failed');
        console.log('Stored hashed password:', user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Tạo JWT token với Redis
        const token = await tokenService.generateToken({ 
            userId: user._id,
            role: user.role
        });

        // Trả về thông tin user (không bao gồm password) và token
        res.json({
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                status: user.status
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       401:
 *         description: Không có quyền truy cập
 */
router.post('/logout', auth, async (req, res) => {
    try {
        await tokenService.blacklistToken(req.token);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 */
router.get('/me', auth, getCurrentUser);

// Route để gửi mã xác nhận qua email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Kiểm tra email có tồn tại không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
    }

    // Tạo mã xác nhận ngẫu nhiên 6 chữ số
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Lưu mã xác nhận và thời gian hết hạn (15 phút)
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
    await user.save();

    // Gửi email chứa mã xác nhận
    await sendResetPasswordEmail(email, resetCode);

    res.json({ message: 'Mã xác nhận đã được gửi đến email của bạn' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xử lý yêu cầu' });
  }
});

// Route để xác thực mã và đặt lại mật khẩu
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log('Reset password request for email:', email);

    // Tìm user với email
    const user = await User.findOne({ email });
    console.log('Found user:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Email không tồn tại trong hệ thống' 
      });
    }

    // Cập nhật mật khẩu mới (sẽ được hash tự động bởi middleware)
    user.password = newPassword;
    // Xóa mã reset và thời gian hết hạn
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log('User saved with new password');

    res.json({ 
      success: true,
      message: 'Mật khẩu đã được cập nhật thành công' 
    });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Có lỗi xảy ra khi đặt lại mật khẩu' 
    });
  }
});

// Verify reset code
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, resetCode } = req.body;

    // Validate input
    if (!email || !resetCode) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin"
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại trong hệ thống"
      });
    }

    // Check if reset code exists and is not expired
    if (!user.resetPasswordCode || !user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        message: "Mã xác nhận không tồn tại hoặc đã hết hạn"
      });
    }

    // Check if reset code is expired
    if (Date.now() > user.resetPasswordExpires.getTime()) {
      return res.status(400).json({
        success: false,
        message: "Mã xác nhận đã hết hạn"
      });
    }

    // Verify reset code
    if (user.resetPasswordCode !== resetCode) {
      return res.status(400).json({
        success: false,
        message: "Mã xác nhận không đúng"
      });
    }

    return res.json({
      success: true,
      message: "Mã xác nhận hợp lệ"
    });

  } catch (error) {
    console.error("Error in verify reset code:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra, vui lòng thử lại sau"
    });
  }
});

module.exports = router; 