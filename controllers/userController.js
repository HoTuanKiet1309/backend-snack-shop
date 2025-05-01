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
    res.json(user.favorites);
  } catch (error) {
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
    if (user.favorites.includes(req.params.snackId)) {
      return res.status(400).json({ message: 'Snack already in favorites' });
    }
    
    user.favorites.push(req.params.snackId);
    await user.save();
    res.json({ message: 'Added to favorites successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.favorites = user.favorites.filter(
      favorite => favorite.toString() !== req.params.snackId
    );
    await user.save();
    res.json({ message: 'Removed from favorites successfully' });
  } catch (error) {
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