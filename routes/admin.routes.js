const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const bcrypt = require('bcryptjs');

// Middleware xác thực cho tất cả các routes
router.use(auth);
router.use(admin);

// Get all users (hiển thị tất cả users và admins)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .select('firstName lastName email phone role status');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Chỉ cho phép admin sửa thông tin của user thường hoặc thông tin của chính mình
        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify other admins' });
        }

        // Không cho phép thay đổi role thành admin
        if (req.body.role === 'admin' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to promote users to admin' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { 
                $set: {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    phone: req.body.phone,
                    role: req.body.role
                }
            },
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Không cho phép xóa admin khác
        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete other admins' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Không cho phép thay đổi trạng thái của admin khác
        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to change other admin status' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset password
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Không cho phép reset mật khẩu của admin khác
        if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reset other admin passwords' });
        }

        // Đặt mật khẩu mặc định là "User@123"
        const defaultPassword = "User@123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });

        res.json({ 
            message: 'Password reset successfully',
            newPassword: defaultPassword
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 