// Rate Limiter - Token Bucket Implementation med Redis
// Expert förslag: 1 rps default med 4-burst, Lua-script för atomiska operationer

const { createClient } = require('@redis/client');

class RateLimiter {
  constructor() {
    this.redis = null;
    this.initialized = false;
    
    // Default limits per domain
    this.defaultConfig = {
      rate: 1,        // 1 request per second
      burst: 4,       // Allow burst of 4 requests
      window: 60      // 60 second window
    };
    
    // Lua script för atomiska token bucket operationer
    this.luaScript = `
      local key = KEYS[1]
      local rate = tonumber(ARGV[1])
      local burst = tonumber(ARGV[2]) 
      local window = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])
      
      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(bucket[1]) or burst
      local last_refill = tonumber(bucket[2]) or now
      
      -- Räkna ut tokens att lägga till
      local elapsed = math.max(0, now - last_refill)
      local tokens_to_add = math.floor(elapsed * rate / 1000)
      tokens = math.min(burst, tokens + tokens_to_add)
      
      -- Kontrollera om vi har tokens
      if tokens > 0 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', key, window)
        return {1, tokens}
      else
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', key, window)
        return {0, tokens}
      end
    `;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Försök ansluta till Redis
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = createClient({
        url: redisUrl,
        lazyConnect: true,
        maxRetriesPerRequest: 1
      });

      this.redis.on('error', (err) => {
        console.warn('⚠️ Redis Rate Limiter error (falling back to memory):', err.message);
        if (this.redis) {
          this.redis.disconnect().catch(() => {});
          this.redis = null;
        }
      });

      await this.redis.connect();
      console.log('✅ Rate Limiter connected to Redis');

    } catch (error) {
      console.warn('⚠️ Rate Limiter falling back to memory-based limits:', error.message);
      if (this.redis) {
        this.redis.disconnect().catch(() => {});
        this.redis = null;
      }
      this.initMemoryFallback();
    }

    this.initialized = true;
  }

  initMemoryFallback() {
    // In-memory fallback för när Redis inte är tillgängligt
    this.memoryStore = new Map();
    
    // Rensa gamla entries varje minut
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.memoryStore.entries()) {
        if (now - data.last_refill > 60000) {
          this.memoryStore.delete(key);
        }
      }
    }, 60000);
    
    console.log('📝 Rate Limiter using memory fallback');
  }

  async checkRateLimit(domain, config = null) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const settings = { ...this.defaultConfig, ...config };
    const key = `rate_limit:${domain}`;
    const now = Date.now();
    
    if (this.redis) {
      try {
        // Använd Lua script för atomisk operation
        const result = await this.redis.eval(
          this.luaScript,
          1,
          key,
          settings.rate,
          settings.burst,
          settings.window,
          now
        );
        
        return {
          allowed: result[0] === 1,
          tokens: result[1],
          retryAfter: result[0] === 0 ? Math.ceil(1000 / settings.rate) : null
        };
        
      } catch (error) {
        console.warn('⚠️ Redis rate limit check failed, allowing request:', error.message);
        return { allowed: true, tokens: settings.burst, retryAfter: null };
      }
    }
    
    // Memory fallback
    return this.checkMemoryRateLimit(domain, settings, now);
  }
  
  checkMemoryRateLimit(domain, settings, now) {
    const key = `memory_${domain}`;
    let bucket = this.memoryStore.get(key);
    
    if (!bucket) {
      bucket = {
        tokens: settings.burst,
        last_refill: now
      };
    }
    
    // Lägg till tokens baserat på tid
    const elapsed = now - bucket.last_refill;
    const tokensToAdd = Math.floor(elapsed * settings.rate / 1000);
    bucket.tokens = Math.min(settings.burst, bucket.tokens + tokensToAdd);
    bucket.last_refill = now;
    
    if (bucket.tokens > 0) {
      bucket.tokens--;
      this.memoryStore.set(key, bucket);
      return {
        allowed: true,
        tokens: bucket.tokens,
        retryAfter: null
      };
    } else {
      this.memoryStore.set(key, bucket);
      return {
        allowed: false,
        tokens: 0,
        retryAfter: Math.ceil(1000 / settings.rate)
      };
    }
  }

  // Hämta domain från URL
  extractDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.toLowerCase();
    } catch (error) {
      return 'unknown';
    }
  }

  // Middleware för Express/Next.js
  middleware() {
    return async (req, res, next) => {
      const domain = req.headers['x-target-domain'] || 
                    req.query.url ? this.extractDomain(req.query.url) : 
                    req.headers.host;
      
      const result = await this.checkRateLimit(domain);
      
      if (!result.allowed) {
        res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000));
        return res.status(429).json({
          error: 'Rate limit exceeded',
          domain,
          retryAfter: result.retryAfter,
          message: 'För många förfrågningar. Försök igen om några sekunder.'
        });
      }
      
      // Lägg till rate limit headers
      res.setHeader('X-RateLimit-Domain', domain);
      res.setHeader('X-RateLimit-Tokens', result.tokens);
      
      next();
    };
  }

  async getStats(domain = null) {
    if (!this.redis) {
      return { 
        type: 'memory',
        domains: this.memoryStore ? this.memoryStore.size : 0,
        redis: false 
      };
    }
    
    try {
      const keys = await this.redis.keys('rate_limit:*');
      const stats = {
        type: 'redis',
        totalDomains: keys.length,
        redis: true
      };
      
      if (domain) {
        const key = `rate_limit:${domain}`;
        const bucket = await this.redis.hgetall(key);
        stats.domain = {
          domain,
          tokens: parseInt(bucket.tokens) || 0,
          lastRefill: parseInt(bucket.last_refill) || 0
        };
      }
      
      return stats;
    } catch (error) {
      return { error: error.message, redis: false };
    }
  }
}

// Add cleanup method
RateLimiter.prototype.cleanup = function() {
  if (this.redis) {
    this.redis.disconnect().catch(() => {});
    this.redis = null;
  }
  if (this.memoryStore) {
    this.memoryStore.clear();
  }
  this.initialized = false;
};

// Graceful shutdown på process exit
process.on('SIGTERM', () => {
  if (module.exports.redis) {
    module.exports.cleanup();
  }
});

process.on('SIGINT', () => {
  if (module.exports.redis) {
    module.exports.cleanup();
  }
});

module.exports = new RateLimiter();