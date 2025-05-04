const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderHistory,
  getOrderStatistics,
  getAllOrders,
  getCompletedOrdersStatistics
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
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               snackId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *         totalAmount:
 *           type: number
 *         subtotal:
 *           type: number
 *         shippingFee:
 *           type: number
 *         discount:
 *           type: number
 *         orderStatus:
 *           type: string
 *           enum: [pending, confirmed, processing, shipping, delivered, cancelled]
 *         addressId:
 *           type: string
 *         paymentMethod:
 *           type: string
 *           enum: [COD, SnackPoints, Bank]
 *         snackPointsUsed:
 *           type: number
 *         note:
 *           type: string
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressId
 *             properties:
 *               addressId:
 *                 type: string
 *                 description: ID của địa chỉ giao hàng
 *               paymentMethod:
 *                 type: string
 *                 enum: [COD, Bank]
 *                 description: Phương thức thanh toán
 *               useSnackPoints:
 *                 type: boolean
 *                 description: Sử dụng SnackPoints để thanh toán
 *               note:
 *                 type: string
 *                 description: Ghi chú cho đơn hàng
 *               sendEmail:
 *                 type: boolean
 *                 description: Gửi email xác nhận đơn hàng
 *     responses:
 *       201:
 *         description: Đơn hàng đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Lỗi khi tạo đơn hàng - giỏ hàng trống hoặc SnackPoints không đủ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy địa chỉ hoặc sản phẩm
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

/**
 * @swagger
 * /api/orders/all:
 *   get:
 *     summary: Lấy tất cả đơn hàng trong hệ thống (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Order'
 *                   - type: object
 *                     properties:
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Chưa đăng nhập hoặc không có quyền admin
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /api/orders/statistics/completed:
 *   get:
 *     summary: Lấy thống kê đơn hàng đã hoàn thành
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Lấy thống kê về doanh thu, số lượng đơn hàng và sản phẩm bán chạy từ các đơn hàng đã hoàn thành
 *     responses:
 *       200:
 *         description: Thống kê đơn hàng đã hoàn thành
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       description: Tổng doanh thu từ các đơn hàng đã hoàn thành
 *                       example: 5000000
 *                     totalCompletedOrders:
 *                       type: number
 *                       description: Tổng số đơn hàng đã hoàn thành
 *                       example: 50
 *                     topProducts:
 *                       type: array
 *                       description: Danh sách 5 sản phẩm bán chạy nhất
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: ID của sản phẩm
 *                           name:
 *                             type: string
 *                             description: Tên sản phẩm
 *                           totalSold:
 *                             type: number
 *                             description: Số lượng đã bán
 *                           totalRevenue:
 *                             type: number
 *                             description: Doanh thu từ sản phẩm
 *                           image:
 *                             type: string
 *                             description: URL hình ảnh sản phẩm
 *       401:
 *         description: Chưa đăng nhập hoặc không có quyền admin
 *       500:
 *         description: Lỗi server
 */

// Order routes
router.post('/', auth, createOrder);
router.get('/', auth, getUserOrders);
router.get('/all', auth, getAllOrders);
router.get('/history', auth, getOrderHistory);
router.get('/statistics', auth, getOrderStatistics);
router.get('/statistics/completed', auth, getCompletedOrdersStatistics);
router.get('/:id', auth, getOrderById);
router.put('/:id', auth, updateOrderStatus);
router.delete('/:id', auth, cancelOrder);

module.exports = router; 