const Snack = require('../models/Snack');
const Order = require('../models/Order');

exports.searchSnacks = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, rating, sortBy } = req.query;
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { snackName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchQuery.categoryId = category;
    }
    
    if (minPrice || maxPrice) {
      searchQuery.realPrice = {};
      if (minPrice) searchQuery.realPrice.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.realPrice.$lte = parseFloat(maxPrice);
    }
    
    if (rating) {
      searchQuery.averageRating = { $gte: parseFloat(rating) };
    }
    
    let sortOptions = {};
    switch (sortBy) {
      case 'price-asc':
        sortOptions = { realPrice: 1 };
        break;
      case 'price-desc':
        sortOptions = { realPrice: -1 };
        break;
      case 'rating':
        sortOptions = { averageRating: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    const snacks = await Snack.find(searchQuery)
      .populate('categoryId')
      .sort(sortOptions);
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchByCategory = async (req, res) => {
  try {
    const snacks = await Snack.find({ categoryId: req.params.categoryId })
      .populate('categoryId')
      .sort({ createdAt: -1 });
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchByPriceRange = async (req, res) => {
  try {
    const { min, max } = req.query;
    const snacks = await Snack.find({
      realPrice: {
        $gte: parseFloat(min),
        $lte: parseFloat(max)
      }
    })
      .populate('categoryId')
      .sort({ realPrice: 1 });
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchByRating = async (req, res) => {
  try {
    const { min } = req.query;
    const snacks = await Snack.find({
      averageRating: { $gte: parseFloat(min) }
    })
      .populate('categoryId')
      .sort({ averageRating: -1 });
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPopularSnacks = async (req, res) => {
  try {
    const popularSnacks = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.snackId',
          totalSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    
    const snackIds = popularSnacks.map(snack => snack._id);
    const snacks = await Snack.find({ _id: { $in: snackIds } })
      .populate('categoryId');
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNewArrivals = async (req, res) => {
  try {
    const snacks = await Snack.find()
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBestSellers = async (req, res) => {
  try {
    const bestSellers = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.snackId',
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);
    
    const snackIds = bestSellers.map(snack => snack._id);
    const snacks = await Snack.find({ _id: { $in: snackIds } })
      .populate('categoryId');
    
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 