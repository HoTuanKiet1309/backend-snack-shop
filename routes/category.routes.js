const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory, updateCategory, deleteCategory, getSnacksByCategory } = require('../controllers/categoryController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - categoryId
 *         - categoryName
 *       properties:
 *         categoryId:
 *           type: string
 *           description: ID định danh của danh mục
 *           enum: [banh, keo, mut, do_kho, hat]
 *           example: "banh"
 *         categoryName:
 *           type: string
 *           description: Tên danh mục
 *           example: "Bánh"
 *         _id:
 *           type: string
 *           description: MongoDB ID của danh mục
 *           example: "507f1f77bcf86cd799439011"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật cuối
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách tất cả danh mục
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *   
 *   post:
 *     summary: Tạo danh mục mới
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - categoryName
 *             properties:
 *               categoryId:
 *                 type: string
 *                 enum: [banh, keo, mut, do_kho, hat]
 *                 description: ID định danh của danh mục
 *                 example: "banh"
 *               categoryName:
 *                 type: string
 *                 description: Tên danh mục
 *                 example: "Bánh"
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc categoryId không nằm trong danh sách cho phép
 *       401:
 *         description: Không có quyền truy cập
 */
router.get('/', getAllCategories);
router.post('/', auth, createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ID của danh mục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 enum: [banh, keo, mut, do_kho, hat]
 *                 description: ID định danh của danh mục
 *                 example: "banh"
 *               categoryName:
 *                 type: string
 *                 description: Tên danh mục
 *                 example: "Bánh"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc categoryId không nằm trong danh sách cho phép
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy danh mục
 *
 *   delete:
 *     summary: Xóa danh mục
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: MongoDB ID của danh mục
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.put('/:id', auth, updateCategory);
router.delete('/:id', auth, deleteCategory);

/**
 * @swagger
 * /api/categories/{categoryId}/snacks:
 *   get:
 *     summary: Lấy danh sách snacks theo categoryId
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *           enum: [banh, keo, mut, do_kho, hat]
 *         required: true
 *         description: ID định danh của danh mục (banh, keo, mut, do_kho, hat)
 *     responses:
 *       200:
 *         description: Danh sách snacks theo danh mục
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID của snack
 *                   name:
 *                     type: string
 *                     description: Tên snack
 *                   description:
 *                     type: string
 *                     description: Mô tả snack
 *                   price:
 *                     type: number
 *                     description: Giá snack
 *                   image:
 *                     type: string
 *                     description: URL hình ảnh snack
 *                   categoryId:
 *                     type: string
 *                     description: ID định danh của danh mục
 *                   status:
 *                     type: string
 *                     description: Trạng thái snack
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.get('/:categoryId/snacks', getSnacksByCategory);

module.exports = router; 