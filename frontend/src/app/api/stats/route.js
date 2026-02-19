import { NextResponse } from 'next/server';
import { prisma } from '@/core/prisma';
import redisCache from '@/utils/redisCache';

// Cache stats for 5 minutes
const CACHE_NAMESPACE = 'site';
const CACHE_KEY = 'stats';
const CACHE_TTL = 300; // 5 minutes

export async function GET() {
  try {
    // Try to get from cache first
    const cached = await redisCache.getCached(CACHE_NAMESPACE, CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch fresh stats from database
    const [totalAnalyses, uniqueDomains, aiAnalyses] = await Promise.all([
      prisma.analysis.count(),
      prisma.analysis.groupBy({
        by: ['targetUrl'],
        _count: true
      }).then(groups => groups.length),
      prisma.aiAnalysis.count({
        where: { status: 'completed' }
      })
    ]);

    const stats = {
      totalAnalyses,
      uniqueDomains,
      aiAnalyses,
      updatedAt: new Date().toISOString()
    };

    // Cache the result
    await redisCache.setCached(CACHE_NAMESPACE, CACHE_KEY, stats, CACHE_TTL);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);

    // Return fallback stats on error
    return NextResponse.json({
      totalAnalyses: 2000,
      uniqueDomains: 150,
      aiAnalyses: 100,
      updatedAt: new Date().toISOString(),
      fallback: true
    });
  }
}
