const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  seedCoupons,
  listAllCoupons
} = require('../controllers/couponController');

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Quản lý mã giảm giá
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       required:
 *         - code
 *         - discountType
 *         - discountValue
 *         - startDate
 *         - endDate
 *       properties:
 *         code:
 *           type: string
 *           description: Mã giảm giá
 *         discountType:
 *           type: string
 *           enum: [percentage, fixed]
 *           description: Loại giảm giá (phần trăm hoặc số tiền cố định)
 *         discountValue:
 *           type: number
 *           description: Giá trị giảm giá
 *         minPurchase:
 *           type: number
 *           description: Giá trị đơn hàng tối thiểu
 *         startDate:
 *           type: string
 *           format: date
 *           description: Ngày bắt đầu
 *         endDate:
 *           type: string
 *           format: date
 *           description: Ngày kết thúc
 *         isActive:
 *           type: boolean
 *           description: Trạng thái kích hoạt
 *         description:
 *           type: string
 *           description: Mô tả mã giảm giá
 */

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: Lấy danh sách tất cả các mã giảm giá
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách mã giảm giá
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Không có quyền admin
 *   post:
 *     tags: [Coupons]
 *     summary: Tạo mã giảm giá mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SUMMER20"
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: "percentage"
 *               discountValue:
 *                 type: number
 *                 example: 20
 *               minPurchase:
 *                 type: number
 *                 example: 100000
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-09-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-12-31"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               description:
 *                 type: string
 *                 example: "Giảm 20% cho đơn hàng từ 100,000đ"
 *     responses:
 *       201:
 *         description: Mã giảm giá được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Không có quyền admin
 * 
 * /api/coupons/{id}:
 *   get:
 *     tags: [Coupons]
 *     summary: Lấy chi tiết mã giảm giá theo ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của mã giảm giá
 *     responses:
 *       200:
 *         description: Chi tiết mã giảm giá
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Không có quyền admin
 *       404:
 *         description: Không tìm thấy mã giảm giá
 *   put:
 *     tags: [Coupons]
 *     summary: Cập nhật mã giảm giá
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của mã giảm giá
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               minPurchase:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mã giảm giá được cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Không có quyền admin
 *       404:
 *         description: Không tìm thấy mã giảm giá
 *   delete:
 *     tags: [Coupons]
 *     summary: Xóa mã giảm giá
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của mã giảm giá
 *     responses:
 *       200:
 *         description: Mã giảm giá đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Coupon deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Không có quyền admin
 *       404:
 *         description: Không tìm thấy mã giảm giá
 *
 * /api/coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Kiểm tra tính hợp lệ của mã giảm giá
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SUMMER20"
 *     responses:
 *       200:
 *         description: Mã giảm giá hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 *       404:
 *         description: Mã giảm giá không hợp lệ hoặc đã hết hạn
 *
 * /api/coupons/seed:
 *   post:
 *     tags: [Coupons]
 *     summary: Tạo dữ liệu mẫu cho mã giảm giá (chỉ dùng cho phát triển)
 *     responses:
 *       201:
 *         description: Dữ liệu mã giảm giá đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Coupons seeded successfully"
 *                 count:
 *                   type: number
 *                   example: 3
 *       400:
 *         description: Mã giảm giá đã tồn tại trong cơ sở dữ liệu
 *
 * /api/coupons/debug:
 *   get:
 *     tags: [Coupons]
 *     summary: List all coupons with debug info (for development)
 *     responses:
 *       200:
 *         description: List of all coupons with debugging information
 */

// Public routes
router.post('/validate', validateCoupon);
router.get('/debug', listAllCoupons);

// Admin routes
router.get('/', auth, admin, getAllCoupons);
router.get('/:id', auth, admin, getCouponById);
router.post('/', auth, admin, createCoupon);
router.put('/:id', auth, admin, updateCoupon);
router.delete('/:id', auth, admin, deleteCoupon);

// Seed route (only for development)
router.post('/seed', seedCoupons);

module.exports = router; 