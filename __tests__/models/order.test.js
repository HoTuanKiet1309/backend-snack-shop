const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');
const Order = require('../../models/Order');

describe('Kiểm thử Model Order', () => {
  describe('Kiểm tra tính hợp lệ', () => {
    it('nên xác thực đơn hàng hợp lệ', async () => {
      // Tạo một đơn hàng với đầy đủ thông tin hợp lệ
      const validOrder = new Order({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 50000
        }],
        totalAmount: 100000,
        subtotal: 100000,
        shippingFee: 20000,
        addressId: new mongoose.Types.ObjectId(),
        paymentMethod: 'COD',
        orderStatus: 'pending'
      });

      const err = validOrder.validateSync();
      expect(err).toBeUndefined();
    });

    it('nên thất bại khi thiếu các trường bắt buộc', async () => {
      // Tạo đơn hàng thiếu các trường bắt buộc
      const orderWithoutRequired = new Order({});

      const err = orderWithoutRequired.validateSync();
      
      expect(err).toBeDefined();
      expect(err.errors.userId).toBeDefined();
      expect(err.errors.totalAmount).toBeDefined();
      expect(err.errors.addressId).toBeDefined();
    });

    it('nên thất bại khi phương thức thanh toán không hợp lệ', async () => {
      // Tạo đơn hàng với phương thức thanh toán không hợp lệ
      const orderWithInvalidPayment = new Order({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 50000
        }],
        totalAmount: 100000,
        subtotal: 100000,
        shippingFee: 20000,
        addressId: new mongoose.Types.ObjectId(),
        paymentMethod: 'INVALID_METHOD'
      });

      const err = orderWithInvalidPayment.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.paymentMethod).toBeDefined();
    });
  });

  describe('Trạng thái đơn hàng', () => {
    it('nên đặt trạng thái mặc định là pending', async () => {
      // Kiểm tra trạng thái mặc định là pending
      const order = new Order({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 50000
        }],
        totalAmount: 100000,
        subtotal: 100000,
        shippingFee: 20000,
        addressId: new mongoose.Types.ObjectId(),
        paymentMethod: 'COD'
      });

      expect(order.orderStatus).toBe('pending');
    });

    it('nên cập nhật trạng thái đúng cách', async () => {
      // Kiểm tra cập nhật trạng thái
      const order = new Order({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 50000
        }],
        totalAmount: 100000,
        subtotal: 100000,
        shippingFee: 20000,
        addressId: new mongoose.Types.ObjectId(),
        paymentMethod: 'COD'
      });

      order.orderStatus = 'confirmed';
      const err = order.validateSync();
      expect(err).toBeUndefined();
      expect(order.orderStatus).toBe('confirmed');
    });
  });

  describe('Tính toán giá', () => {
    it('nên xử lý thanh toán bằng SnackPoints đúng cách', async () => {
      // Kiểm tra thanh toán bằng SnackPoints
      const order = new Order({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 50000
        }],
        totalAmount: 100000,
        subtotal: 100000,
        shippingFee: 20000,
        addressId: new mongoose.Types.ObjectId(),
        paymentMethod: 'SnackPoints',
        snackPointsUsed: 100000
      });

      await order.save();
      expect(order.totalAmount).toBe(100000);
      expect(order.snackPointsUsed).toBe(100000);
    });

    it('nên tính tổng tiền đúng cách khi có phí vận chuyển và giảm giá', async () => {
      // Kiểm tra tính tổng tiền với phí vận chuyển và giảm giá
      const order = new Order({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 50000
        }],
        subtotal: 100000,
        shippingFee: 20000,
        discount: 10000,
        totalAmount: 110000,
        addressId: new mongoose.Types.ObjectId(),
        paymentMethod: 'COD'
      });

      await order.save();
      expect(order.totalAmount).toBe(110000); // subtotal + shipping - discount
    });

    it('nên xử lý mã giảm giá đúng cách', async () => {
      // Kiểm tra áp dụng mã giảm giá
      const couponId = new mongoose.Types.ObjectId();
      const order = new Order({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 50000
        }],
        subtotal: 100000,
        shippingFee: 20000,
        discount: 0,
        couponApplied: {
          couponId: couponId,
          code: 'TEST10',
          discount: 10000
        },
        totalAmount: 110000,
        addressId: new mongoose.Types.ObjectId(),
        paymentMethod: 'COD'
      });

      await order.save();
      expect(order.couponApplied.discount).toBe(10000);
      expect(order.totalAmount).toBe(110000);
    });
  });
}); 