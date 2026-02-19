import { NextResponse } from 'next/server';
import { CacheStats } from '../../../../utils/redisCache';

export async function GET(request) {
  try {
    const stats = await CacheStats.getStats();
    
    const response = {
      status: stats.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      cache: {
        redis: {
          connected: stats.connected,
          memory: stats.memory ? 'Available' : 'N/A',
          keyspace: stats.keyspace ? 'Available' : 'N/A',
        },
        nextjs: {
          isr: 'Enabled',
          revalidation: 'On-demand supported'
        }
      },
      config: {
        redis_configured: !!process.env.REDIS_URL,
        environment: process.env.NODE_ENV,
      }
    };
    
    return NextResponse.json(response, {
      status: stats.connected ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}