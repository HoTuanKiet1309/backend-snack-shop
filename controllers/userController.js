const User = require('../models/User');
const Address = require('../models/Address');
const Snack = require('../models/Snack');
const bcrypt = require('bcryptjs');

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
    const { street, city, state, zipCode, isDefault } = req.body;
    const address = new Address({
      userId: req.user.userId,
      street,
      city,
      state,
      zipCode,
      isDefault
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
    const { street, city, state, zipCode, isDefault } = req.body;
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
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