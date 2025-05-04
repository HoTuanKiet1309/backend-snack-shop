const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart,
  applyCoupon,
  removeCoupon
} = require('../controllers/cartController');

/**
 * @swagger
 * tags:
 *   name: Carts
 *   description: Quản lý giỏ hàng
 */

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
 *           description: ID của sản phẩm
 *         quantity:
 *           type: number
 *           description: Số lượng
 *     Cart:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         total:
 *           type: number
 *           description: Tổng tiền
 *         discount:
 *           type: number
 *           description: Giảm giá
 *         finalTotal:
 *           type: number
 *           description: Tổng tiền sau giảm giá
 */

/**
 * @swagger
 * /api/carts:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 * 
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Carts]
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
 *                 description: ID của sản phẩm
 *               quantity:
 *                 type: number
 *                 description: Số lượng
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm
 * 
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 * 
 * /api/carts/{snackId}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: snackId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 * 
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: snackId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 * 
 * /api/carts/apply-coupon:
 *   post:
 *     summary: Áp dụng mã giảm giá
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *             properties:
 *               couponCode:
 *                 type: string
 *                 example: "WELCOME10"
 *     responses:
 *       200:
 *         description: Mã giảm giá đã được áp dụng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Đơn hàng không đủ điều kiện để áp dụng mã giảm giá
 *       404:
 *         description: Mã giảm giá không hợp lệ hoặc đã hết hạn
 * 
 * /api/carts/remove-coupon:
 *   post:
 *     summary: Xóa mã giảm giá đã áp dụng
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mã giảm giá đã được xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Không tìm thấy giỏ hàng
 */

// Routes
router.get('/', auth, getCart);
router.post('/', auth, addToCart);
router.put('/:snackId', auth, updateCartItem);
router.delete('/:snackId', auth, removeFromCart);
router.delete('/', auth, clearCart);
router.post('/apply-coupon', auth, applyCoupon);
router.post('/remove-coupon', auth, removeCoupon);

module.exports = router; 