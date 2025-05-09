const cartController = require('../../controllers/cartController');
const Cart = require('../../models/Cart');
const Snack = require('../../models/Snack');
const User = require('../../models/User');
const Coupon = require('../../models/Coupon');
const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock các module
jest.mock('../../models/Cart');
jest.mock('../../models/Snack');
jest.mock('../../models/User');
jest.mock('../../models/Coupon');

describe('Kiểm thử CartController', () => {
  let mockReq;
  let mockRes;
  const userId = new mongoose.Types.ObjectId();
  const snackId = new mongoose.Types.ObjectId();
  const couponId = new mongoose.Types.ObjectId();

  const mockCart = {
    _id: new mongoose.Types.ObjectId(),
    userId,
    items: [
      {
        snackId,
        quantity: 2,
        price: 10000
      }
    ],
    totalPrice: 20000,
    discount: 0,
    totalPriceAfterDiscount: 20000,
    couponId: null,
    save: jest.fn().mockResolvedValue(true)
  };

  const mockUser = {
    _id: userId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockSnack = {
    _id: snackId,
    snackName: 'Test Snack',
    price: 10000,
    discount: 0,
    stock: 10
  };

  const mockCoupon = {
    _id: couponId,
    code: 'TEST10',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 10000,
    isActive: true,
    startDate: new Date(Date.now() - 86400000), // Hôm qua
    endDate: new Date(Date.now() + 86400000) // Ngày mai
  };

  // Setup mock populated cart
  const populatedCart = {
    _id: mockCart._id,
    userId,
    items: [{
      snackId: {
        _id: snackId,
        snackName: 'Test Snack',
        price: 10000,
        stock: 10,
        discount: 0
      },
      quantity: 2,
      price: 10000
    }],
    totalPrice: 20000,
    discount: 0,
    totalPriceAfterDiscount: 20000,
    couponId: null,
    save: jest.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    // Khởi tạo các mock object trước mỗi test case
    mockReq = {
      user: { userId },
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset tất cả các mock trước mỗi test
    jest.clearAllMocks();

    // Mock các phương thức mongoose
    Cart.findOne = jest.fn();
    Cart.findById = jest.fn();
    Snack.findById = jest.fn().mockResolvedValue(mockSnack);
    User.findById = jest.fn().mockResolvedValue(mockUser);
    Coupon.findOne = jest.fn().mockResolvedValue(mockCoupon);

    // Tạo bản sao của mockCart với các phương thức array đơn giản
    const cartWithMethods = {
      ...mockCart,
      items: [...mockCart.items]
    };

    // Sử dụng các phương thức array gốc thay vì mock để tránh đệ quy vô hạn
    cartWithMethods.items.find = function(predicate) {
      for (let i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
          return this[i];
        }
      }
      return undefined;
    };

    cartWithMethods.items.filter = function(predicate) {
      const result = [];
      for (let i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
          result.push(this[i]);
        }
      }
      return result;
    };

    cartWithMethods.items.reduce = function(callback, initialValue) {
      let accumulator = initialValue;
      for (let i = 0; i < this.length; i++) {
        accumulator = callback(accumulator, this[i], i, this);
      }
      return accumulator;
    };

    // Thêm phương thức save
    cartWithMethods.save = jest.fn().mockResolvedValue(cartWithMethods);

    // Mock Cart.findOne để trả về cartWithMethods
    Cart.findOne.mockResolvedValue(cartWithMethods);

    // Tạo bản sao của populatedCart
    const populatedCartWithMethods = {
      ...populatedCart,
      items: [...populatedCart.items],
      save: jest.fn().mockResolvedValue(populatedCart)
    };

    // Mock Cart.findById để trả về object với populate chain đúng
    Cart.findById.mockImplementation(() => {
      const populateChain = {
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(populatedCartWithMethods)
        })
      };
      return populateChain;
    });

    // Mock constructor của Cart
    Cart.mockImplementation(() => {
      const newCart = {
        userId,
        items: [],
        totalPrice: 0,
        discount: 0,
        totalPriceAfterDiscount: 0,
        save: jest.fn().mockResolvedValue({
          userId,
          items: [],
          totalPrice: 0,
          discount: 0,
          totalPriceAfterDiscount: 0
        })
      };
      
      // Thêm các phương thức array đơn giản
      newCart.items.find = () => undefined;
      newCart.items.filter = () => [];
      newCart.items.reduce = () => 0;
      
      return newCart;
    });
  });

  describe('Lấy giỏ hàng', () => {
    it('nên trả về giỏ hàng hiện tại của người dùng', async () => {
      // Kiểm tra lấy giỏ hàng hiện tại
      Cart.findOne.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(mockCart)
      }));

      await cartController.getCart(mockReq, mockRes);
      
      expect(Cart.findOne).toHaveBeenCalledWith({ userId: userId });
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('nên tạo giỏ hàng mới nếu không tìm thấy', async () => {
      // Kiểm tra tạo giỏ hàng mới
      Cart.findOne.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(null)
      }));
      
      await cartController.getCart(mockReq, mockRes);
      
      expect(Cart.findOne).toHaveBeenCalledWith({ userId: userId });
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Thêm vào giỏ hàng', () => {
    it('nên thêm sản phẩm mới vào giỏ hàng', async () => {
      // Kiểm tra thêm sản phẩm mới
      mockReq.body = {
        snackId: snackId.toString(),
        quantity: 1
      };

      // Tạo bản sao của cart item với methods không bị đệ quy
      const testItem = { snackId: snackId.toString(), quantity: 2, price: 10000 };
      const cartItems = [testItem];
      // Gán find trực tiếp bằng hàm thông thường
      cartItems.find = (predicate) => {
        if (predicate(testItem)) return testItem;
        return undefined;
      };
      cartItems.reduce = () => 30000;

      const cartWithItem = {
        ...mockCart,
        items: cartItems,
        save: jest.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(cartWithItem);
      Cart.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(populatedCart)
      }));
      
      await cartController.addToCart(mockReq, mockRes);
      
      expect(Snack.findById).toHaveBeenCalledWith(snackId.toString());
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(cartWithItem.save).toHaveBeenCalled();
    });

    it('nên trả về lỗi 400 khi không đủ số lượng trong kho', async () => {
      // Kiểm tra lỗi không đủ số lượng
      mockReq.body = {
        snackId: snackId.toString(),
        quantity: 20 // Nhiều hơn stock (10)
      };

      await cartController.addToCart(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not enough stock'
      });
    });

    it('nên trả về lỗi 400 khi dữ liệu đầu vào không hợp lệ', async () => {
      // Kiểm tra lỗi dữ liệu đầu vào
      mockReq.body = {
        snackId: snackId.toString(),
        quantity: 0 // Số lượng không hợp lệ
      };

      await cartController.addToCart(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid input data'
      });
    });
  });

  describe('Cập nhật giỏ hàng', () => {
    it('nên cập nhật số lượng sản phẩm trong giỏ hàng', async () => {
      // Kiểm tra cập nhật số lượng
      mockReq.params = {
        snackId: snackId.toString()
      };
      mockReq.body = {
        quantity: 3
      };

      // Item với ID khớp
      const testItem = { snackId, quantity: 2, price: 10000 };
      const cartItems = [testItem];
      cartItems.find = () => testItem;
      cartItems.reduce = () => 30000;

      const cartWithItem = {
        ...mockCart,
        items: cartItems,
        save: jest.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(cartWithItem);
      Cart.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue(populatedCart)
      }));
      
      await cartController.updateCartItem(mockReq, mockRes);
      
      expect(cartWithItem.save).toHaveBeenCalled();
    });

    it('nên trả về lỗi 404 khi không tìm thấy sản phẩm trong giỏ hàng', async () => {
      // Kiểm tra lỗi không tìm thấy sản phẩm
      mockReq.params = {
        snackId: new mongoose.Types.ObjectId().toString() // ID sản phẩm khác
      };
      mockReq.body = {
        quantity: 3
      };
      
      const cartItems = [...mockCart.items];
      cartItems.find = () => undefined;
      
      const cartWithNoMatchingItem = {
        ...mockCart,
        items: cartItems
      };
      
      Cart.findOne.mockResolvedValue(cartWithNoMatchingItem);
      
      await cartController.updateCartItem(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Item not found in cart'
      });
    });
  });

  describe('Xóa khỏi giỏ hàng', () => {
    it('nên xóa sản phẩm khỏi giỏ hàng', async () => {
      // Kiểm tra xóa sản phẩm
      mockReq.params = {
        snackId: snackId.toString()
      };

      const cartItems = [...mockCart.items];
      cartItems.filter = () => [];
      cartItems.reduce = () => 0;
      
      const cartWithItem = {
        ...mockCart,
        items: cartItems,
        save: jest.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(cartWithItem);
      Cart.findById.mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue({...populatedCart, items: []})
      }));
      
      await cartController.removeFromCart(mockReq, mockRes);
      
      expect(cartWithItem.save).toHaveBeenCalled();
    });
  });

  describe('Xóa giỏ hàng', () => {
    it('nên xóa tất cả sản phẩm trong giỏ hàng', async () => {
      // Kiểm tra xóa tất cả sản phẩm
      const cartToClear = {
        ...mockCart,
        save: jest.fn().mockResolvedValue({
          ...mockCart,
          items: [],
          totalPrice: 0
        })
      };

      Cart.findOne.mockResolvedValue(cartToClear);
      
      await cartController.clearCart(mockReq, mockRes);
      
      expect(cartToClear.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('Áp dụng mã giảm giá', () => {
    it('nên áp dụng mã giảm giá thành công', async () => {
      // Kiểm tra áp dụng mã giảm giá
      mockReq.body = {
        couponCode: 'TEST10'
      };

      const cartWithCoupon = {
        ...mockCart,
        save: jest.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(cartWithCoupon);
      
      // Đối tượng mock chuỗi populate đúng cho findById
      const mockPopulateChain = {
        populate: jest.fn()
      };
      
      // Đối tượng trả về từ populate thứ hai
      const mockPopulatedWithCoupon = {
        ...populatedCart,
        discount: 2000,
        totalPriceAfterDiscount: 18000,
        couponId: mockCoupon
      };
      
      // Thiết lập mock cho các lệnh populate
      mockPopulateChain.populate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPopulatedWithCoupon)
      });
      
      Cart.findById.mockReturnValue(mockPopulateChain);
      
      await cartController.applyCoupon(mockReq, mockRes);
      
      expect(cartWithCoupon.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('nên trả về lỗi 404 khi mã giảm giá không hợp lệ', async () => {
      // Kiểm tra lỗi mã giảm giá không hợp lệ
      mockReq.body = {
        couponCode: 'INVALID'
      };

      Coupon.findOne.mockResolvedValue(null);
      
      await cartController.applyCoupon(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired coupon'
      });
    });

    it('nên trả về lỗi 400 khi không đạt giá trị đơn hàng tối thiểu', async () => {
      // Kiểm tra lỗi giá trị đơn hàng tối thiểu
      mockReq.body = {
        couponCode: 'TEST10'
      };

      const minPurchaseCoupon = {
        ...mockCoupon,
        minPurchase: 50000 // Cao hơn giá trị giỏ hàng (20000)
      };

      Coupon.findOne.mockResolvedValue(minPurchaseCoupon);
      
      await cartController.applyCoupon(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Minimum purchase amount not met')
      });
    });
  });
}); 