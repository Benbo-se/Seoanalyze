// Next.js App Router API route for analyses
// Migrated from Live-Server/src/api/v1/analyses.routes.js

const analysisRepo = require('../../../../../src/core/analysis.repo');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Singleton Redis instance to prevent memory leaks
let redisInstance = null;
function getRedis() {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisInstance.on('error', (err) => {
      console.error('Redis analyses error:', err.message);
    });
  }
  return redisInstance;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!analysisRepo.isEnabled) {
      return Response.json({
        error: 'Database not available',
        message: 'Analysis listing requires database to be enabled'
      }, { status: 503 });
    }

    const analyses = await analysisRepo.getRecent(type || null, limit);
    
    return Response.json({ analyses });

  } catch (error) {
    console.error('Analysis listing error:', error);
    return Response.json({
      error: 'Failed to list analyses',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, analysisType = 'lighthouse', maxPages = 5 } = body;
    
    // Validate analysisType
    const allowed = new Set(['seo', 'crawl', 'lighthouse']);
    const type = String(analysisType || '').toLowerCase();
    if (!allowed.has(type)) {
      return Response.json({ error: 'Invalid analysisType. Must be seo, crawl, or lighthouse' }, { status: 400 });
    }
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Create analysis record in database and use THAT id
    let analysisId = null;
    if (analysisRepo.isEnabled) {
      const created = await analysisRepo.create({
        targetUrl: url,
        type: type.toLowerCase(),
        status: 'pending'
      });
      analysisId = created?.id;
      console.log(`📝 Created analysis ${analysisId} for ${url}`);
      if (!analysisId) {
        return Response.json({ error: 'Failed to create analysis record' }, { status: 500 });
      }
    } else {
      // Fallback: låt queue/job köra även om DB är av
      analysisId = require('ulid').ulid();
    }

    // Determine queue name based on type - each type gets its own queue
    const queueName = type; // 'seo', 'crawl', or 'lighthouse'
    const queue = new Queue(queueName, { connection: getRedis() });

    // Add job to queue with proper data structure
    const job = await queue.add(queueName, {
      url,
      analysisId,
      maxPages: queueName === 'crawl' ? maxPages : undefined,
      type: queueName
    }, {
      removeOnComplete: 200,
      removeOnFail: 200
    });

    return Response.json({
      id: analysisId,
      jobId: job.id,
      type: type, // Use the validated type, not queueName
      status: 'pending'
    });
  } catch (error) {
    console.error('Failed to create analysis:', error);
    return Response.json({ error: 'Failed to create analysis' }, { status: 500 });
  }
}