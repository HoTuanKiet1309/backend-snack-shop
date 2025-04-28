const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderHistory,
  getOrderStatistics
} = require('../controllers/orderController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - snackId
 *         - quantity
 *         - price
 *       properties:
 *         snackId:
 *           type: string
 *           description: ID của sản phẩm
 *         quantity:
 *           type: number
 *           description: Số lượng
 *         price:
 *           type: number
 *           description: Giá sản phẩm
 *     Order:
 *       type: object
 *       required:
 *         - items
 *         - total
 *         - shippingAddress
 *         - paymentMethod
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         total:
 *           type: number
 *           description: Tổng tiền
 *         discount:
 *           type: number
 *           description: Giảm giá
 *         finalTotal:
 *           type: number
 *           description: Tổng tiền sau giảm giá
 *         shippingAddress:
 *           type: string
 *           description: Địa chỉ giao hàng
 *         paymentMethod:
 *           type: string
 *           enum: [COD, PAYPAL]
 *           description: Phương thức thanh toán
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *           description: Trạng thái đơn hàng
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng mới từ giỏ hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new order using items from the user's cart. No request body needed - all information will be taken from user's cart and default address.
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 order:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     userId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           snackId:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439011
 *                           quantity:
 *                             type: number
 *                             example: 2
 *                           price:
 *                             type: number
 *                             example: 9500
 *                           originalPrice:
 *                             type: number
 *                             example: 10000
 *                           discount:
 *                             type: number
 *                             example: 5
 *                           subtotal:
 *                             type: number
 *                             example: 19000
 *                     totalAmount:
 *                       type: number
 *                       example: 19000
 *                     discount:
 *                       type: number
 *                       example: 0
 *                     originalAmount:
 *                       type: number
 *                       example: 20000
 *                     addressId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     paymentMethod:
 *                       type: string
 *                       example: COD
 *                     orderStatus:
 *                       type: string
 *                       example: pending
 *                     orderDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Giỏ hàng trống hoặc không có địa chỉ giao hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cart is empty
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi server
 * 
 *   get:
 *     summary: Lấy danh sách đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Lấy thông tin đơn hàng theo ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Thông tin đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy đơn hàng
 * 
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *                 description: Trạng thái mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy đơn hàng
 * 
 *   delete:
 *     summary: Hủy đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy đơn hàng
 */

// Order routes
router.post('/', auth, createOrder);
router.get('/', auth, getUserOrders);
router.get('/history', auth, getOrderHistory);
router.get('/:id', auth, getOrderById);
router.put('/:id', auth, updateOrderStatus);
router.delete('/:id', auth, cancelOrder);
router.get('/statistics', auth, getOrderStatistics);

module.exports = router; 