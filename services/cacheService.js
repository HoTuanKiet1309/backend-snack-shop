const redisClient = require('../config/redis');

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

const cacheService = {
  /**
   * Lấy dữ liệu từ cache
   * @param {string} key - Cache key
   * @returns {Promise<object|null>} Cached data hoặc null
   */
  async get(key) {
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log(`Cache HIT: ${key}`);
        return JSON.parse(cachedData);
      }
      console.log(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Lưu dữ liệu vào cache
   * @param {string} key - Cache key
   * @param {object} data - Data to cache
   * @param {number} expiration - TTL in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, data, expiration = DEFAULT_EXPIRATION) {
    try {
      await redisClient.setex(key, expiration, JSON.stringify(data));
      console.log(`Cache SET: ${key} (TTL: ${expiration}s)`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Xóa một cache key
   * @param {string} key - Cache key to delete
   */
  async delete(key) {
    try {
      await redisClient.del(key);
      console.log(`Cache DELETE: ${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  /**
   * Xóa nhiều cache keys theo pattern
   * @param {string} pattern - Pattern to match (e.g. 'products:*')
   */
  async deleteByPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Cache DELETE PATTERN: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }
};

module.exports = cacheService; 