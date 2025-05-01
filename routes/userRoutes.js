const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  setDefaultAddress,
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

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// Profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

// Address routes
router.get('/addresses', protect, getUserAddresses);
router.post('/addresses', protect, addUserAddress);
router.put('/addresses/:id', protect, updateUserAddress);
router.delete('/addresses/:id', protect, deleteUserAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// Favorite routes
router.get('/favorites', protect, getUserFavorites);
router.post('/favorites/:snackId', protect, addToFavorites);
router.delete('/favorites/:snackId', protect, removeFromFavorites);

module.exports = router; 