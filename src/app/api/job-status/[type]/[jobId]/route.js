const Redis = require('ioredis');

// Singleton Redis instance to prevent memory leaks
let redisInstance = null;
function getRedis() {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd',
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisInstance.on('error', (err) => {
      console.error('Redis job-status error:', err.message);
    });
  }
  return redisInstance;
}

function normalizeType(t) {
  const map = {
    analyze: 'analysis',   // vanlig felmatch
    seo: 'analysis',
    crawl: 'crawl',
    lighthouse: 'lighthouse'
  };
  return map[t] || t;
}

export async function GET(_req, { params }) {
  const { type, jobId } = await params;
  const keyType = normalizeType(type);
  const redis = getRedis();

  try {
    const key = `bull:${keyType}:${jobId}`;
    const h = await redis.hgetall(key);
    if (!h || Object.keys(h).length === 0) {
      return Response.json({ status: 'unknown' });
    }

    const progress = parseInt(h.progress) || 0;

    if (h.finishedOn) {
      let result = null, analysisId = null;
      try {
        result = h.returnvalue ? JSON.parse(h.returnvalue) : null;
        if (h.data) {
          const data = JSON.parse(h.data);
          analysisId = data.analysisId || result?.analysisId || null;
        }
      } catch { /* ignore parse errors */ }
      return Response.json({ 
        status: 'completed', 
        progress: 100, 
        analysisId, 
        result 
      });
    }

    const status = h.processedOn ? 'active' : 'waiting';
    return Response.json({ status, progress });
  } catch (error) {
    console.error('Job status error:', error);
    return Response.json({ status: 'error', message: error.message }, { status: 500 });
  }
}