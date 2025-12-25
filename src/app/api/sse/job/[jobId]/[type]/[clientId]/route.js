// API Route: /api/sse/job/[jobId]/[type]/[clientId]
// Server-Sent Events for real-time job progress

const Redis = require('ioredis');

// Singleton Redis instance to prevent connection leaks
let redisInstance = null;
function getRedis() {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd',
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: null,
      retryDelayOnClusterDown: 300,
      enableOfflineQueue: false,
    });

    // Handle Redis errors to prevent crashes
    redisInstance.on('error', (err) => {
      console.error('Redis SSE error:', err.message);
    });
  }
  return redisInstance;
}

async function resolveQueueType(jobId, type) {
  if (type && type !== 'unknown') return type;
  
  try {
    // Build base URL - handle both localhost and production
    const host = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:5001';
    
    const response = await fetch(`${host}/api/job-meta/${jobId}`, { cache: 'no-store' });
    if (!response.ok) return 'unknown';
    
    const meta = await response.json();
    if (!meta?.found) return 'unknown';
    
    // Return the actual queue name, not the normalized type
    // job-meta returns the UI type, but we need the queue name
    const queueName = meta.type === 'analysis' ? 'seo' : meta.type;
    console.log(`📡 Resolved queue: ${meta.type} -> ${queueName} for job ${jobId}`);
    return queueName;
  } catch (error) {
    console.error('Failed to resolve queue type:', error);
    return 'unknown';
  }
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

export async function GET(request, { params }) {
  const { jobId, clientId } = await params;
  let { type } = await params;
  
  // Resolve unknown type by checking job-meta
  const queueName = await resolveQueueType(jobId, type);
  
  console.log(`📡 SSE for job ${jobId} using queue: ${queueName}, client: ${clientId}`);
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let pollId, heartbeatId;
      
      try {
        // sendData med named events
        const send = (data, evt) =>
          controller.enqueue(encoder.encode(evt ? `event: ${evt}\ndata: ${JSON.stringify(data)}\n\n`
                                               : `data: ${JSON.stringify(data)}\n\n`));

        send({ type:'connected', jobId, clientId }, 'connected');

        heartbeatId = setInterval(() => send({}, 'keepalive'), 15000);

        let last = -1;
        const check = async () => {
          try {
            const redis = getRedis();
            const h = await redis.hgetall(`bull:${queueName}:${jobId}`);
            if (!h || !Object.keys(h).length) { 
              send({ status:'waiting', jobId, progress:0 }, 'progress'); 
              return false; 
            }
            
            const progress = parseInt(h.progress) || 0;
            const done = !!h.finishedOn;

            if (done) {
              let result = null, analysisId = null;
              try { 
                result = h.returnvalue ? JSON.parse(h.returnvalue) : null;
                // Fix operator precedence bug
                const dataFromJob = h.data ? JSON.parse(h.data) : null;
                analysisId = result?.analysisId ?? dataFromJob?.analysisId ?? null;
              } catch {}
              
              const payload = { 
                type: 'completed', 
                jobId, 
                status: 'completed', 
                progress: 100, 
                result, 
                analysisId 
              };
              send(payload, 'completed');
              send(payload, 'done');

              // Use unified cleanup function
              setTimeout(cleanup, 1000); 
              return true;
            }

            if (progress !== last) { 
              send({ type:'progress', jobId, status: h.processedOn ? 'active':'waiting', progress }, 'progress'); 
              last = progress; 
            }
            return false;
          } catch (error) {
            console.error('SSE polling error:', error);
            send({ type: 'error', message: error.message });
            return false;
          }
        };

        // omedelbar check + 1s polling
        if (!(await check())) pollId = setInterval(check, 1000);

      } catch (error) {
        console.error('SSE setup error:', error);
        const errorMessage = `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`;
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
      
      // Clean up on client disconnect or any stream closure
      let timeoutId;
      const cleanup = () => {
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }
        if (heartbeatId) {
          clearInterval(heartbeatId);
          heartbeatId = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          controller.close();
        } catch (e) {
          // Stream already closed
        }
        console.log(`🔌 SSE cleanup for job ${jobId}, client ${clientId}`);
      };

      request.signal?.addEventListener('abort', cleanup);

      // Also cleanup after 5 minutes to prevent hanging connections
      timeoutId = setTimeout(cleanup, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Nginx
    }
  });
}