const User = require('../models/User');
const Address = require('../models/Address');
const Snack = require('../models/Snack');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Profile functions
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    
    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Address functions
exports.getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.userId });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addUserAddress = async (req, res) => {
  try {
    const { fullName, phone, district, ward, specificAddress, isDefault } = req.body;

    // Validate required fields
    if (!fullName || !phone || !district || !ward || !specificAddress) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const address = new Address({
      userId: req.user.userId,
      fullName,
      phone,
      district,
      ward,
      specificAddress,
      isDefault: isDefault || false
    });
    
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.userId },
        { $set: { isDefault: false } }
      );
    }
    
    await address.save();
    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserAddress = async (req, res) => {
  try {
    const { fullName, phone, district, ward, specificAddress, isDefault } = req.body;
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (district) address.district = district;
    if (ward) address.ward = ward;
    if (specificAddress) address.specificAddress = specificAddress;
    
    if (isDefault !== undefined) {
      address.isDefault = isDefault;
      if (isDefault) {
        await Address.updateMany(
          { userId: req.user.userId, _id: { $ne: address._id } },
          { $set: { isDefault: false } }
        );
      }
    }
    
    await address.save();
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUserAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Favorite functions
exports.getUserFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('favorites');
    
    // Đảm bảo trả về một mảng, ngay cả khi favorites là undefined
    const favorites = user.favorites || [];
    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addToFavorites = async (req, res) => {
  try {
    const snack = await Snack.findById(req.params.snackId);
    if (!snack) {
      return res.status(404).json({ message: 'Snack not found' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user.favorites) {
      user.favorites = [];
    }
    
    if (user.favorites.some(favId => favId && favId.toString() === req.params.snackId)) {
      return res.status(400).json({ message: 'Snack already in favorites' });
    }
    
    user.favorites.push(req.params.snackId);
    await user.save();
    res.json({ message: 'Added to favorites successfully' });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Đảm bảo favorites là một mảng
    if (!user.favorites) {
      user.favorites = [];
      return res.json({ message: 'Removed from favorites successfully' });
    }
    
    user.favorites = user.favorites.filter(
      favorite => favorite && favorite.toString() !== req.params.snackId
    );
    await user.save();
    res.json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ message: error.message });
  }
};

// Set address as default
exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const addressId = req.params.addressId;

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Unset current default address
      await Address.updateMany(
        { userId: userId, isDefault: true },
        { $set: { isDefault: false } },
        { session }
      );

      // Set new default address
      const address = await Address.findOneAndUpdate(
        { _id: addressId, userId: userId },
        { $set: { isDefault: true } },
        { session, new: true }
      );

      if (!address) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
      }

      await session.commitTransaction();
      res.json({ message: 'Đã cập nhật địa chỉ mặc định', address });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ message: 'Không thể cập nhật địa chỉ mặc định' });
  }
};

// SnackPoints functions
exports.addSnackPoints = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Kiểm tra số điểm nhập vào
    const pointsToAdd = Number(amount);
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
      return res.status(400).json({ 
        message: 'Số SnackPoints không hợp lệ. Vui lòng nhập số dương.' 
      });
    }
    
    // Lấy thông tin người dùng
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Cập nhật số điểm
    user.snackPoints += pointsToAdd;
    await user.save();
    
    res.json({ 
      message: `Nạp thành công ${pointsToAdd} SnackPoints!`,
      currentPoints: user.snackPoints
    });
  } catch (error) {
    console.error("Error adding SnackPoints:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSnackPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('snackPoints');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ snackPoints: user.snackPoints || 0 });
  } catch (error) {
    console.error("Error getting SnackPoints:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSnackPointsBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('snackPoints');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ snackPoints: user.snackPoints || 0 });
  } catch (error) {
    console.error('Error getting snack points balance:', error);
    res.status(500).json({ message: 'Không thể lấy số dư điểm' });
  }
};

exports.loadSnackPoints = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Số điểm nạp không hợp lệ' });
    }
    
    // Kiểm tra nếu phương thức thanh toán là PayPal thì trả về thông báo sử dụng API PayPal
    if (paymentMethod === 'paypal') {
      return res.status(200).json({ 
        redirectToPayPal: true,
        message: 'Vui lòng sử dụng API PayPal để thanh toán',
        paypalEndpoint: '/api/payment/paypal/create'
      });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Phương thức thanh toán là bắt buộc' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Khởi tạo snackPoints nếu chưa có
    if (!user.snackPoints) {
      user.snackPoints = 0;
    }
    
    // Khởi tạo pointsHistory nếu chưa có
    if (!user.pointsHistory) {
      user.pointsHistory = [];
    }
    
    // Thêm điểm vào tài khoản
    user.snackPoints += amount;
    
    // Lưu lịch sử nạp điểm
    user.pointsHistory.push({
      amount: amount,
      type: 'load',
      paymentMethod: paymentMethod,
      transactionId: transactionId || null,
      date: new Date()
    });
    
    await user.save();
    
    res.json({ 
      message: 'Nạp điểm thành công',
      currentBalance: user.snackPoints
    });
  } catch (error) {
    console.error('Error loading snack points:', error);
    res.status(500).json({ message: 'Không thể nạp điểm' });
  }
};

exports.getPointsHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('pointsHistory');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ pointsHistory: user.pointsHistory || [] });
  } catch (error) {
    console.error('Error getting points history:', error);
    res.status(500).json({ message: 'Không thể lấy lịch sử điểm' });
  }
}; 