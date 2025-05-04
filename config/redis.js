const Redis = require('ioredis');

// Disable auto reconnect to handle connections manually
const redisOptions = {
    // Thử kết nối từ biến môi trường REDIS_URL trước
    ...(process.env.REDIS_URL ? {} : {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
    }),
    
    // Cấu hình đặc biệt cho Upstash Redis
    tls: process.env.REDIS_URL && process.env.REDIS_URL.includes('upstash') ? { 
        rejectUnauthorized: false 
    } : undefined,
    
    // Giảm số lần thử lại xuống rất thấp để tránh lỗi do thử quá nhiều
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    disconnectTimeout: 2000,
    
    // Không thử kết nối lại tự động khi có lỗi, thay vào đó dùng thuật toán riêng bên dưới
    autoResubscribe: false,
    autoResendUnfulfilledCommands: false,
    
    // Command timeout để tránh chờ đợi quá lâu
    commandTimeout: 3000,
    
    // Retry strategy điều chỉnh để giảm tải
    retryStrategy: function(times) {
        // Chỉ thử lại tối đa 3 lần
        if (times > 3) {
            console.log(`Đã vượt quá số lần thử lại tối đa (${times}). Dừng thử lại.`);
            return null; // Dừng thử lại
        }
        
        // Thời gian giữa các lần thử tăng dần 2s, 4s, 6s
        return times * 2000;
    }
};

// Tạo client với thêm timeout để tránh kết nối bị treo
let redisClient;

// Tái sử dụng connection nếu có thể
if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, redisOptions);
} else {
    redisClient = new Redis(redisOptions);
}

// Chờ đợi giữa các lần reconnect để tránh quá tải
let lastReconnectTime = 0;
let isConnected = false;
let reconnectTimeout = null;

// Chỉ log lỗi quan trọng, bỏ qua lỗi tạm thời
redisClient.on('error', (err) => {
    const now = Date.now();
    
    // Chỉ log lỗi mỗi 10 giây một lần
    if (now - lastReconnectTime > 10000) {
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
            console.log(`Redis connection error (${err.code}). Will attempt reconnection later.`);
        } else {
            console.log(`Redis error: ${err.message}`);
        }
        
        lastReconnectTime = now;
        isConnected = false;
        
        // Đóng kết nối hiện tại và tạo kết nối mới sau 5 giây
        if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
                try {
                    if (!isConnected) {
                        redisClient.disconnect();
                        redisClient.connect();
                    }
                    reconnectTimeout = null;
                } catch (e) {
                    console.log('Error during reconnection', e.message);
                }
            }, 5000);
        }
    }
});

// Giảm số lượng log kết nối thành công
redisClient.on('connect', () => {
    if (!isConnected) {
        console.log('Connected to Redis');
        isConnected = true;
    }
});

// Theo dõi trạng thái kết nối
redisClient.on('close', () => {
    isConnected = false;
});

// Tạo Redis wrapper với fallback cho mọi thao tác
const operations = ['get', 'set', 'del', 'setex', 'exists'];
const safeRedis = {};

operations.forEach(operation => {
    safeRedis[operation] = async (...args) => {
        try {
            if (!isConnected) {
                // Nếu không kết nối được, không cần thử
                return operation === 'get' ? null : false;
            }
            return await redisClient[operation](...args);
        } catch (error) {
            // Trả về giá trị mặc định cho mỗi operation
            if (operation === 'get') return null;
            if (operation === 'exists') return 0;
            return false;
        }
    };
});

// Phương thức đặc biệt, tự động xử lý EX
safeRedis.set = async (key, value, ...args) => {
    try {
        if (!isConnected) return false;
        return await redisClient.set(key, value, ...args);
    } catch (error) {
        return false;
    }
};

// API tương thích với Redis Client
module.exports = safeRedis; 