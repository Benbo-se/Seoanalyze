// Next.js App Router API route for health check endpoint
// Migrated from Live-Server/server-hybrid-sse.js

// Import queue system
const { getQueueStats } = require('../../../../lib/queue-manager');

export async function GET() {
  try {
    const queueStats = await getQueueStats();
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      queues: queueStats
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}