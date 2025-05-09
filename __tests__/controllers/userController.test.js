const userController = require('../../controllers/userController');
const User = require('../../models/User');
const Address = require('../../models/Address');
const Snack = require('../../models/Snack');
const mongoose = require('mongoose');
const { describe, it, expect, beforeEach } = require('@jest/globals');

// Mock các module
jest.mock('../../models/User');
jest.mock('../../models/Address');
jest.mock('../../models/Snack');

describe('Kiểm thử UserController', () => {
  let mockReq;
  let mockRes;
  const userId = new mongoose.Types.ObjectId();
  const addressId = new mongoose.Types.ObjectId();
  const snackId = new mongoose.Types.ObjectId();

  const mockUser = {
    _id: userId,
    email: 'test@example.com',
    firstName: 'Nguyễn',
    lastName: 'Văn A',
    phone: '0987654321',
    avatar: '',
    role: 'user',
    status: 'active',
    snackPoints: 0,
    pointsHistory: [],
    favorites: [snackId],
    comparePassword: jest.fn(),
    save: jest.fn().mockResolvedValue(true)
  };

  const mockAddress = {
    _id: addressId,
    userId: userId,
    fullName: 'Nguyễn Văn A',
    phone: '0987654321',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    specificAddress: '123 Lê Lợi',
    isDefault: true,
    save: jest.fn().mockResolvedValue(true)
  };

  const mockSnack = {
    _id: snackId,
    snackName: 'Bánh quy',
    price: 20000,
    discount: 0,
    realPrice: 20000,
    stock: 100,
    categoryId: 'banh'
  };

  beforeEach(() => {
    // Khởi tạo các mock object trước mỗi test case
    mockReq = {
      user: { userId: userId.toString() },
      params: { id: addressId.toString(), snackId: snackId.toString() },
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset tất cả các mock trước mỗi test
    jest.clearAllMocks();

    // Mock các phương thức
    User.findById = jest.fn().mockImplementation(() => ({
      select: jest.fn().mockResolvedValue(mockUser),
      populate: jest.fn().mockResolvedValue({...mockUser, favorites: [mockSnack]})
    }));
    
    Address.find = jest.fn().mockResolvedValue([mockAddress]);
    Address.findOne = jest.fn().mockResolvedValue(mockAddress);
    Address.findOneAndDelete = jest.fn().mockResolvedValue(mockAddress);
    Address.updateMany = jest.fn().mockResolvedValue({ nModified: 1 });
    
    Snack.findById = jest.fn().mockResolvedValue(mockSnack);
    
    // Mock constructor
    Address.mockImplementation(() => ({
      ...mockAddress,
      save: jest.fn().mockResolvedValue(mockAddress)
    }));
  });

  describe('Lấy thông tin người dùng', () => {
    it('nên trả về thông tin người dùng hiện tại', async () => {
      await userController.getUserProfile(mockReq, mockRes);
      
      expect(User.findById).toHaveBeenCalledWith(userId.toString());
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('nên xử lý lỗi khi không lấy được thông tin người dùng', async () => {
      const errorMessage = 'Database error';
      User.findById.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      await userController.getUserProfile(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('Cập nhật thông tin người dùng', () => {
    it('nên cập nhật thông tin người dùng thành công', async () => {
      mockReq.body = {
        firstName: 'Nguyễn',
        lastName: 'Văn B',
        phone: '0123456789'
      };
      
      const updatedUser = {
        ...mockUser,
        ...mockReq.body,
        save: jest.fn().mockResolvedValue(true)
      };
      
      User.findById = jest.fn().mockResolvedValue(updatedUser);
      
      await userController.updateUserProfile(mockReq, mockRes);
      
      expect(User.findById).toHaveBeenCalledWith(userId.toString());
      expect(updatedUser.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Profile updated successfully'
      });
    });
  });

  describe('Đổi mật khẩu', () => {
    it('nên đổi mật khẩu thành công', async () => {
      mockReq.body = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };
      
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };
      
      User.findById = jest.fn().mockResolvedValue(userWithPassword);
      
      await userController.changePassword(mockReq, mockRes);
      
      expect(User.findById).toHaveBeenCalledWith(userId.toString());
      expect(userWithPassword.comparePassword).toHaveBeenCalledWith('password123');
      expect(userWithPassword.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Password changed successfully'
      });
    });

    it('nên trả về lỗi khi mật khẩu hiện tại không đúng', async () => {
      mockReq.body = {
        currentPassword: 'incorrectpassword',
        newPassword: 'newpassword123'
      };
      
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      
      User.findById = jest.fn().mockResolvedValue(userWithPassword);
      
      await userController.changePassword(mockReq, mockRes);
      
      expect(userWithPassword.comparePassword).toHaveBeenCalledWith('incorrectpassword');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Current password is incorrect'
      });
    });
  });

  describe('Quản lý địa chỉ', () => {
    it('nên trả về danh sách địa chỉ của người dùng', async () => {
      await userController.getUserAddresses(mockReq, mockRes);
      
      expect(Address.find).toHaveBeenCalledWith({ userId: userId.toString() });
      expect(mockRes.json).toHaveBeenCalledWith([mockAddress]);
    });

    it('nên thêm địa chỉ mới thành công', async () => {
      mockReq.body = {
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        specificAddress: '123 Lê Lợi',
        isDefault: true
      };
      
      await userController.addUserAddress(mockReq, mockRes);
      
      expect(Address.updateMany).toHaveBeenCalledWith(
        { userId: userId.toString() },
        { $set: { isDefault: false } }
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        userId: userId,
        fullName: 'Nguyễn Văn A'
      }));
    });

    it('nên cập nhật địa chỉ thành công', async () => {
      mockReq.body = {
        fullName: 'Nguyễn Văn B',
        isDefault: true
      };
      
      const updatedAddress = {
        ...mockAddress,
        fullName: 'Nguyễn Văn B',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Address.findOne = jest.fn().mockResolvedValue(updatedAddress);
      
      await userController.updateUserAddress(mockReq, mockRes);
      
      expect(Address.findOne).toHaveBeenCalledWith({
        _id: addressId.toString(),
        userId: userId.toString()
      });
      expect(Address.updateMany).toHaveBeenCalled();
      expect(updatedAddress.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(updatedAddress);
    });

    it('nên xóa địa chỉ thành công', async () => {
      await userController.deleteUserAddress(mockReq, mockRes);
      
      expect(Address.findOneAndDelete).toHaveBeenCalledWith({
        _id: addressId.toString(),
        userId: userId.toString()
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Address deleted successfully'
      });
    });
  });

  describe('Quản lý yêu thích', () => {
    it('nên trả về danh sách sản phẩm yêu thích', async () => {
      await userController.getUserFavorites(mockReq, mockRes);
      
      expect(User.findById).toHaveBeenCalledWith(userId.toString());
      expect(mockRes.json).toHaveBeenCalledWith([mockSnack]);
    });

    it('nên thêm sản phẩm vào danh sách yêu thích thành công', async () => {
      const userWithFavorites = {
        ...mockUser,
        favorites: [],
        save: jest.fn().mockResolvedValue(true)
      };
      
      User.findById = jest.fn().mockResolvedValue(userWithFavorites);
      
      await userController.addToFavorites(mockReq, mockRes);
      
      expect(Snack.findById).toHaveBeenCalledWith(snackId.toString());
      expect(userWithFavorites.favorites).toEqual([snackId.toString()]);
      expect(userWithFavorites.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Added to favorites successfully'
      });
    });

    it('nên xóa sản phẩm khỏi danh sách yêu thích thành công', async () => {
      const userWithFavorites = {
        ...mockUser,
        favorites: [snackId],
        save: jest.fn().mockResolvedValue(true)
      };
      
      User.findById = jest.fn().mockResolvedValue(userWithFavorites);
      
      await userController.removeFromFavorites(mockReq, mockRes);
      
      expect(User.findById).toHaveBeenCalledWith(userId.toString());
      expect(userWithFavorites.favorites).toEqual([]);
      expect(userWithFavorites.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Removed from favorites successfully'
      });
    });

    it('nên trả về lỗi khi thêm sản phẩm không tồn tại vào yêu thích', async () => {
      Snack.findById = jest.fn().mockResolvedValue(null);
      
      await userController.addToFavorites(mockReq, mockRes);
      
      expect(Snack.findById).toHaveBeenCalledWith(snackId.toString());
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Snack not found'
      });
    });
  });
}); 