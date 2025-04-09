const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/', auth, createOrder);
router.get('/', auth, getUserOrders);
router.get('/:id', auth, getOrderById);
router.put('/:id/status', auth, updateOrderStatus);

module.exports = router; 