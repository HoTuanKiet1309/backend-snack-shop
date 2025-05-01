const Snack = require('../models/Snack');

exports.getAllSnacks = async (req, res) => {
  try {
    const { 
      search,
      category,
      minPrice = 0,
      maxPrice = 300000,
      sort = 'createdAt'
    } = req.query;

    // Build filter object
    let filter = {};
    
    // Add category filter if provided
    if (category && category !== 'all') {
      filter.categoryId = category;
    }

    // Add price range filter
    filter.realPrice = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice)
    };

    // Add search filter if provided
    if (search) {
      filter.snackName = { $regex: search, $options: 'i' };
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price-asc':
        sortObj = { realPrice: 1 };
        break;
      case 'price-desc':
        sortObj = { realPrice: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    const snacks = await Snack.find(filter).sort(sortObj);
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSnacksByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    console.log('Finding snacks with categoryId:', categoryId);
    
    // Validate categoryId
    const validCategories = ['banh', 'keo', 'do_kho', 'mut', 'hat'];
    if (!validCategories.includes(categoryId)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    const snacks = await Snack.find({ categoryId: categoryId });
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