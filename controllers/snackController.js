const Snack = require('../models/Snack');

exports.getAllSnacks = async (req, res) => {
  try {
    const snacks = await Snack.find();
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSnacksByCategory = async (req, res) => {
  try {
    const snacks = await Snack.find({ categoryId: req.params.categoryId });
    console.log('Finding snacks with categoryId:', req.params.categoryId);
    console.log('Found snacks:', snacks);
    res.json(snacks);
  } catch (error) {
    console.error('Error in getSnacksByCategory:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSnackById = async (req, res) => {
  try {
    const snack = await Snack.findById(req.params.id);
    if (!snack) return res.status(404).json({ message: 'Snack not found' });
    res.json(snack);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSnack = async (req, res) => {
  try {
    const snack = new Snack({
      snackName: req.body.snackName,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      categoryId: req.body.categoryId,
      discount: req.body.discount || 0,
      images: req.body.images || []
    });
    const newSnack = await snack.save();
    res.status(201).json(newSnack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSnack = async (req, res) => {
  try {
    const snack = await Snack.findById(req.params.id);
    if (!snack) return res.status(404).json({ message: 'Snack not found' });
    
    Object.assign(snack, req.body);
    const updatedSnack = await snack.save();
    res.json(updatedSnack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSnack = async (req, res) => {
  try {
    const snack = await Snack.findById(req.params.id);
    if (!snack) return res.status(404).json({ message: 'Snack not found' });
    
    await Snack.deleteOne({ _id: req.params.id });
    res.json({ message: 'Snack deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 