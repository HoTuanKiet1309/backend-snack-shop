const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { body } = require('express-validator');

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
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email người dùng
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
router.post('/login', login);

module.exports = router; 