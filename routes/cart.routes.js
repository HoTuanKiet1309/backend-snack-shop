const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cartController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - snackId
 *         - quantity
 *       properties:
 *         snackId:
 *           type: string
 *           description: ID của snack
 *           example: "507f1f77bcf86cd799439011"
 *         quantity:
 *           type: number
 *           description: Số lượng
 *           example: 2
 *     Cart:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalPrice:
 *           type: number
 *           description: Tổng giá trị giỏ hàng
 *           example: 59.98
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy thông tin giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/', auth, getCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - snackId
 *               - quantity
 *             properties:
 *               snackId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               quantity:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Thêm vào giỏ hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.post('/add', auth, addToCart);

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - snackId
 *               - quantity
 *             properties:
 *               snackId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               quantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Cập nhật giỏ hàng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm trong giỏ hàng
 */
router.put('/update', auth, updateCartItem);

/**
 * @swagger
 * /api/cart/remove/{snackId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: snackId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của snack cần xóa
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm trong giỏ hàng
 */
router.delete('/remove/:snackId', auth, removeFromCart);

module.exports = router; 