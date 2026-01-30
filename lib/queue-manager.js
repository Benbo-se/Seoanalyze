const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Parse Redis URL or use individual config
function getRedisConfig() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined
  };
}

// Skapa Redis-klient med reconnect
const redis = new Redis(getRedisConfig());
redis.options.maxRetriesPerRequest = 3;
redis.options.enableOfflineQueue = false;
redis.options.retryStrategy = (times) => {
  const delay = Math.min(times * 50, 2000);
  console.log(`Redis reconnect attempt ${times}, waiting ${delay}ms`);
  return delay;
};

// Hantera Redis-anslutning
redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

// Skapa köer med BullMQ format
const redisConnection = getRedisConfig();
const lighthouseQueue = new Queue('lighthouse', { connection: redisConnection });
const crawlQueue = new Queue('crawl', { connection: redisConnection });
const seoQueue = new Queue('seo', { connection: redisConnection });
const aiAnalysisQueue = new Queue('ai-analysis', { connection: redisConnection });
const gdprQueue = new Queue('gdpr', { connection: redisConnection });
const securityQueue = new Queue('security', { connection: redisConnection });

// Konfigurera retry för köer
const queueOptions = {
  removeOnComplete: 100,  // Behåll senaste 100 slutförda jobb
  removeOnFail: 50,       // Behåll senaste 50 misslyckade jobb
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
};

// Lägg till jobb i kö
async function addLighthouseJob(data) {
  try {
    const job = await lighthouseQueue.add('lighthouse-job', data, {
      removeOnComplete: 100,
      removeOnFail: 10,  // Håll fler failed jobs för debugging
      timeout: 240000,   // 4 minuter timeout
      attempts: 3,       // Försök 3 gånger innan det ger upp
      backoff: {
        type: 'exponential',
        delay: 5000      // Vänta 5s, 10s, 20s mellan försök
      }
    });
    console.log(`Added Lighthouse job ${job.id} for ${data.url}`);
    
    // Set initial state in Redis
    await redis.hset(`job:${job.id}`, {
      state: 'waiting',
      type: 'lighthouse',
      url: data.url,
      createdAt: Date.now()
    });
    
    return job;
  } catch (error) {
    console.error('Failed to add Lighthouse job:', error);
    throw error;
  }
}

async function addCrawlJob(data) {
  try {
    const job = await crawlQueue.add('crawl-job', data, {
      removeOnComplete: 100,
      removeOnFail: 50,
      timeout: 120000  // 2 minuter timeout
    });
    console.log(`Added Crawl job ${job.id} for ${data.url}`);
    
    // Set initial state in Redis
    await redis.hset(`job:${job.id}`, {
      state: 'waiting',
      type: 'crawl',
      url: data.url,
      createdAt: Date.now()
    });
    
    return job;
  } catch (error) {
    console.error('Failed to add Crawl job:', error);
    throw error;
  }
}

async function addSeoJob(data) {
  try {
    const job = await seoQueue.add('seo-job', data, {
      removeOnComplete: 100,
      removeOnFail: 50,
      timeout: 30000  // 30 sekunder timeout
    });
    console.log(`Added SEO job ${job.id} for ${data.url}`);

    // Set initial state in Redis
    await redis.hset(`job:${job.id}`, {
      state: 'waiting',
      type: 'seo',
      url: data.url,
      createdAt: Date.now()
    });

    return job;
  } catch (error) {
    console.error('Failed to add SEO job:', error);
    throw error;
  }
}

async function addAiAnalysisJob(data) {
  try {
    const job = await aiAnalysisQueue.add('ai-analysis-job', data, {
      removeOnComplete: 100,
      removeOnFail: 50,
      timeout: 300000  // 5 minuter timeout (längre pga flera analyser + AI)
    });
    console.log(`🤖 Added AI Analysis job ${job.id} for ${data.url}`);

    // Set initial state in Redis
    await redis.hset(`job:${job.id}`, {
      state: 'waiting',
      type: 'ai-analysis',
      url: data.url,
      aiAnalysisId: data.aiAnalysisId,
      createdAt: Date.now()
    });

    return job;
  } catch (error) {
    console.error('Failed to add AI Analysis job:', error);
    throw error;
  }
}

