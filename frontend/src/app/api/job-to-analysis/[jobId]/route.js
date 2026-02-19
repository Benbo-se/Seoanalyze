import { NextResponse } from 'next/server';
const Redis = require('ioredis');

function normalizeType(type) {
  const map = {
    analyze: 'analysis',
    seo: 'analysis',
    crawl: 'crawl',
    lighthouse: 'lighthouse'
  };
  return map[type] || type;
}

export async function GET(request, { params }) {
  const { jobId } = await params;
  
  let redis;
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      lazyConnect: false
    });
    // Try all possible queue types to find the job
    const queueTypes = ['analysis', 'crawl', 'lighthouse'];
    let jobData = null;
    let foundType = null;
    
    for (const queueType of queueTypes) {
      const redisKey = `bull:${queueType}:${jobId}`;
      const job = await redis.hgetall(redisKey);
      
      if (job && Object.keys(job).length > 0) {
        jobData = job;
        foundType = queueType;
        break;
      }
    }
    
    if (!jobData) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Check if job is completed
    if (!jobData.finishedOn) {
      return NextResponse.json({ 
        error: 'Job not completed',
        status: 'pending'
      }, { status: 202 });
    }
    
    // Extract analysisId from job data
    let analysisId = null;
    try {
      // First try to get from returnvalue (job result)
      if (jobData.returnvalue) {
        const result = JSON.parse(jobData.returnvalue);
        analysisId = result.analysisId;
      }
      
      // If not found, try to get from job data
      if (!analysisId && jobData.data) {
        const data = JSON.parse(jobData.data);
        analysisId = data.analysisId;
      }
    } catch (parseError) {
      console.error('Error parsing job data:', parseError);
    }
    
    if (!analysisId) {
      console.log('No analysisId found for job', jobId, 'in queue', foundType);
      return NextResponse.json({ 
        error: 'Analysis ID not found in job data',
        debug: {
          jobId,
          foundType,
          hasReturnvalue: !!jobData.returnvalue,
          hasData: !!jobData.data
        }
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      analysisId: analysisId,
      status: 'completed',
      type: foundType === 'analysis' ? 'seo' : foundType
    });
    
  } catch (error) {
    console.error('Error finding job:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  } finally {
    if (redis) {
      redis.disconnect();
    }
  }
}