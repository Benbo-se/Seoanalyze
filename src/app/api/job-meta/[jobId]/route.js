import { NextResponse } from 'next/server';
import Redis from 'ioredis';

// Singleton Redis instance to prevent memory leaks
let redisInstance = null;
function getRedis() {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd',
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisInstance.on('error', (err) => {
      console.error('Redis job-meta error:', err.message);
    });
  }
  return redisInstance;
}

const QUEUES = ['analysis', 'seo', 'crawl', 'lighthouse', 'gdpr', 'security'];

function parseMaybeJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}

export async function GET(_req, { params }) {
  const { jobId } = await params;
  try {
    const redis = getRedis();
    for (const q of QUEUES) {
      const key = `bull:${q}:${jobId}`;
      const job = await redis.hgetall(key);
      if (job && Object.keys(job).length) {
        // status
        const status = job.finishedOn ? 'completed'
                      : job.failedReason ? 'failed'
                      : job.processedOn ? 'active'
                      : 'waiting';

        // analysisId kan ligga i returnvalue eller data
        let analysisId = null;
        if (job.returnvalue) {
          const r = parseMaybeJSON(job.returnvalue);
          analysisId = r?.analysisId ?? r?.id ?? null;
        }
        if (!analysisId && job.data) {
          const d = parseMaybeJSON(job.data);
          analysisId = d?.analysisId ?? d?.id ?? null;
        }

        return NextResponse.json({
          found: true,
          type: q === 'seo' ? 'analysis' : q,
          status,
          analysisId: analysisId || null,
        });
      }
    }
    return NextResponse.json({ found: false }, { status: 404 });
  } catch (err) {
    console.error('job-meta error', err);
    return NextResponse.json({ error: 'Internal server error', message: err.message }, { status: 500 });
  }
}