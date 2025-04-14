const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart,
  applyCoupon
} = require('../controllers/cartController');

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
 * 
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
 *             $ref: '#/components/schemas/CartItem'
 *     responses:
 *       200:
 *         description: Thêm thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm
 * 
 *   put:
 *     summary: Cập nhật số lượng sản phẩm
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: snackId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: Số lượng mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm
 * 
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: snackId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm
 */

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /api/cart/apply-coupon:
 *   post:
 *     summary: Áp dụng mã giảm giá
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã giảm giá
 *     responses:
 *       200:
 *         description: Áp dụng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Mã giảm giá không hợp lệ
 */

// Cart routes
router.get('/', auth, getCart);
router.post('/', auth, addToCart);
router.put('/:snackId', auth, updateCartItem);
router.delete('/:snackId', auth, removeFromCart);
router.delete('/clear', auth, clearCart);
router.post('/apply-coupon', auth, applyCoupon);

module.exports = router; 