async function addGdprJob(data) {
  try {
    const job = await gdprQueue.add('gdpr-job', data, {
      removeOnComplete: 100,
      removeOnFail: 50,
      timeout: 300000,  // 5 minuter timeout (Puppeteer + AI)
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
    console.log(`🍪 Added GDPR job ${job.id} for ${data.url}`);

    // Set initial state in Redis
    await redis.hset(`job:${job.id}`, {
      state: 'waiting',
      type: 'gdpr',
      url: data.url,
      analysisId: data.analysisId || '',
      createdAt: Date.now()
    });

    return job;
  } catch (error) {
    console.error('Failed to add GDPR job:', error);
    throw error;
  }
}

async function addSecurityJob(data) {
  try {
    const job = await securityQueue.add('security-job', data, {
      removeOnComplete: 100,
      removeOnFail: 50,
      timeout: 180000,  // 3 minuter timeout
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
    console.log(`🔒 Added Security job ${job.id} for ${data.url}`);

    // Set initial state in Redis
    await redis.hset(`job:${job.id}`, {
      state: 'waiting',
      type: 'security',
      url: data.url,
      analysisId: data.analysisId || '',
      createdAt: Date.now()
    });

    return job;
  } catch (error) {
    console.error('Failed to add Security job:', error);
    throw error;
  }
}

// Hämta köstatistik
async function getQueueStats() {
  try {
    const [
      lighthouseWaiting, lighthouseActive, lighthouseCompleted, lighthouseFailed,
      crawlWaiting, crawlActive, crawlCompleted, crawlFailed,
      seoWaiting, seoActive, seoCompleted, seoFailed,
      aiAnalysisWaiting, aiAnalysisActive, aiAnalysisCompleted, aiAnalysisFailed,
      gdprWaiting, gdprActive, gdprCompleted, gdprFailed,
      securityWaiting, securityActive, securityCompleted, securityFailed
    ] = await Promise.all([
      lighthouseQueue.getWaitingCount(),
      lighthouseQueue.getActiveCount(),
      lighthouseQueue.getCompletedCount(),
      lighthouseQueue.getFailedCount(),
      crawlQueue.getWaitingCount(),
      crawlQueue.getActiveCount(),
      crawlQueue.getCompletedCount(),
      crawlQueue.getFailedCount(),
      seoQueue.getWaitingCount(),
      seoQueue.getActiveCount(),
      seoQueue.getCompletedCount(),
      seoQueue.getFailedCount(),
      aiAnalysisQueue.getWaitingCount(),
      aiAnalysisQueue.getActiveCount(),
      aiAnalysisQueue.getCompletedCount(),
      aiAnalysisQueue.getFailedCount(),
      gdprQueue.getWaitingCount(),
      gdprQueue.getActiveCount(),
      gdprQueue.getCompletedCount(),
      gdprQueue.getFailedCount(),
      securityQueue.getWaitingCount(),
      securityQueue.getActiveCount(),
      securityQueue.getCompletedCount(),
      securityQueue.getFailedCount()
    ]);

    return {
      lighthouse: {
        waiting: lighthouseWaiting,
        active: lighthouseActive,
        completed: lighthouseCompleted,
        failed: lighthouseFailed
      },
      crawl: {
        waiting: crawlWaiting,
        active: crawlActive,
        completed: crawlCompleted,
        failed: crawlFailed
      },
      seo: {
        waiting: seoWaiting,
        active: seoActive,
        completed: seoCompleted,
        failed: seoFailed
      },
      aiAnalysis: {
        waiting: aiAnalysisWaiting,
        active: aiAnalysisActive,
        completed: aiAnalysisCompleted,
        failed: aiAnalysisFailed
      },
      gdpr: {
        waiting: gdprWaiting,
        active: gdprActive,
        completed: gdprCompleted,
        failed: gdprFailed
      },
      security: {
        waiting: securityWaiting,
        active: securityActive,
        completed: securityCompleted,
        failed: securityFailed
      }
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return null;
  }
}

// Graceful shutdown
async function closeQueues() {
  console.log('Closing queues...');
  await Promise.all([
    lighthouseQueue.close(),
    crawlQueue.close(),
    seoQueue.close(),
    aiAnalysisQueue.close(),
    gdprQueue.close(),
    securityQueue.close()
  ]);
  await redis.quit();
  console.log('Queues closed');
}

// Event handlers för debugging
lighthouseQueue.on('completed', (job, result) => {
  console.log(`Lighthouse job ${job.id} completed`);
});

lighthouseQueue.on('failed', (job, err) => {
  console.error(`Lighthouse job ${job.id} failed:`, err.message);
});

crawlQueue.on('completed', (job, result) => {
  console.log(`Crawl job ${job.id} completed`);
});

crawlQueue.on('failed', (job, err) => {
  console.error(`Crawl job ${job.id} failed:`, err.message);
});

aiAnalysisQueue.on('completed', (job, result) => {
  console.log(`🤖 AI Analysis job ${job.id} completed`);
});

aiAnalysisQueue.on('failed', (job, err) => {
  console.error(`🤖 AI Analysis job ${job.id} failed:`, err.message);
});

gdprQueue.on('completed', (job, result) => {
  console.log(`🍪 GDPR job ${job.id} completed`);
});

gdprQueue.on('failed', (job, err) => {
  console.error(`🍪 GDPR job ${job.id} failed:`, err.message);
});

securityQueue.on('completed', (job, result) => {
  console.log(`🔒 Security job ${job.id} completed`);
});

securityQueue.on('failed', (job, err) => {
  console.error(`🔒 Security job ${job.id} failed:`, err.message);
});

module.exports = {
  redis,
  lighthouseQueue,
  crawlQueue,
  seoQueue,
  aiAnalysisQueue,
  gdprQueue,
  securityQueue,
  addLighthouseJob,
  addCrawlJob,
  addSeoJob,
  addAiAnalysisJob,
  addGdprJob,
  addSecurityJob,
  getQueueStats,
  closeQueues
};