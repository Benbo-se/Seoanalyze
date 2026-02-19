import Redis from 'ioredis';

let redis = null;

/**
 * Get Redis instance (singleton)
 */
function getRedisInstance() {
  if (!redis && process.env.REDIS_URL) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Connection timeout
        connectTimeout: 10000,
        // Command timeout
        commandTimeout: 5000,
        // Auto reconnect
        retryDelayOnClusterDown: 300,
        enableOfflineQueue: false,
      });
      
      redis.on('connect', () => {
        console.log('✅ Connected to Redis');
      });
      
      redis.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
      });
      
      redis.on('close', () => {
        console.log('Redis connection closed');
      });
      
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      redis = null;
    }
  }
  
  return redis;
}

/**
 * Generate cache key with namespace
 * @param {string} namespace - Cache namespace
 * @param {string} key - Cache key
 * @returns {string} Full cache key
 */
function generateCacheKey(namespace, key) {
  return `seo-analyzer:${namespace}:${key}`;
}

/**
 * Get cached data
 * @param {string} namespace - Cache namespace
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null
 */
export async function getCached(namespace, key) {
  const client = getRedisInstance();
  if (!client) return null;
  
  try {
    const cacheKey = generateCacheKey(namespace, key);
    const cached = await client.get(cacheKey);
    
    if (cached) {
      console.log(`Cache HIT: ${cacheKey}`);
      return JSON.parse(cached);
    }
    
    console.log(`Cache MISS: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 * @param {string} namespace - Cache namespace
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlSeconds - TTL in seconds (default: 1 hour)
 */
export async function setCached(namespace, key, data, ttlSeconds = 3600) {
  const client = getRedisInstance();
  if (!client) return;
  
  try {
    const cacheKey = generateCacheKey(namespace, key);
    await client.setex(cacheKey, ttlSeconds, JSON.stringify(data));
    console.log(`Cache SET: ${cacheKey} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Delete cached data
 * @param {string} namespace - Cache namespace  
 * @param {string} key - Cache key
 */
export async function deleteCached(namespace, key) {
  const client = getRedisInstance();
  if (!client) return;
  
  try {
    const cacheKey = generateCacheKey(namespace, key);
    await client.del(cacheKey);
    console.log(`Cache DELETE: ${cacheKey}`);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

/**
 * Clear all cached data for a namespace
 * @param {string} namespace - Cache namespace
 */
export async function clearNamespace(namespace) {
  const client = getRedisInstance();
  if (!client) return;
  
  try {
    const pattern = generateCacheKey(namespace, '*');
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(...keys);
      console.log(`Cache CLEAR: Deleted ${keys.length} keys from ${namespace}`);
    }
  } catch (error) {
    console.error('Redis clear namespace error:', error);
  }
}

/**
 * Cache wrapper for API calls
 * @param {string} namespace - Cache namespace
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function that fetches the data
 * @param {number} ttlSeconds - TTL in seconds
 * @returns {Promise<any>} Data from cache or fetch function
 */
export async function cacheWrap(namespace, key, fetchFunction, ttlSeconds = 3600) {
  // Try to get from cache first
  const cached = await getCached(namespace, key);
  if (cached !== null) {
    return cached;
  }
  
  // If not in cache, fetch the data
  try {
    const data = await fetchFunction();
    
    // Cache the result
    await setCached(namespace, key, data, ttlSeconds);
    
    return data;
  } catch (error) {
    console.error('Cache wrap fetch error:', error);
    throw error;
  }
}

/**
 * Cache warming utilities
 */
export const CacheWarmer = {
  /**
   * Warm analysis history cache
   * @param {string} url - URL to warm cache for
   */
  async warmAnalysisHistory(url) {
    const encodedUrl = encodeURIComponent(url);
    const key = `history:${encodedUrl}`;
    
    try {
      // This would typically fetch from database
      const mockHistory = [
        {
          id: '1',
          url: url,
          seoScore: 85,
          status: 'completed',
          createdAt: new Date().toISOString(),
          type: 'seo'
        }
      ];
      
      await setCached('analysis', key, mockHistory, 1800); // 30 min cache
      console.log(`Warmed cache for analysis history: ${url}`);
    } catch (error) {
      console.error('Failed to warm analysis history cache:', error);
    }
  },
  
  /**
   * Warm trending analyses cache
   */
  async warmTrendingAnalyses() {
    try {
      // This would typically fetch trending analyses from database
      const trending = [
        { url: 'example.com', count: 15, latest_score: 85 },
        { url: 'test.se', count: 12, latest_score: 78 },
      ];
      
      await setCached('trending', 'analyses', trending, 300); // 5 min cache
      console.log('Warmed trending analyses cache');
    } catch (error) {
      console.error('Failed to warm trending analyses cache:', error);
    }
  }
};

/**
 * Cache statistics and monitoring
 */
export const CacheStats = {
  /**
   * Get cache statistics
   */
  async getStats() {
    const client = getRedisInstance();
    if (!client) return { connected: false, error: 'Redis not configured' };
    
    try {
      // Force connection if not connected
      if (client.status !== 'ready') {
        await client.connect();
      }
      
      // Test connection with a simple ping
      await client.ping();
      
      const info = await client.info('memory');
      const keyspace = await client.info('keyspace');
      
      return {
        connected: true,
        memory: info,
        keyspace: keyspace,
        status: client.status
      };
    } catch (error) {
      return { 
        connected: false, 
        error: error.message,
        status: client ? client.status : 'none'
      };
    }
  }
};

const redisCache = {
  getCached,
  setCached,
  deleteCached,
  clearNamespace,
  cacheWrap,
  CacheWarmer,
  CacheStats
};

export default redisCache;