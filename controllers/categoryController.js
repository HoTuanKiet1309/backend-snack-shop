const Category = require('../models/Category');
const Snack = require('../models/Snack');
const cacheService = require('../services/cacheService');

exports.getAllCategories = async (req, res) => {
  try {
    // Tạo cache key
    const cacheKey = 'categories:all';
    
    // Kiểm tra cache
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const categories = await Category.find();
    const formattedCategories = categories.map(category => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      _id: category._id,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));
    
    // Lưu kết quả vào cache (1 giờ - danh mục ít thay đổi)
    await cacheService.set(cacheKey, formattedCategories, 3600);
    
    res.json(formattedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { categoryName, categoryId } = req.body;
    
    // Validate categoryId
    const validCategoryIds = ['banh', 'keo', 'mut', 'do_kho', 'hat'];
    if (!validCategoryIds.includes(categoryId)) {
      return res.status(400).json({ 
        message: 'Invalid categoryId. Must be one of: banh, keo, mut, do_kho, hat' 
      });
    }

    const category = new Category({
      categoryId,
      categoryName
    });
    
    const newCategory = await category.save();
    
    // Xóa cache danh mục
    await cacheService.delete('categories:all');
    
    res.status(201).json({
      categoryId: newCategory.categoryId,
      categoryName: newCategory.categoryName,
      _id: newCategory._id,
      createdAt: newCategory.createdAt,
      updatedAt: newCategory.updatedAt
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Category with this ID or name already exists' 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    const oldCategoryId = category.categoryId;
    
    if (req.body.categoryId) {
      // Validate categoryId if it's being updated
      const validCategoryIds = ['banh', 'keo', 'mut', 'do_kho', 'hat'];
      if (!validCategoryIds.includes(req.body.categoryId)) {
        return res.status(400).json({ 
          message: 'Invalid categoryId. Must be one of: banh, keo, mut, do_kho, hat' 
        });
      }
      category.categoryId = req.body.categoryId;
    }
    
    if (req.body.categoryName) {
      category.categoryName = req.body.categoryName;
    }

    const updatedCategory = await category.save();
    
    // Xóa cache
    await cacheService.delete('categories:all');
    
    // Xóa cache của snacks để cập nhật khi category thay đổi
    if (oldCategoryId !== updatedCategory.categoryId) {
      await cacheService.deleteByPattern(`snacks:category:${oldCategoryId}`);
      await cacheService.deleteByPattern(`snacks:category:${updatedCategory.categoryId}`);
      await cacheService.deleteByPattern('snacks:all:*');
    }
    
    res.json({
      categoryId: updatedCategory.categoryId,
      categoryName: updatedCategory.categoryName,
      _id: updatedCategory._id,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Category with this ID or name already exists' 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    const categoryId = category.categoryId;
    await category.remove();
    
    // Xóa cache
    await cacheService.delete('categories:all');
    await cacheService.deleteByPattern(`snacks:category:${categoryId}`);
    await cacheService.deleteByPattern('snacks:all:*');
    
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSnacksByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Tạo cache key
    const cacheKey = `snacks:category:${categoryId}`;
    
    // Kiểm tra cache
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Validate categoryId
    const validCategoryIds = ['banh', 'keo', 'mut', 'do_kho', 'hat'];
    if (!validCategoryIds.includes(categoryId)) {
      return res.status(400).json({ 
        message: 'Invalid categoryId. Must be one of: banh, keo, mut, do_kho, hat' 
      });
    }

    // Find all snacks with matching categoryId
    const snacks = await Snack.find({ categoryId })
      .select('snackName description price discount realPrice stock images categoryId createdAt updatedAt');

    // Lưu kết quả vào cache (15 phút)
    await cacheService.set(cacheKey, snacks, 900);
    
    res.json(snacks);
  } catch (error) {
    console.error('Error getting snacks by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 