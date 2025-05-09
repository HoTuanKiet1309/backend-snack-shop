const categoryController = require('../../controllers/categoryController');
const Category = require('../../models/Category');
const Snack = require('../../models/Snack');
const cacheService = require('../../services/cacheService');
const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock các module
jest.mock('../../models/Category');
jest.mock('../../models/Snack');
jest.mock('../../services/cacheService');

describe('Kiểm thử CategoryController', () => {
  let mockReq;
  let mockRes;
  const categoryId = new mongoose.Types.ObjectId();

  const mockCategory = {
    _id: categoryId,
    categoryId: 'banh',
    categoryName: 'Bánh',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(true)
  };

  const mockSnacks = [
    {
      _id: new mongoose.Types.ObjectId(),
      snackName: 'Bánh quy',
      price: 20000,
      discount: 0,
      realPrice: 20000,
      stock: 10,
      categoryId: 'banh',
      images: ['image1.jpg']
    },
    {
      _id: new mongoose.Types.ObjectId(),
      snackName: 'Bánh gạo',
      price: 15000,
      discount: 10,
      realPrice: 13500,
      stock: 20,
      categoryId: 'banh',
      images: ['image2.jpg']
    }
  ];

  beforeEach(() => {
    // Khởi tạo các mock object trước mỗi test case
    mockReq = {
      params: { id: categoryId.toString() },
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset tất cả các mock trước mỗi test
    jest.clearAllMocks();

    // Mock các phương thức mongoose
    Category.find = jest.fn().mockResolvedValue([mockCategory]);
    Category.findById = jest.fn().mockResolvedValue(mockCategory);
    Snack.find = jest.fn().mockResolvedValue(mockSnacks);
    
    // Mock Category constructor với save method
    Category.mockImplementation(() => ({
      ...mockCategory,
      save: jest.fn().mockResolvedValue(mockCategory)
    }));

    // Mock cache service
    cacheService.get = jest.fn().mockResolvedValue(null);
    cacheService.set = jest.fn().mockResolvedValue(true);
    cacheService.delete = jest.fn().mockResolvedValue(true);
    cacheService.deleteByPattern = jest.fn().mockResolvedValue(true);
  });

  describe('Lấy tất cả danh mục', () => {
    it('nên trả về danh sách tất cả danh mục', async () => {
      await categoryController.getAllCategories(mockReq, mockRes);
      
      expect(cacheService.get).toHaveBeenCalledWith('categories:all');
      expect(Category.find).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          categoryId: 'banh',
          categoryName: 'Bánh'
        })
      ]));
    });

    it('nên trả về dữ liệu từ cache nếu có', async () => {
      const cachedData = [{ categoryId: 'banh', categoryName: 'Bánh' }];
      cacheService.get.mockResolvedValue(cachedData);
      
      await categoryController.getAllCategories(mockReq, mockRes);
      
      expect(cacheService.get).toHaveBeenCalledWith('categories:all');
      expect(Category.find).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(cachedData);
    });

    it('nên xử lý lỗi khi không thể lấy danh sách danh mục', async () => {
      const errorMessage = 'Database error';
      Category.find.mockRejectedValue(new Error(errorMessage));
      
      await categoryController.getAllCategories(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.stringContaining(errorMessage) });
    });
  });

  describe('Tạo danh mục', () => {
    it('nên tạo danh mục mới thành công', async () => {
      mockReq.body = {
        categoryId: 'keo',
        categoryName: 'Kẹo'
      };
      
      const newCategory = {
        _id: new mongoose.Types.ObjectId(),
        categoryId: 'keo',
        categoryName: 'Kẹo',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Category.mockImplementation(() => ({
        ...newCategory,
        save: jest.fn().mockResolvedValue(newCategory)
      }));
      
      await categoryController.createCategory(mockReq, mockRes);
      
      expect(cacheService.delete).toHaveBeenCalledWith('categories:all');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        categoryId: 'keo',
        categoryName: 'Kẹo'
      }));
    });

    it('nên trả về lỗi 400 khi categoryId không hợp lệ', async () => {
      mockReq.body = {
        categoryId: 'invalid',
        categoryName: 'Danh mục không hợp lệ'
      };
      
      await categoryController.createCategory(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Invalid categoryId')
      });
    });

    it('nên trả về lỗi 400 khi danh mục đã tồn tại', async () => {
      mockReq.body = {
        categoryId: 'banh',
        categoryName: 'Bánh'
      };
      
      // Tạo lỗi duplicate key với code 11000
      const duplicateError = new Error('Duplicate key error');
      duplicateError.code = 11000;
      
      // Override Category constructor cho test case này
      Category.mockImplementationOnce(() => ({
        ...mockCategory,
        save: jest.fn().mockRejectedValue(duplicateError)
      }));
      
      await categoryController.createCategory(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Category with this ID or name already exists'
      });
    });
  });

  describe('Cập nhật danh mục', () => {
    it('nên cập nhật danh mục thành công', async () => {
      mockReq.body = {
        categoryName: 'Bánh Ngọt'
      };
      
      const updatedCategory = {
        ...mockCategory,
        categoryName: 'Bánh Ngọt'
      };
      
      mockCategory.save.mockResolvedValue(updatedCategory);
      
      await categoryController.updateCategory(mockReq, mockRes);
      
      expect(Category.findById).toHaveBeenCalledWith(categoryId.toString());
      expect(mockCategory.save).toHaveBeenCalled();
      expect(cacheService.delete).toHaveBeenCalledWith('categories:all');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        categoryId: 'banh',
        categoryName: 'Bánh Ngọt'
      }));
    });

    it('nên trả về lỗi 404 khi không tìm thấy danh mục', async () => {
      Category.findById.mockResolvedValue(null);
      
      await categoryController.updateCategory(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('nên trả về lỗi 400 khi categoryId không hợp lệ', async () => {
      mockReq.body = {
        categoryId: 'invalid'
      };
      
      await categoryController.updateCategory(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Invalid categoryId')
      });
    });

    it('nên xóa cache khi thay đổi categoryId', async () => {
      mockReq.body = {
        categoryId: 'keo'
      };
      
      const oldCategoryId = 'banh';
      const newCategoryId = 'keo';
      
      const updatedCategory = {
        ...mockCategory,
        categoryId: newCategoryId
      };
      
      mockCategory.save.mockResolvedValue(updatedCategory);
      
      await categoryController.updateCategory(mockReq, mockRes);
      
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(`snacks:category:${oldCategoryId}`);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(`snacks:category:${newCategoryId}`);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:all:*');
    });
  });

  describe('Xóa danh mục', () => {
    it('nên xóa danh mục thành công', async () => {
      // Đảm bảo mockCategory.categoryId khớp với 'banh'
      const categoryToDelete = {
        ...mockCategory,
        categoryId: 'banh'
      };
      
      Category.findById.mockResolvedValueOnce(categoryToDelete);
      
      // Thiết lập cụ thể thứ tự gọi các pattern
      cacheService.deleteByPattern.mockImplementation((pattern) => {
        if (pattern === 'snacks:category:banh') {
          return Promise.resolve(true);
        } else if (pattern === 'snacks:all:*') {
          return Promise.resolve(true);
        }
        return Promise.resolve(true);
      });
      
      await categoryController.deleteCategory(mockReq, mockRes);
      
      expect(Category.findById).toHaveBeenCalledWith(categoryId.toString());
      expect(categoryToDelete.remove).toHaveBeenCalled();
      expect(cacheService.delete).toHaveBeenCalledWith('categories:all');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:category:banh');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:all:*');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Category deleted'
      });
    });

    it('nên trả về lỗi 404 khi không tìm thấy danh mục', async () => {
      Category.findById.mockResolvedValue(null);
      
      await categoryController.deleteCategory(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });
  });

  describe('Lấy snacks theo danh mục', () => {
    it('nên trả về danh sách snacks theo danh mục', async () => {
      mockReq.params = {
        categoryId: 'banh'
      };
      
      // Xem các mock hiện tại trước khi thay đổi
      console.log = jest.fn(); // Mock console.log để tránh spam test output
      console.error = jest.fn(); // Mock console.error để tránh spam test output
      
      // Thiết lập mockResolvedValue cho các hàm trực tiếp
      Snack.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSnacks)
      });
      
      // Đảm bảo cacheService.get trả về null
      cacheService.get.mockResolvedValue(null);
      
      // Đảm bảo cacheService.set trả về true
      cacheService.set.mockResolvedValue(true);
      
      await categoryController.getSnacksByCategory(mockReq, mockRes);
      
      expect(cacheService.get).toHaveBeenCalledWith('snacks:category:banh');
      expect(Snack.find).toHaveBeenCalledWith({ categoryId: 'banh' });
      expect(mockRes.json).toHaveBeenCalledWith(mockSnacks);
    });

    it('nên trả về dữ liệu từ cache nếu có', async () => {
      mockReq.params = {
        categoryId: 'banh'
      };
      
      cacheService.get.mockResolvedValue(mockSnacks);
      
      await categoryController.getSnacksByCategory(mockReq, mockRes);
      
      expect(cacheService.get).toHaveBeenCalledWith('snacks:category:banh');
      expect(Snack.find).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockSnacks);
    });

    it('nên trả về lỗi 400 khi categoryId không hợp lệ', async () => {
      mockReq.params = {
        categoryId: 'invalid'
      };
      
      await categoryController.getSnacksByCategory(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Invalid categoryId')
      });
    });
  });
}); 