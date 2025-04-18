const express = require('express');
const router = express.Router();
const { getAllSnacks, getSnackById, createSnack, updateSnack, deleteSnack, getSnacksByCategory } = require('../controllers/snackController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Snack:
 *       type: object
 *       required:
 *         - snackName
 *         - description
 *         - price
 *         - stock
 *         - categoryId
 *       properties:
 *         snackName:
 *           type: string
 *           description: Tên snack
 *           example: "Potato Chips"
 *         description:
 *           type: string
 *           description: Mô tả snack
 *           example: "Crispy potato chips with sea salt"
 *         price:
 *           type: number
 *           description: Giá snack
 *           example: 2.99
 *         stock:
 *           type: number
 *           description: Số lượng trong kho
 *           example: 100
 *         categoryId:
 *           type: string
 *           description: ID của danh mục
 *           example: "banh"
 *         discount:
 *           type: number
 *           description: Phần trăm giảm giá
 *           example: 10
 */

/**
 * @swagger
 * /api/snacks:
 *   get:
 *     summary: Lấy danh sách tất cả snacks
 *     tags: [Snacks]
 *     responses:
 *       200:
 *         description: Danh sách snacks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Snack'
 */
router.get('/', getAllSnacks);

/**
 * @swagger
 * /api/snacks/category/{categoryId}:
 *   get:
 *     summary: Lấy danh sách snacks theo category
 *     tags: [Snacks]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *           enum: ['banh', 'keo', 'do_kho', 'mut', 'hat']
 *         required: true
 *         description: ID của category (banh, keo, do_kho, mut, hat)
 *     responses:
 *       200:
 *         description: Danh sách snacks của category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Snack'
 */
router.get('/category/:categoryId', getSnacksByCategory);

/**
 * @swagger
 * /api/snacks/{id}:
 *   get:
 *     summary: Lấy thông tin snack theo ID
 *     tags: [Snacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của snack
 *     responses:
 *       200:
 *         description: Thông tin snack
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Snack'
 *       404:
 *         description: Không tìm thấy snack
 */
router.get('/:id', getSnackById);

/**
 * @swagger
 * /api/snacks:
 *   post:
 *     summary: Tạo snack mới
 *     tags: [Snacks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Snack'
 *     responses:
 *       201:
 *         description: Tạo snack thành công
 *       401:
 *         description: Không có quyền truy cập
 */
router.post('/', auth, createSnack);

/**
 * @swagger
 * /api/snacks/{id}:
 *   put:
 *     summary: Cập nhật thông tin snack
 *     tags: [Snacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của snack
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Snack'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy snack
 */
router.put('/:id', auth, updateSnack);

/**
 * @swagger
 * /api/snacks/{id}:
 *   delete:
 *     summary: Xóa snack
 *     tags: [Snacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của snack
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy snack
 */
router.delete('/:id', auth, deleteSnack);

module.exports = router; 