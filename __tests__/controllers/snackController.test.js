const snackController = require('../../controllers/snackController');
const Snack = require('../../models/Snack');
const cacheService = require('../../services/cacheService');
const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock các module
jest.mock('../../models/Snack');
jest.mock('../../services/cacheService');

describe('Kiểm thử SnackController', () => {
  let mockReq;
  let mockRes;
  const snackId = new mongoose.Types.ObjectId();

  const mockSnack = {
    _id: snackId,
    snackName: 'Bánh quy',
    description: 'Bánh quy thơm ngon',
    price: 20000,
    discount: 10,
    realPrice: 18000,
    stock: 50,
    categoryId: 'banh',
    images: ['image1.jpg', 'image2.jpg'],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true)
  };

  const mockSnacks = [
    mockSnack,
    {
      _id: new mongoose.Types.ObjectId(),
      snackName: 'Kẹo dẻo',
      description: 'Kẹo dẻo nhiều vị',
      price: 15000,
      discount: 0,
      realPrice: 15000,
      stock: 30,
      categoryId: 'keo',
      images: ['image3.jpg']
    }
  ];

  beforeEach(() => {
    // Khởi tạo các mock object trước mỗi test case
    mockReq = {
      params: { id: snackId.toString() },
      query: {},
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset tất cả các mock trước mỗi test
    jest.clearAllMocks();

    // Mock cho console.log để tránh output trong tests
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock các phương thức mongoose
    Snack.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockSnacks)
    });
    Snack.findById = jest.fn().mockResolvedValue(mockSnack);
    Snack.deleteOne = jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 });

    // Mock constructor - không sử dụng Snack.mockImplementation vì gây conflict
    const mockSave = jest.fn().mockResolvedValue(mockSnack);
    Snack.prototype.save = mockSave;

    // Mock cache service
    cacheService.get = jest.fn().mockResolvedValue(null);
    cacheService.set = jest.fn().mockResolvedValue(true);
    cacheService.delete = jest.fn().mockResolvedValue(true);
    cacheService.deleteByPattern = jest.fn().mockResolvedValue(true);
  });

  describe('Lấy tất cả Snacks', () => {
    it('nên trả về danh sách tất cả snacks', async () => {
      mockReq.query = {};
      
      await snackController.getAllSnacks(mockReq, mockRes);
      
      const expectedCacheKey = 'snacks:all::all:0:300000:createdAt';
      expect(cacheService.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(Snack.find).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalledWith(
        expectedCacheKey,
        mockSnacks,
        900
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockSnacks);
    });

    it('nên sử dụng bộ lọc khi có tham số truy vấn', async () => {
      const mockFindChain = {
        sort: jest.fn().mockResolvedValue(mockSnacks)
      };
      Snack.find.mockReturnValue(mockFindChain);
      
      mockReq.query = {
        search: 'bánh',
        category: 'banh',
        minPrice: '10000',
        maxPrice: '50000',
        sort: 'price-asc'
      };

      await snackController.getAllSnacks(mockReq, mockRes);
      
      const expectedCacheKey = 'snacks:all:bánh:banh:10000:50000:price-asc';
      expect(cacheService.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(Snack.find).toHaveBeenCalledWith({
        categoryId: 'banh',
        realPrice: { $gte: 10000, $lte: 50000 },
        snackName: { $regex: 'bánh', $options: 'i' }
      });
      expect(mockFindChain.sort).toHaveBeenCalledWith({ realPrice: 1 });
      expect(mockRes.json).toHaveBeenCalledWith(mockSnacks);
    });

    it('nên trả về dữ liệu từ cache nếu có', async () => {
      cacheService.get.mockResolvedValue(mockSnacks);
      
      await snackController.getAllSnacks(mockReq, mockRes);
      
      expect(cacheService.get).toHaveBeenCalled();
      expect(Snack.find).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockSnacks);
    });
  });

  describe('Lấy Snacks theo danh mục', () => {
    it('nên trả về snacks theo danh mục', async () => {
      mockReq.params = {
        categoryId: 'banh'
      };
      
      Snack.find.mockResolvedValue([mockSnack]);
      
      await snackController.getSnacksByCategory(mockReq, mockRes);
      
      expect(cacheService.get).toHaveBeenCalledWith('snacks:category:banh');
      expect(Snack.find).toHaveBeenCalledWith({ categoryId: 'banh' });
      expect(cacheService.set).toHaveBeenCalledWith(
        'snacks:category:banh',
        [mockSnack],
        900
      );
      expect(mockRes.json).toHaveBeenCalledWith([mockSnack]);
    });

    it('nên trả về lỗi 400 khi danh mục không hợp lệ', async () => {
      mockReq.params = {
        categoryId: 'invalid'
      };
      
      await snackController.getSnacksByCategory(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid category'
      });
    });
  });

  describe('Lấy Snack theo ID', () => {
    it('nên trả về snack theo ID', async () => {
      await snackController.getSnackById(mockReq, mockRes);
      
      expect(cacheService.get).toHaveBeenCalledWith(`snack:${snackId}`);
      expect(Snack.findById).toHaveBeenCalledWith(snackId.toString());
      expect(cacheService.set).toHaveBeenCalledWith(
        `snack:${snackId}`,
        mockSnack,
        1800
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockSnack);
    });

    it('nên trả về lỗi 404 khi không tìm thấy snack', async () => {
      Snack.findById.mockResolvedValue(null);
      
      await snackController.getSnackById(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Snack not found'
      });
    });
  });

  describe('Tạo Snack', () => {
    it('nên tạo snack mới thành công', async () => {
      mockReq.body = {
        snackName: 'Snack mới',
        description: 'Mô tả snack mới',
        price: 25000,
        stock: 60,
        categoryId: 'banh',
        discount: 5,
        images: ['newimage.jpg']
      };
      
      const newSnack = {
        ...mockReq.body,
        _id: new mongoose.Types.ObjectId(),
        realPrice: 23750
      };
      
      // Đảm bảo rằng Snack.prototype.save trả về newSnack
      Snack.prototype.save = jest.fn().mockResolvedValue(newSnack);
      
      await snackController.createSnack(mockReq, mockRes);
      
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:all:*');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:category:banh');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(newSnack);
    });

    it('nên xử lý lỗi khi tạo snack thất bại', async () => {
      mockReq.body = {
        snackName: 'Snack lỗi',
        description: 'Mô tả snack lỗi',
        price: 25000,
        stock: 60,
        categoryId: 'banh'
      };
      
      const errorMessage = 'Validation error';
      const error = new Error(errorMessage);
      
      // Thiết lập lỗi khi gọi save()
      Snack.prototype.save = jest.fn().mockRejectedValue(error);
      
      await snackController.createSnack(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: errorMessage
      });
    });
  });

  describe('Cập nhật Snack', () => {
    it('nên cập nhật snack thành công', async () => {
      mockReq.body = {
        snackName: 'Bánh quy cập nhật',
        price: 22000,
        stock: 45
      };
      
      const updatedSnack = {
        ...mockSnack,
        ...mockReq.body
      };
      
      mockSnack.save.mockResolvedValue(updatedSnack);
      
      await snackController.updateSnack(mockReq, mockRes);
      
      expect(Snack.findById).toHaveBeenCalledWith(snackId.toString());
      expect(mockSnack.save).toHaveBeenCalled();
      expect(cacheService.delete).toHaveBeenCalledWith(`snack:${snackId}`);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:all:*');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(`snacks:category:${mockSnack.categoryId}`);
      expect(mockRes.json).toHaveBeenCalledWith(updatedSnack);
    });

    it('nên trả về lỗi 404 khi không tìm thấy snack', async () => {
      Snack.findById.mockResolvedValue(null);
      
      await snackController.updateSnack(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Snack not found'
      });
    });

    it('nên xóa cache của danh mục cũ và mới khi thay đổi danh mục', async () => {
      mockReq.body = {
        categoryId: 'keo'
      };
      
      const oldCategoryId = 'banh';
      const newCategoryId = 'keo';
      
      const updatedSnack = {
        ...mockSnack,
        categoryId: newCategoryId
      };
      
      mockSnack.save.mockResolvedValue(updatedSnack);
      
      await snackController.updateSnack(mockReq, mockRes);
      
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(`snacks:category:${oldCategoryId}`);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(`snacks:category:${newCategoryId}`);
    });
  });

  describe('Xóa Snack', () => {
    it('nên xóa snack thành công', async () => {
      await snackController.deleteSnack(mockReq, mockRes);
      
      expect(Snack.findById).toHaveBeenCalledWith(snackId.toString());
      expect(Snack.deleteOne).toHaveBeenCalledWith({ _id: snackId.toString() });
      expect(cacheService.delete).toHaveBeenCalledWith(`snack:${snackId}`);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:all:*');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(`snacks:category:${mockSnack.categoryId}`);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Snack deleted'
      });
    });

    it('nên trả về lỗi 404 khi không tìm thấy snack', async () => {
      Snack.findById.mockResolvedValue(null);
      
      await snackController.deleteSnack(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Snack not found'
      });
    });
  });
}); 