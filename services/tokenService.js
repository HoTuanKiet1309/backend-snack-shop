const redisClient = require('../config/redis');
const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

const tokenService = {
    // Tạo và lưu token vào Redis
    generateToken: async (payload) => {
        try {
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
            
            console.log('Generating token for user:', payload.userId);
            
            // Lưu token vào Redis với key là token và value là userId
            await redisClient.setex(token, TOKEN_EXPIRY, payload.userId);
            
            console.log('Token saved to Redis');
            
            // Kiểm tra token đã lưu chưa
            const savedUserId = await redisClient.get(token);
            console.log('Saved user ID in Redis:', savedUserId);
            
            return token;
        } catch (error) {
            console.error('Error generating token:', error);
            throw error;
        }
    },

    // Xác thực token
    verifyToken: async (token) => {
        try {
            console.log('Verifying token:', token);
            
            // Kiểm tra token có trong Redis không
            const userId = await redisClient.get(token);
            console.log('User ID from Redis:', userId);
            
            if (!userId) {
                console.log('Token not found in Redis');
                throw new Error('Token not found in Redis');
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);
            
            // Kiểm tra userId từ Redis có khớp với userId trong token không
            if (userId !== decoded.userId.toString()) {
                console.log('Token mismatch. Redis userId:', userId, 'Token userId:', decoded.userId);
                throw new Error('Token mismatch');
            }

            return decoded;
        } catch (error) {
            console.error('Token verification error:', error.message);
            throw error;
        }
    },

    // Thêm token vào blacklist khi logout
    blacklistToken: async (token) => {
        try {
            console.log('Blacklisting token:', token);
            
            // Xóa token khỏi Redis
            await redisClient.del(token);
            
            // Thêm vào blacklist với thời gian còn lại của token
            const decoded = jwt.decode(token);
            const timeLeft = decoded.exp - Math.floor(Date.now() / 1000);
            
            if (timeLeft > 0) {
                await redisClient.setex(`bl_${token}`, timeLeft, '1');
                console.log('Token blacklisted for', timeLeft, 'seconds');
            }
        } catch (error) {
            console.error('Error blacklisting token:', error);
        }
    },

    // Kiểm tra token có trong blacklist không
    isTokenBlacklisted: async (token) => {
        const blacklisted = await redisClient.get(`bl_${token}`);
        console.log('Token blacklist check:', token, 'Result:', !!blacklisted);
        return !!blacklisted;
    }
};

module.exports = tokenService; 