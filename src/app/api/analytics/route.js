// Next.js App Router API route for analytics endpoint
// Migrated from Live-Server/server-hybrid-sse.js

// Import analytics tracker
const { getAnalytics } = require('../../../../lib/analytics-tracker');

export async function GET(request) {
  try {
    // Simple auth with query parameter
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (token !== process.env.ANALYTICS_TOKEN) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const stats = getAnalytics();
    if (!stats) {
      return Response.json({ error: 'Failed to get analytics' }, { status: 500 });
    }
    
    return Response.json({
      ...stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}