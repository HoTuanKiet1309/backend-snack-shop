const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getUserProfile, 
  updateUserProfile, 
  changePassword,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserFavorites,
  addToFavorites,
  removeFromFavorites
} = require('../controllers/userController');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: Tên người dùng
 *         lastName:
 *           type: string
 *           description: Họ người dùng
 *         email:
 *           type: string
 *           description: Email người dùng
 *         phone:
 *           type: string
 *           description: Số điện thoại
 *     Address:
 *       type: object
 *       required:
 *         - fullName
 *         - phone
 *         - district
 *         - ward
 *         - specificAddress
 *       properties:
 *         fullName:
 *           type: string
 *           description: Họ và tên người nhận
 *         phone:
 *           type: string
 *           description: Số điện thoại người nhận
 *         district:
 *           type: string
 *           description: Quận (ví dụ: Quận 1)
 *         ward:
 *           type: string
 *           description: Phường
 *         specificAddress:
 *           type: string
 *           description: Địa chỉ cụ thể (số nhà, tên đường)
 *         isDefault:
 *           type: boolean
 *           description: Đặt làm địa chỉ mặc định
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Lấy thông tin profile người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Chưa đăng nhập
 * 
 *   put:
 *     summary: Cập nhật thông tin profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfile'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Đổi mật khẩu
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Mật khẩu hiện tại
 *               newPassword:
 *                 type: string
 *                 description: Mật khẩu mới
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       401:
 *         description: Chưa đăng nhập hoặc mật khẩu không đúng
 */

/**
 * @swagger
 * /api/users/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 * 
 *   post:
 *     summary: Thêm địa chỉ mới
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @swagger
 * /api/users/addresses/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy địa chỉ
 * 
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy địa chỉ
 */

/**
 * @swagger
 * /api/users/addresses/{id}/default:
 *   put:
 *     summary: Đặt địa chỉ làm mặc định
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ
 *     responses:
 *       200:
 *         description: Đặt làm mặc định thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy địa chỉ
 */

/**
 * @swagger
 * /api/users/favorites:
 *   get:
 *     summary: Lấy danh sách sản phẩm yêu thích
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm yêu thích
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Snack'
 * 
 *   post:
 *     summary: Thêm sản phẩm vào danh sách yêu thích
 *     tags: [Users]
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
 *         description: Thêm thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy sản phẩm
 * 
 *   delete:
 *     summary: Xóa sản phẩm khỏi danh sách yêu thích
 *     tags: [Users]
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

// Profile routes
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, updateUserProfile);
router.put('/change-password', auth, changePassword);

// Address routes
router.get('/addresses', auth, getUserAddresses);
router.post('/addresses', auth, addUserAddress);
router.put('/addresses/:id', auth, updateUserAddress);
router.delete('/addresses/:id', auth, deleteUserAddress);

// Favorite routes
router.get('/favorites', auth, getUserFavorites);
router.post('/favorites/:snackId', auth, addToFavorites);
router.delete('/favorites/:snackId', auth, removeFromFavorites);

module.exports = router;