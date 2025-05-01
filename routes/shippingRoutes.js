const express = require('express');
const router = express.Router();
const { calculateShippingFee } = require('../controllers/shippingController');

router.get('/fee', calculateShippingFee);

module.exports = router; 