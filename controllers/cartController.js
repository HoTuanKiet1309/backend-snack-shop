const Cart = require('../models/Cart');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId })
      .populate('items.snackId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { snackId, quantity, price } = req.body;
    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({
        userId: req.user.userId,
        items: [{ snackId, quantity, price }],
        totalPrice: quantity * price
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.snackId.toString() === snackId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ snackId, quantity, price });
      }
      cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { snackId, quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.snackId.toString() === snackId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { snackId } = req.params;
    const cart = await Cart.findOne({
      userId: req.user.userId
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.snackId.toString() === snackId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const item = cart.items[itemIndex];
    cart.items.splice(itemIndex, 1);
    cart.totalPrice -= item.price * item.quantity;

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 