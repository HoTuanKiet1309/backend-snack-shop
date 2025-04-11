const express = require('express');
const router = express.Router();
const {
  searchSnacks,
  searchByCategory,
  searchByPriceRange,
  searchByRating,
  getPopularSnacks,
  getNewArrivals,
  getBestSellers
} = require('../controllers/searchController');

// Search routes
router.get('/snacks', searchSnacks);
router.get('/category/:categoryId', searchByCategory);
router.get('/price-range', searchByPriceRange);
router.get('/rating', searchByRating);
router.get('/popular', getPopularSnacks);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);

module.exports = router; 