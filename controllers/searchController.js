const Snack = require('../models/Snack');
const Order = require('../models/Order');
const cacheService = require('../services/cacheService');

exports.searchSnacks = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, rating, sortBy } = req.query;
    
    // Tạo cache key từ tất cả query params
    const cacheKey = `search:${query || ''}:${category || ''}:${minPrice || '0'}:${maxPrice || 'max'}:${rating || '0'}:${sortBy || 'default'}`;
    
    // Kiểm tra cache
    const cachedResults = await cacheService.get(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { snackName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchQuery.categoryId = category;
    }
    
    if (minPrice || maxPrice) {
      searchQuery.realPrice = {};
      if (minPrice) searchQuery.realPrice.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.realPrice.$lte = parseFloat(maxPrice);
    }
    
    if (rating) {
      searchQuery.averageRating = { $gte: parseFloat(rating) };
    }
    
    let sortOptions = {};
    switch (sortBy) {
      case 'price-asc':
        sortOptions = { realPrice: 1 };
        break;
      case 'price-desc':
        sortOptions = { realPrice: -1 };
        break;
      case 'rating':
        sortOptions = { averageRating: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    const snacks = await Snack.find(searchQuery)
      .populate('categoryId')
      .sort(sortOptions);
    
    // Lưu kết quả vào cache (10 phút)
    await cacheService.set(cacheKey, snacks, 600);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    
    // Tạo cache key
    const cacheKey = `search:category:${categoryId}`;
    
    // Kiểm tra cache
    const cachedResults = await cacheService.get(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    const snacks = await Snack.find({ categoryId })
      .populate('categoryId')
      .sort({ createdAt: -1 });
    
    // Lưu kết quả vào cache (15 phút)
    await cacheService.set(cacheKey, snacks, 900);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchByPriceRange = async (req, res) => {
  try {
    const { min, max } = req.query;
    
    // Tạo cache key
    const cacheKey = `search:price:${min}:${max}`;
    
    // Kiểm tra cache
    const cachedResults = await cacheService.get(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    const snacks = await Snack.find({
      realPrice: {
        $gte: parseFloat(min),
        $lte: parseFloat(max)
      }
    })
      .populate('categoryId')
      .sort({ realPrice: 1 });
    
    // Lưu kết quả vào cache (15 phút)
    await cacheService.set(cacheKey, snacks, 900);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchByRating = async (req, res) => {
  try {
    const { min } = req.query;
    
    // Tạo cache key
    const cacheKey = `search:rating:${min}`;
    
    // Kiểm tra cache
    const cachedResults = await cacheService.get(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    const snacks = await Snack.find({
      averageRating: { $gte: parseFloat(min) }
    })
      .populate('categoryId')
      .sort({ averageRating: -1 });
    
    // Lưu kết quả vào cache (15 phút)
    await cacheService.set(cacheKey, snacks, 900);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPopularSnacks = async (req, res) => {
  try {
    // Tạo cache key
    const cacheKey = 'snacks:popular';
    
    // Kiểm tra cache
    const cachedResults = await cacheService.get(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    const popularSnacks = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.snackId',
          totalSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    
    const snackIds = popularSnacks.map(snack => snack._id);
    const snacks = await Snack.find({ _id: { $in: snackIds } })
      .populate('categoryId');
    
    // Lưu kết quả vào cache (1 giờ) - dữ liệu tổng hợp nên cập nhật ít hơn
    await cacheService.set(cacheKey, snacks, 3600);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNewArrivals = async (req, res) => {
  try {
    // Tạo cache key
    const cacheKey = 'snacks:new-arrivals';
    
    // Kiểm tra cache
    const cachedResults = await cacheService.get(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    const snacks = await Snack.find()
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Lưu kết quả vào cache (15 phút)
    await cacheService.set(cacheKey, snacks, 900);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBestSellers = async (req, res) => {
  try {
    // Tạo cache key
    const cacheKey = 'snacks:best-sellers';
    
    // Kiểm tra cache
    const cachedResults = await cacheService.get(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    const bestSellers = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.snackId',
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);
    
    const snackIds = bestSellers.map(snack => snack._id);
    const snacks = await Snack.find({ _id: { $in: snackIds } })
      .populate('categoryId');
    
    // Lưu kết quả vào cache (1 giờ) - dữ liệu tổng hợp nên cập nhật ít hơn
    await cacheService.set(cacheKey, snacks, 3600);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 