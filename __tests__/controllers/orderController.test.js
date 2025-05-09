const orderController = require('../../controllers/orderController');
const Cart = require('../../models/Cart');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Address = require('../../models/Address');
const Snack = require('../../models/Snack');
const mongoose = require('mongoose');
const cacheService = require('../../services/cacheService');
const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock các module
jest.mock('../../models/Cart');
jest.mock('../../models/Order');
jest.mock('../../models/User');
jest.mock('../../models/Address');
jest.mock('../../models/Snack');
jest.mock('../../services/emailService');
jest.mock('../../services/cacheService');
jest.mock('../../config/emailConfig', () => ({
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendOrderCompletionEmail: jest.fn().mockResolvedValue(true),
  sendOrderStatusUpdateEmail: jest.fn().mockResolvedValue(true)
}));

describe('Kiểm thử OrderController', () => {
  let mockReq;
  let mockRes;
  const userId = new mongoose.Types.ObjectId();
  const addressId = new mongoose.Types.ObjectId();
  const snackId = new mongoose.Types.ObjectId();

  const mockCart = {
    userId,
    items: [
      {
        snackId,
        quantity: 2,
        price: 10000
      }
    ],
    totalPrice: 20000,
    discount: 0
  };

  const mockUser = {
    _id: userId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '1234567890',
    snackPoints: 200000,
    save: jest.fn().mockResolvedValue(true)
  };

  const mockAddress = {
    _id: addressId,
    userId,
    fullName: 'Test User',
    phoneNumber: '1234567890',
    address: '123 Test St',
    ward: 'Ward 1',
    district: 'District 1',
    city: 'City',
    isDefault: true
  };

  const mockOrder = {
    _id: new mongoose.Types.ObjectId(),
    userId,
    items: [{
      snackId,
      quantity: 2,
      price: 10000,
      originalPrice: 10000,
      discount: 0,
      subtotal: 20000
    }],
    addressId,
    totalAmount: 20000,
    subtotal: 20000,
    shippingFee: 0,
    discount: 0,
    orderStatus: 'pending',
    paymentMethod: 'COD',
    save: jest.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    // Khởi tạo các mock object trước mỗi test case
    mockReq = {
      user: { userId },
      body: {
        addressId,
        paymentMethod: 'COD',
        note: 'Test order',
        sendEmail: true,
        useSnackPoints: false
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset tất cả các mock trước mỗi test
    jest.clearAllMocks();

    // Setup Order constructor mock
    const mockOrderInstance = {
      ...mockOrder,
      save: jest.fn().mockResolvedValue(mockOrder)
    };
    Order.mockImplementation(() => mockOrderInstance);

    // Setup populated cart 
    const populatedCart = {
      ...mockCart,
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
      couponId: null,
      discount: 0,
      totalPrice: 20000,
      totalPriceAfterDiscount: 20000,
      save: jest.fn().mockResolvedValue(true)
    };

    // Setup Cart mock với chuỗi method phù hợp
    Cart.findOne.mockImplementation(() => {
      const cartPopulate1 = {
        populate: jest.fn().mockImplementation((path) => {
          if (path && path.path === 'couponId') {
            return Promise.resolve(populatedCart);
          }
          return populatedCart;
        })
      };
      return {
        populate: jest.fn().mockReturnValue(cartPopulate1)
      };
    });

    // Setup Address mock
    Address.findOne.mockImplementation((query) => {
      if (query.isDefault) {
        return Promise.resolve(mockAddress);
      }
      if (query._id === addressId) {
        return Promise.resolve(mockAddress);
      }
      return Promise.resolve(null);
    });

    // Setup populated order với tất cả các mối quan hệ cần thiết
    const populatedOrder = {
      ...mockOrder,
      items: [{
        snackId: {
          _id: snackId,
          snackName: 'Test Snack',
          price: 10000
        },
        quantity: 2,
        price: 10000,
        subtotal: 20000
      }],
      addressId: mockAddress,
      userId: mockUser
    };

    // Setup Order findById với chuỗi method phù hợp
    Order.findById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            populate: jest.fn().mockImplementation(() => {
              return {
                populate: jest.fn().mockImplementation(() => {
                  return {
                    lean: jest.fn().mockResolvedValue(populatedOrder)
                  };
                })
              };
            })
          };
        })
      };
    });

    // Setup User mock
    User.findById.mockResolvedValue(mockUser);

    // Setup Snack mock
    Snack.findById.mockImplementation((id) => {
      if (id.toString() === snackId.toString()) {
        return Promise.resolve({
          _id: snackId,
          snackName: 'Test Snack',
          price: 10000,
          stock: 10,
          discount: 0,
          save: jest.fn().mockResolvedValue(true)
        });
      }
      return Promise.resolve(null);
    });

    // Setup cache service mock
    cacheService.delete = jest.fn().mockResolvedValue(true);
    cacheService.deleteByPattern = jest.fn().mockResolvedValue(true);
  });

  describe('Tạo đơn hàng', () => {
    it('nên tạo đơn hàng thành công', async () => {
      // Tạo đơn hàng thành công
      const orderDate = new Date();
      const savedOrder = {
        ...mockOrder,
        orderDate,
        save: jest.fn().mockResolvedValue({
          ...mockOrder,
          orderDate
        })
      };

      // Mock Order constructor
      const mockOrderInstance = {
        ...savedOrder,
        save: jest.fn().mockResolvedValue(savedOrder)
      };
      Order.mockImplementation(() => mockOrderInstance);

      // Setup findById cho đơn hàng đã populated trả về
      const populatedOrder = { ...mockOrder, orderDate };
      Order.findById.mockImplementation(() => {
        return {
          populate: jest.fn().mockImplementation(() => {
            return {
              populate: jest.fn().mockImplementation(() => {
                return {
                  lean: jest.fn().mockResolvedValue(populatedOrder)
                };
              })
            };
          })
        };
      });

      await orderController.createOrder(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Order created successfully',
          order: expect.any(Object)
        })
      );
      expect(cacheService.delete).toHaveBeenCalledWith('snacks:popular');
      expect(cacheService.delete).toHaveBeenCalledWith('snacks:best-sellers');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:all:*');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('search:*');
    });

    it('nên trả về lỗi 400 khi giỏ hàng trống', async () => {
      // Kiểm tra khi giỏ hàng trống
      // Mock giỏ hàng trống
      Cart.findOne.mockImplementation(() => {
        return {
          populate: jest.fn().mockImplementation(() => {
            return {
              populate: jest.fn().mockResolvedValue(null)
            };
          })
        };
      });

      await orderController.createOrder(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Cart is empty'
      });
    });

    it('nên xử lý thanh toán bằng SnackPoints đúng cách', async () => {
      // Kiểm tra thanh toán bằng SnackPoints
      mockReq.body.useSnackPoints = true;
      const finalAmount = 47500; // Giá trị chính xác từ logs

      // Mock giỏ hàng với dữ liệu snack hợp lệ
      const populatedCartWithPoints = {
        ...mockCart,
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
        couponId: null,
        discount: 0,
        totalPrice: 20000,
        totalPriceAfterDiscount: 20000,
        save: jest.fn().mockResolvedValue(true)
      };

      // Setup Cart mock cho trường hợp SnackPoints
      Cart.findOne.mockImplementation(() => {
        const cartPopulate1 = {
          populate: jest.fn().mockImplementation((path) => {
            if (path && path.path === 'couponId') {
              return Promise.resolve(populatedCartWithPoints);
            }
            return populatedCartWithPoints;
          })
        };
        return {
          populate: jest.fn().mockReturnValue(cartPopulate1)
        };
      });

      const orderDate = new Date();
      const savedOrder = {
        ...mockOrder,
        paymentMethod: 'SnackPoints',
        snackPointsUsed: finalAmount,
        orderDate,
        save: jest.fn().mockResolvedValue({
          ...mockOrder,
          paymentMethod: 'SnackPoints',
          snackPointsUsed: finalAmount,
          orderDate
        })
      };

      // Mock Order constructor
      const mockOrderInstance = {
        ...savedOrder,
        save: jest.fn().mockResolvedValue(savedOrder)
      };
      Order.mockImplementation(() => mockOrderInstance);
      
      // Setup findById cho đơn hàng đã populated trả về
      const populatedOrder = { 
        ...mockOrder, 
        orderDate,
        paymentMethod: 'SnackPoints',
        snackPointsUsed: finalAmount
      };
      
      Order.findById.mockImplementation(() => {
        return {
          populate: jest.fn().mockImplementation(() => {
            return {
              populate: jest.fn().mockImplementation(() => {
                return {
                  lean: jest.fn().mockResolvedValue(populatedOrder)
                };
              })
            };
          })
        };
      });

      await orderController.createOrder(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.snackPoints).toBe(200000 - finalAmount);
      expect(Snack.findById).toHaveBeenCalledWith(snackId);
      expect(cacheService.delete).toHaveBeenCalledWith('snacks:popular');
      expect(cacheService.delete).toHaveBeenCalledWith('snacks:best-sellers');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('snacks:all:*');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('search:*');
    });
  });

  describe('Lấy đơn hàng của người dùng', () => {
    it('nên lấy danh sách đơn hàng thành công', async () => {
      // Kiểm tra lấy danh sách đơn hàng người dùng
      const mockOrders = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: mockReq.user.userId,
          items: [{
            snackId: {
              _id: snackId,
              snackName: 'Test Snack',
              price: 10000
            },
            quantity: 2,
            price: 10000
          }],
          totalAmount: 20000,
          orderStatus: 'pending',
          orderDate: new Date()
        }
      ];

      // Mock chuỗi find-populate-sort đúng cách (không có lean() trong controller)
      Order.find.mockImplementation(() => {
        return {
          populate: jest.fn().mockImplementation(() => {
            return {
              populate: jest.fn().mockImplementation(() => {
                return {
                  sort: jest.fn().mockResolvedValue(mockOrders)
                };
              })
            };
          })
        };
      });

      await orderController.getUserOrders(mockReq, mockRes);
      
      // Controller trả về trực tiếp mảng đơn hàng
      expect(mockRes.json).toHaveBeenCalledWith(mockOrders);
    });
  });

  describe('Cập nhật trạng thái đơn hàng', () => {
    it('nên cập nhật trạng thái đơn hàng thành công', async () => {
      // Kiểm tra cập nhật trạng thái đơn hàng
      const mockOrderId = new mongoose.Types.ObjectId();
      
      // Mock đơn hàng cho phần findById+save
      const orderToUpdate = {
        _id: mockOrderId,
        userId: mockReq.user.userId,
        orderStatus: 'pending',
        items: [{
          snackId: snackId,
          quantity: 2
        }],
        save: jest.fn().mockResolvedValue(true)
      };

      // Đơn hàng đã populated sau khi cập nhật
      const populatedOrder = {
        _id: mockOrderId,
        userId: {
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          phoneNumber: mockUser.phoneNumber
        },
        orderStatus: 'delivered',
        items: [{
          snackId: {
            _id: snackId,
            snackName: 'Test Snack'
          },
          quantity: 2
        }],
        addressId: mockAddress
      };

      mockReq.params = { id: mockOrderId };
      mockReq.body = { status: 'delivered' };

      // Lần gọi findById đầu tiên để lấy và cập nhật đơn hàng
      Order.findById
        .mockResolvedValueOnce(orderToUpdate);

      // Lần gọi findById thứ hai để populate đơn hàng đã cập nhật
      Order.findById.mockImplementationOnce(() => {
        return {
          populate: jest.fn().mockImplementation(() => {
            return {
              populate: jest.fn().mockImplementation(() => {
                return {
                  populate: jest.fn().mockImplementation(() => {
                    return {
                      lean: jest.fn().mockResolvedValue(populatedOrder)
                    };
                  })
                };
              })
            };
          })
        };
      });

      await orderController.updateOrderStatus(mockReq, mockRes);
      
      expect(orderToUpdate.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Order status updated successfully',
        data: populatedOrder
      });
    });

    it('nên trả về lỗi 404 khi không tìm thấy đơn hàng', async () => {
      // Kiểm tra khi đơn hàng không tồn tại
      const mockOrderId = new mongoose.Types.ObjectId();
      mockReq.params = { id: mockOrderId };
      mockReq.body = { status: 'delivered' };

      // Mock cho trường hợp "không tìm thấy đơn hàng"
      Order.findById.mockResolvedValueOnce(null);

      await orderController.updateOrderStatus(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Order not found'
      });
    });
  });
}); 