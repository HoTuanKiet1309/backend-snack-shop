const admin = (req, res, next) => {
    // Kiểm tra xem user có tồn tại và có role admin không
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

module.exports = admin; 