const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Routes sẽ được thêm sau
router.get('/profile', auth, (req, res) => {
  res.json({ message: 'Profile route' });
});

module.exports = router; 