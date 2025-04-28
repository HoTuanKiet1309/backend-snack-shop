const Address = require('../models/Address');

// Thêm địa chỉ mới
exports.addAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, isDefault } = req.body;

    // Validate input
    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.userId },
        { $set: { isDefault: false } }
      );
    }

    // Create new address
    const address = new Address({
      userId: req.user.userId,
      street,
      city,
      state,
      zipCode,
      isDefault: isDefault || false
    });

    await address.save();

    res.status(201).json({
      message: 'Address added successfully',
      address
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách địa chỉ
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.userId });
    res.json(addresses);
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật địa chỉ
exports.updateAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, isDefault } = req.body;
    const addressId = req.params.id;

    // Check if address exists and belongs to user
    const address = await Address.findOne({
      _id: addressId,
      userId: req.user.userId
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If setting as default, remove default from other addresses
    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.userId, _id: { $ne: addressId } },
        { $set: { isDefault: false } }
      );
    }

    // Update address
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await address.save();

    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: error.message });
  }
};

// Xóa địa chỉ
exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;

    // Check if address exists and belongs to user
    const address = await Address.findOne({
      _id: addressId,
      userId: req.user.userId
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await address.remove();

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: error.message });
  }
};

// Đặt địa chỉ mặc định
exports.setDefaultAddress = async (req, res) => {
  try {
    const addressId = req.params.id;

    // Check if address exists and belongs to user
    const address = await Address.findOne({
      _id: addressId,
      userId: req.user.userId
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Remove default from all other addresses
    await Address.updateMany(
      { userId: req.user.userId, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    res.json({
      message: 'Default address set successfully',
      address
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ message: error.message });
  }
}; 