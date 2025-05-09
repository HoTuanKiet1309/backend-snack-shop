const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');
const Cart = require('../../models/Cart');

describe('Kiểm thử Model Cart', () => {
  describe('Kiểm tra tính hợp lệ', () => {
    it('nên xác thực giỏ hàng hợp lệ', async () => {
      // Tạo một giỏ hàng với đầy đủ thông tin hợp lệ
      const validCart = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 50000
        }],
        totalPrice: 100000,
        discount: 0,
        totalPriceAfterDiscount: 100000
      });

      const err = validCart.validateSync();
      expect(err).toBeUndefined();
    });

    it('nên thất bại khi thiếu các trường bắt buộc', async () => {
      // Tạo giỏ hàng thiếu các trường bắt buộc
      const cartWithoutRequired = new Cart({});

      const err = cartWithoutRequired.validateSync();
      
      expect(err).toBeDefined();
      expect(err.errors.userId).toBeDefined();
    });

    it('nên thất bại khi thiếu thông tin sản phẩm bắt buộc', async () => {
      // Tạo giỏ hàng với item thiếu thông tin bắt buộc
      const cartWithInvalidItem = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          // Thiếu snackId, quantity và price
        }]
      });

      const err = cartWithInvalidItem.validateSync();
      expect(err).toBeDefined();
      expect(err.errors['items.0.snackId']).toBeDefined();
      expect(err.errors['items.0.quantity']).toBeDefined();
      expect(err.errors['items.0.price']).toBeDefined();
    });

    it('nên thất bại khi số lượng sản phẩm nhỏ hơn 1', async () => {
      // Tạo giỏ hàng với số lượng sản phẩm không hợp lệ
      const cartWithInvalidQuantity = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: [{
          snackId: new mongoose.Types.ObjectId(),
          quantity: 0, // Số lượng không hợp lệ
          price: 50000
        }]
      });

      const err = cartWithInvalidQuantity.validateSync();
      expect(err).toBeDefined();
      expect(err.errors['items.0.quantity']).toBeDefined();
    });
  });

  describe('Giá trị mặc định', () => {
    it('nên đặt tổng giá mặc định là 0', async () => {
      // Kiểm tra tổng giá mặc định
      const cart = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: []
      });

      expect(cart.totalPrice).toBe(0);
    });

    it('nên đặt giảm giá mặc định là 0', async () => {
      // Kiểm tra giảm giá mặc định
      const cart = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: []
      });

      expect(cart.discount).toBe(0);
    });

    it('nên đặt tổng giá sau giảm giá mặc định là 0', async () => {
      // Kiểm tra tổng giá sau giảm giá mặc định
      const cart = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: []
      });

      expect(cart.totalPriceAfterDiscount).toBe(0);
    });

    it('nên đặt couponId mặc định là null', async () => {
      // Kiểm tra couponId mặc định
      const cart = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: []
      });

      expect(cart.couponId).toBeNull();
    });
  });

  describe('Thêm sản phẩm vào giỏ hàng', () => {
    it('nên thêm được nhiều sản phẩm vào giỏ hàng', async () => {
      // Kiểm tra thêm nhiều sản phẩm
      const cart = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: [
          {
            snackId: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 50000
          },
          {
            snackId: new mongoose.Types.ObjectId(),
            quantity: 1,
            price: 75000
          }
        ],
        totalPrice: 175000,
        discount: 0,
        totalPriceAfterDiscount: 175000
      });

      const err = cart.validateSync();
      expect(err).toBeUndefined();
      expect(cart.items.length).toBe(2);
    });

    it('nên cập nhật được số lượng sản phẩm', async () => {
      // Kiểm tra cập nhật số lượng sản phẩm
      const cart = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: [
          {
            snackId: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 50000
          }
        ],
        totalPrice: 100000
      });

      cart.items[0].quantity = 3;
      const err = cart.validateSync();
      expect(err).toBeUndefined();
      expect(cart.items[0].quantity).toBe(3);
    });
  });

  describe('Áp dụng mã giảm giá', () => {
    it('nên lưu được mã giảm giá', async () => {
      // Kiểm tra lưu mã giảm giá
      const couponId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        userId: new mongoose.Types.ObjectId(),
        items: [
          {
            snackId: new mongoose.Types.ObjectId(),
            quantity: 2,
            price: 50000
          }
        ],
        totalPrice: 100000,
        couponId: couponId,
        discount: 10000,
        totalPriceAfterDiscount: 90000
      });

      const err = cart.validateSync();
      expect(err).toBeUndefined();
      expect(cart.couponId).toEqual(couponId);
      expect(cart.discount).toBe(10000);
      expect(cart.totalPriceAfterDiscount).toBe(90000);
    });
  });
}); 