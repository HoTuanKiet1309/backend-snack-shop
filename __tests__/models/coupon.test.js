const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');
const Coupon = require('../../models/Coupon');

describe('Kiểm thử Model Coupon', () => {
  describe('Kiểm tra tính hợp lệ', () => {
    it('nên xác thực coupon hợp lệ', async () => {
      // Tạo một coupon với đầy đủ thông tin hợp lệ
      const validCoupon = new Coupon({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 100000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày sau
        isActive: true,
        usageLimit: 100,
        description: 'Giảm 10% cho đơn hàng trên 100.000đ'
      });

      const err = validCoupon.validateSync();
      expect(err).toBeUndefined();
    });

    it('nên thất bại khi thiếu các trường bắt buộc', async () => {
      // Tạo coupon thiếu các trường bắt buộc
      const couponWithoutRequired = new Coupon({});

      const err = couponWithoutRequired.validateSync();
      
      expect(err).toBeDefined();
      expect(err.errors.code).toBeDefined();
      expect(err.errors.discountValue).toBeDefined();
      // startDate có giá trị mặc định nên không báo lỗi khi bị bỏ trống
      // expect(err.errors.startDate).toBeDefined();
      expect(err.errors.endDate).toBeDefined();
    });

    it('nên thất bại khi loại giảm giá không hợp lệ', async () => {
      // Tạo coupon với loại giảm giá không hợp lệ
      const couponWithInvalidType = new Coupon({
        code: 'TEST10',
        discountType: 'invalid_type', // Loại không hợp lệ
        discountValue: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const err = couponWithInvalidType.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.discountType).toBeDefined();
    });

    it('nên thất bại khi giá trị giảm giá âm', async () => {
      // Tạo coupon với giá trị giảm giá âm
      const couponWithNegativeValue = new Coupon({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: -10, // Giá trị âm không hợp lệ
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const err = couponWithNegativeValue.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.discountValue).toBeDefined();
    });
  });

  describe('Thời gian hiệu lực', () => {
    it('nên đặt ngày bắt đầu là thời gian hiện tại theo mặc định', async () => {
      // Kiểm tra ngày bắt đầu mặc định
      const now = Date.now();
      const coupon = new Coupon({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: 10,
        endDate: new Date(now + 7 * 24 * 60 * 60 * 1000)
      });

      expect(coupon.startDate).toBeDefined();
      // Kiểm tra startDate gần với thời gian hiện tại (trong khoảng 5 giây)
      expect(Math.abs(coupon.startDate.getTime() - now)).toBeLessThan(5000);
    });

    it('nên lưu đúng thời gian kết thúc', async () => {
      // Kiểm tra lưu thời gian kết thúc
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const coupon = new Coupon({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: 10,
        startDate: new Date(),
        endDate: endDate
      });

      expect(coupon.endDate).toEqual(endDate);
    });
  });

  describe('Trạng thái và sử dụng', () => {
    it('nên đặt trạng thái mặc định là active', async () => {
      // Kiểm tra trạng thái mặc định là active
      const coupon = new Coupon({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(coupon.isActive).toBe(true);
    });

    it('nên đặt số lần sử dụng mặc định là 0', async () => {
      // Kiểm tra số lần sử dụng mặc định là 0
      const coupon = new Coupon({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(coupon.usedCount).toBe(0);
    });

    it('nên cập nhật số lần sử dụng đúng cách', async () => {
      // Kiểm tra cập nhật số lần sử dụng
      const coupon = new Coupon({
        code: 'TEST10',
        discountType: 'percentage',
        discountValue: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      coupon.usedCount = 5;
      const err = coupon.validateSync();
      expect(err).toBeUndefined();
      expect(coupon.usedCount).toBe(5);
    });
  });

  describe('Loại giảm giá', () => {
    it('nên xử lý giảm giá theo phần trăm đúng cách', async () => {
      // Kiểm tra giảm giá theo phần trăm
      const coupon = new Coupon({
        code: 'PERCENT10',
        discountType: 'percentage',
        discountValue: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(coupon.discountType).toBe('percentage');
      expect(coupon.discountValue).toBe(10);
    });

    it('nên xử lý giảm giá cố định đúng cách', async () => {
      // Kiểm tra giảm giá cố định
      const coupon = new Coupon({
        code: 'FIXED10K',
        discountType: 'fixed',
        discountValue: 10000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(coupon.discountType).toBe('fixed');
      expect(coupon.discountValue).toBe(10000);
    });
  });
}); 