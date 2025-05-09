const couponController = require('../../controllers/couponController');
const Coupon = require('../../models/Coupon');
const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock Coupon model
jest.mock('../../models/Coupon');

describe('Kiểm thử CouponController', () => {
  let mockReq;
  let mockRes;
  const couponId = new mongoose.Types.ObjectId('681d8dc9140e2c649ed30663');

  const mockCoupon = {
    _id: couponId,
    code: 'TEST10',
    description: 'Mã giảm giá test',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 10000,
    isActive: true,
    startDate: new Date('2025-05-08'),
    endDate: new Date('2025-05-10'),
    save: jest.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    // Khởi tạo các mock object trước mỗi test case
    mockReq = {
      params: { id: couponId.toString() },
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset tất cả các mock trước mỗi test
    jest.clearAllMocks();

    // Mock các phương thức mongoose
    // Tạo mock cho chain Coupon.find().sort()
    Coupon.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockCoupon])
    });
    
    Coupon.findById = jest.fn().mockResolvedValue(mockCoupon);
    Coupon.findOne = jest.fn().mockResolvedValue(null); // Mặc định không tìm thấy
    
    // Mock constructor và save
    Coupon.mockImplementation((data) => {
      return {
        ...data,
        _id: new mongoose.Types.ObjectId('682e8dc9140e2c649ed30664'),
        save: jest.fn().mockResolvedValue({
          ...data,
          _id: new mongoose.Types.ObjectId('682e8dc9140e2c649ed30664')
        })
      };
    });
  });

  describe('Lấy tất cả mã giảm giá', () => {
    it('nên trả về danh sách tất cả mã giảm giá', async () => {
      await couponController.getAllCoupons(mockReq, mockRes);
      
      expect(Coupon.find).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith([mockCoupon]);
    });

    it('nên xử lý lỗi khi không thể lấy danh sách mã giảm giá', async () => {
      const errorMessage = 'Database error';
      
      // Đặt mock cho trường hợp lỗi
      Coupon.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error(errorMessage))
      });
      
      await couponController.getAllCoupons(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.stringContaining(errorMessage) });
    });
  });

  describe('Tạo mã giảm giá', () => {
    it('nên tạo mã giảm giá mới thành công', async () => {
      mockReq.body = {
        code: 'NEW10',
        description: 'Mã giảm giá mới',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 10000,
        isActive: true,
        startDate: '2023-05-01',
        endDate: '2023-05-31'
      };
      
      // Mock lại constructor cho trường hợp này
      const newCoupon = {
        ...mockReq.body,
        _id: new mongoose.Types.ObjectId('682e8dc9140e2c649ed30664'),
        startDate: new Date('2023-05-01'),
        endDate: new Date('2023-05-31')
      };
      
      Coupon.mockImplementationOnce(() => ({
        ...newCoupon,
        save: jest.fn().mockResolvedValue(newCoupon)
      }));
      
      await couponController.createCoupon(mockReq, mockRes);
      
      expect(Coupon.findOne).toHaveBeenCalledWith({ code: 'NEW10' });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'NEW10'
      }));
    });

    it('nên trả về lỗi 400 khi mã giảm giá đã tồn tại', async () => {
      mockReq.body = {
        code: 'TEST10'
      };
      
      Coupon.findOne.mockResolvedValue(mockCoupon);
      
      await couponController.createCoupon(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Coupon code already exists'
      });
    });

    it('nên trả về lỗi 400 khi dữ liệu không hợp lệ', async () => {
      mockReq.body = {
        code: 'TEST10',
        discountType: 'invalid',
        endDate: 'invalid-date'
      };
      
      // Mock implementation cho trường hợp lỗi validation
      Coupon.mockImplementationOnce(() => ({
        save: jest.fn().mockRejectedValue(new Error('Validation error'))
      }));
      
      await couponController.createCoupon(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid end date format'
      });
    });
  });

  describe('Lấy mã giảm giá theo ID', () => {
    it('nên trả về mã giảm giá theo ID', async () => {
      await couponController.getCouponById(mockReq, mockRes);
      
      expect(Coupon.findById).toHaveBeenCalledWith(couponId.toString());
      expect(mockRes.json).toHaveBeenCalledWith(mockCoupon);
    });

    it('nên trả về lỗi 404 khi không tìm thấy mã giảm giá', async () => {
      Coupon.findById.mockResolvedValue(null);
      
      await couponController.getCouponById(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Coupon not found'
      });
    });
  });

  describe('Cập nhật mã giảm giá', () => {
    it('nên cập nhật mã giảm giá thành công', async () => {
      mockReq.body = {
        description: 'Mã giảm giá đã cập nhật',
        discountValue: 15
      };
      
      const updatedCoupon = {
        ...mockCoupon,
        description: 'Mã giảm giá đã cập nhật',
        discountValue: 15
      };
      
      mockCoupon.save.mockResolvedValue(updatedCoupon);
      
      await couponController.updateCoupon(mockReq, mockRes);
      
      expect(Coupon.findById).toHaveBeenCalledWith(couponId.toString());
      expect(mockCoupon.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(updatedCoupon);
    });

    it('nên trả về lỗi 404 khi không tìm thấy mã giảm giá', async () => {
      Coupon.findById.mockResolvedValue(null);
      
      await couponController.updateCoupon(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Coupon not found'
      });
    });
  });

  describe('Xóa mã giảm giá', () => {
    it('nên xóa mã giảm giá thành công', async () => {
      // Đối với findByIdAndDelete thay vì remove
      Coupon.findByIdAndDelete = jest.fn().mockResolvedValue(mockCoupon);
      
      await couponController.deleteCoupon(mockReq, mockRes);
      
      expect(Coupon.findById).toHaveBeenCalledWith(couponId.toString());
      expect(Coupon.findByIdAndDelete).toHaveBeenCalledWith(couponId.toString());
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Coupon deleted successfully'
      });
    });

    it('nên trả về lỗi 404 khi không tìm thấy mã giảm giá', async () => {
      Coupon.findById.mockResolvedValue(null);
      
      await couponController.deleteCoupon(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Coupon not found'
      });
    });
  });
}); 