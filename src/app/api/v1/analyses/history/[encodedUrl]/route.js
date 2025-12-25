import { NextRequest, NextResponse } from 'next/server';
import { captureException, addBreadcrumb } from '../../../../../../utils/errorTracking';
import { CacheConfig, generateCacheTags } from '../../../../../../utils/revalidation';
import { cacheWrap } from '../../../../../../utils/redisCache';
// import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { encodedUrl } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Add breadcrumb for debugging
    addBreadcrumb('Analysis history API called', 'api', 'info', {
      encodedUrl,
      limit,
      userAgent: request.headers.get('user-agent'),
    });
    
    // Decode the URL
    const url = decodeURIComponent(encodedUrl);
    
    // Use Redis cache wrapper for history data
    const historyData = await cacheWrap(
      'analysis-history',
      `${encodedUrl}-${limit}`,
      async () => {
        try {
          // TODO: Fix prisma import
          // Fetch real data from database
          // const analyses = await prisma.analysis.findMany({
          //   where: {
          //     targetUrl: url,
          //     status: 'completed'
          //   },
          const analyses = [];
          /*
            orderBy: {
              createdAt: 'desc'
            },
            take: limit,
            select: {
              id: true,
              targetUrl: true,
              type: true,
              status: true,
              summary: true,
              createdAt: true,
              updatedAt: true
            }
          }); */

          // Format the data for the frontend
          return analyses.map(analysis => ({
            id: analysis.id,
            url: analysis.targetUrl,
            seoScore: analysis.summary?.score || 0,
            score: analysis.summary?.score || 0,
            status: analysis.status,
            createdAt: analysis.createdAt.toISOString(),
            type: analysis.type,
            issues: analysis.summary?.issues || 0,
            warnings: analysis.summary?.warnings || 0
          }));
        } catch (dbError) {
          console.warn('Database query failed, returning mock data:', dbError.message);
          // Fallback to mock data if database fails
          const mockHistory = [
            {
              id: '1',
              url: url,
              seoScore: 85,
              score: 85,
              status: 'completed',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              type: 'seo'
            },
            {
              id: '2', 
              url: url,
              seoScore: 78,
              score: 78,
              status: 'completed',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              type: 'seo'
            }
          ];
          return mockHistory.slice(0, limit);
        }
      },
      CacheConfig.HISTORY // Cache for 30 minutes
    );
    
    addBreadcrumb('Analysis history retrieved successfully', 'api', 'info', {
      resultCount: historyData.length,
    });
    
    // Create response with cache headers
    const response = NextResponse.json(historyData);
    
    // Add cache tags for ISR
    const cacheTags = generateCacheTags('history', encodedUrl);
    response.headers.set('Cache-Control', `s-maxage=${CacheConfig.HISTORY}, stale-while-revalidate`);
    response.headers.set('Cache-Tags', cacheTags.join(','));
    
    return response;

  } catch (error) {
    // Capture error with Sentry
    captureException(error, {
      api: 'analyses/history',
      params: { encodedUrl: await params.encodedUrl },
      url: request.url,
    });
    
    console.error('Analysis history error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve analysis history',
        message: error.message
      },
      { status: 500 }
    );
  }
}