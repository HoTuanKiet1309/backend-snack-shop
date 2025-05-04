const redisClient = require('../config/redis');
const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

// Tạo bộ nhớ tạm trong trường hợp Redis không khả dụng
const localTokenCache = new Map();

// Xóa token khỏi cache sau khi hết hạn để tránh rò rỉ bộ nhớ
const cleanupExpiredTokens = () => {
    const now = Math.floor(Date.now() / 1000);
    localTokenCache.forEach((data, token) => {
        if (data.exp < now) {
            localTokenCache.delete(token);
        }
    });
};

// Chạy cleanup định kỳ
setInterval(cleanupExpiredTokens, 3600000); // Mỗi giờ

const tokenService = {
    // Tạo và lưu token
    generateToken: async (payload) => {
        try {
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
            
            // Lưu vào Redis
            await redisClient.set(token, payload.userId.toString(), 'EX', TOKEN_EXPIRY);
            
            // Lưu vào cache cục bộ (dự phòng nếu Redis lỗi)
            const decoded = jwt.decode(token);
            localTokenCache.set(token, {
                userId: payload.userId.toString(),
                exp: decoded.exp
            });
            
            return token;
        } catch (error) {
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
            
            // Chỉ lưu vào cache cục bộ nếu Redis lỗi
            const decoded = jwt.decode(token);
            localTokenCache.set(token, {
                userId: payload.userId.toString(),
                exp: decoded.exp
            });
            
            return token;
        }
    },

    // Xác thực token
    verifyToken: async (token) => {
        try {
            // Luôn xác thực JWT trước
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            try {
                // Thử kiểm tra trong Redis
                const userId = await redisClient.get(token);
                
                if (!userId) {
                    // Nếu không có trong Redis, kiểm tra cache cục bộ
                    const cachedData = localTokenCache.get(token);
                    if (cachedData && cachedData.userId === decoded.userId.toString()) {
                        return decoded;
                    }
                }
                
                // Nếu có trong Redis, xác minh khớp với JWT
                if (userId && userId === decoded.userId.toString()) {
                    return decoded;
                }
                
                // Nếu không khớp hoặc không tìm thấy, vẫn tin tưởng JWT
                return decoded;
            } catch (redisError) {
                // Nếu Redis lỗi, sử dụng cache cục bộ
                const cachedData = localTokenCache.get(token);
                if (cachedData && cachedData.userId === decoded.userId.toString()) {
                    return decoded;
                }
                
                // Cuối cùng, tin tưởng JWT
                return decoded;
            }
        } catch (jwtError) {
            throw jwtError;
        }
    },

    // Thêm token vào blacklist khi logout
    blacklistToken: async (token) => {
        try {
            // Xóa khỏi cả Redis và cache cục bộ
            await redisClient.del(token);
            localTokenCache.delete(token);
            
            // Thêm vào blacklist
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.exp) {
                    const timeLeft = decoded.exp - Math.floor(Date.now() / 1000);
                    
                    if (timeLeft > 0) {
                        // Lưu vào cả Redis và cache
                        await redisClient.set(`bl_${token}`, '1', 'EX', timeLeft);
                        
                        // Lưu vào blacklist cục bộ
                        localTokenCache.set(`bl_${token}`, {
                            value: '1',
                            exp: decoded.exp
                        });
                    }
                }
            } catch (error) {
                // Bỏ qua lỗi khi blacklist - logout vẫn thành công
            }
        } catch (error) {
            // Đảm bảo cache cục bộ được xóa
            localTokenCache.delete(token);
        }
    },

    // Kiểm tra token có trong blacklist không
    isTokenBlacklisted: async (token) => {
        try {
            // Kiểm tra Redis trước
            const blacklisted = await redisClient.get(`bl_${token}`);
            if (blacklisted) return true;
            
            // Kiểm tra cache cục bộ
            const cachedBlacklist = localTokenCache.get(`bl_${token}`);
            return !!cachedBlacklist;
        } catch (error) {
            // Nếu Redis lỗi, kiểm tra cache cục bộ
            const cachedBlacklist = localTokenCache.get(`bl_${token}`);
            return !!cachedBlacklist;
        }
    }
};

module.exports = tokenService; 