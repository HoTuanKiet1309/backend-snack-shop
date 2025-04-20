const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const tokenService = require('../services/tokenService');

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

        // Kiểm tra user có tồn tại không
        const user = await User.findOne({ email });
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

module.exports = router; 