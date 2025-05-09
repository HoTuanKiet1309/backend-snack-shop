const Snack = require('../models/Snack');
const cacheService = require('../services/cacheService');

exports.getAllSnacks = async (req, res) => {
  try {
    const { 
      search,
      category,
      minPrice = 0,
      maxPrice = 300000,
      sort = 'createdAt'
    } = req.query;

    // Tạo cache key từ query params
    const cacheKey = `snacks:all:${search || ''}:${category || 'all'}:${minPrice}:${maxPrice}:${sort}`;
    
    // Kiểm tra cache
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Build filter object
    let filter = {};
    
    // Add category filter if provided
    if (category && category !== 'all') {
      filter.categoryId = category;
    }

    // Add price range filter
    filter.realPrice = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice)
    };

    // Add search filter if provided
    if (search) {
      filter.snackName = { $regex: search, $options: 'i' };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price-asc':
        sortObj = { realPrice: 1 };
        break;
      case 'price-desc':
        sortObj = { realPrice: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const snacks = await Snack.find(filter).sort(sortObj);
    
    // Lưu kết quả vào cache (15 phút)
    await cacheService.set(cacheKey, snacks, 900);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSnacksByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    console.log('Finding snacks with categoryId:', categoryId);
    
    // Tạo cache key
    const cacheKey = `snacks:category:${categoryId}`;
    
    // Kiểm tra cache
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Validate categoryId
    const validCategories = ['banh', 'keo', 'do_kho', 'mut', 'hat'];
    if (!validCategories.includes(categoryId)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    const snacks = await Snack.find({ categoryId: categoryId });
    console.log('Found snacks:', snacks);
    
    // Lưu kết quả vào cache (15 phút)
    await cacheService.set(cacheKey, snacks, 900);
    
    res.json(snacks);
  } catch (error) {
    console.error('Error in getSnacksByCategory:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSnackById = async (req, res) => {
  try {
    const snackId = req.params.id;
    
    // Tạo cache key
    const cacheKey = `snack:${snackId}`;
    
    // Kiểm tra cache
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const snack = await Snack.findById(snackId);
    if (!snack) return res.status(404).json({ message: 'Snack not found' });
    
    // Lưu kết quả vào cache (30 phút)
    await cacheService.set(cacheKey, snack, 1800);
    
    res.json(snack);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSnack = async (req, res) => {
  try {
    const snack = new Snack({
      snackName: req.body.snackName,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      categoryId: req.body.categoryId,
      discount: req.body.discount || 0,
      images: req.body.images || []
    });
    const newSnack = await snack.save();
    
    // Xóa cache để cập nhật danh sách sản phẩm
    await cacheService.deleteByPattern('snacks:all:*');
    await cacheService.deleteByPattern(`snacks:category:${newSnack.categoryId}`);
    
    res.status(201).json(newSnack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSnack = async (req, res) => {
  try {
    const snack = await Snack.findById(req.params.id);
    if (!snack) return res.status(404).json({ message: 'Snack not found' });
    
    const oldCategoryId = snack.categoryId;
    Object.assign(snack, req.body);
    const updatedSnack = await snack.save();
    
    // Xóa cache
    await cacheService.delete(`snack:${req.params.id}`);
    await cacheService.deleteByPattern('snacks:all:*');
    await cacheService.deleteByPattern(`snacks:category:${oldCategoryId}`);
    
    // Nếu category thay đổi, xóa cache của category mới
    if (oldCategoryId !== updatedSnack.categoryId) {
      await cacheService.deleteByPattern(`snacks:category:${updatedSnack.categoryId}`);
    }
    
    res.json(updatedSnack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSnack = async (req, res) => {
  try {
    const snack = await Snack.findById(req.params.id);
    if (!snack) return res.status(404).json({ message: 'Snack not found' });
    
    const categoryId = snack.categoryId;
    await Snack.deleteOne({ _id: req.params.id });
    
    // Xóa cache
    await cacheService.delete(`snack:${req.params.id}`);
    await cacheService.deleteByPattern('snacks:all:*');
    await cacheService.deleteByPattern(`snacks:category:${categoryId}`);
    
    res.json({ message: 'Snack deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 