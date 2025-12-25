// Enhanced Analytics API - Strukturerad analytics med business insights
import { NextResponse } from 'next/server';

const analyticsLogger = require('../../../core/analytics-logger');

export const runtime = 'nodejs';

// GET - Hämta analytics data och insights
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Format: YYYY-MM-DD
    const eventType = searchParams.get('eventType');
    const demo = searchParams.get('demo') === 'true';
    
    if (demo) {
      // Generera demo analytics data
      await generateDemoData();
      
      return NextResponse.json({
        success: true,
        message: 'Demo analytics data generated',
        endpoints: {
          current: '/api/analytics-v2',
          withDate: '/api/analytics-v2?date=2025-09-04',
          byType: '/api/analytics-v2?eventType=api_call'
        }
      });
    }
    
    // Hämta analytics data
    const analytics = await analyticsLogger.getAnalytics(date, eventType);
    
    // Beräkna business insights
    const insights = calculateBusinessInsights(analytics.entries);
    
    return NextResponse.json({
      success: true,
      analytics,
      insights,
      meta: {
        requestedDate: date || 'today',
        eventType: eventType || 'all',
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att hämta analytics data',
      message: error.message 
    }, { status: 500 });
  }
}

// POST - Logga custom analytics events
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.eventType || !body?.data) {
      return NextResponse.json({ 
        error: 'eventType och data krävs' 
      }, { status: 400 });
    }
    
    const { eventType, data, userId = null } = body;
    
    // Validera eventType
    const validTypes = [
      'api_call', 'analysis_start', 'analysis_complete',
      'error', 'performance', 'user_action', 'system_metric'
    ];
    
    if (!validTypes.includes(eventType)) {
      return NextResponse.json({ 
        error: `Ogiltigt eventType. Giltiga typer: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }
    
    // Logga event baserat på typ
    switch (eventType) {
      case 'api_call':
        await analyticsLogger.logApiCall(
          data.endpoint, 
          data.method, 
          data.statusCode, 
          data.duration,
          { userId, ...data.metadata }
        );
        break;
        
      case 'user_action':
        await analyticsLogger.logUserAction(data.action, userId, data);
        break;
        
      case 'performance':
        await analyticsLogger.logPerformance(
          data.metric, 
          data.value, 
          data.unit || 'ms',
          { userId, ...data.metadata }
        );
        break;
        
      default:
        await analyticsLogger.log(eventType, { userId, ...data });
    }
    
    console.log(`📊 Analytics event logged: ${eventType}`);
    
    return NextResponse.json({ 
      success: true,
      message: `Analytics event '${eventType}' loggad`,
      eventType,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics logging error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att logga analytics event',
      message: error.message 
    }, { status: 500 });
  }
}

// Generera demo data för testing
async function generateDemoData() {
  const now = new Date();
  
  // Simulera API calls
  const endpoints = ['/api/analyze', '/api/lighthouse', '/api/crawl', '/api/rum'];
  const methods = ['GET', 'POST'];
  const statusCodes = [200, 200, 200, 201, 400, 404, 500]; // Mest success
  
  for (let i = 0; i < 20; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const duration = Math.floor(Math.random() * 2000) + 50; // 50-2050ms
    
    await analyticsLogger.logApiCall(endpoint, method, statusCode, duration, {
      userAgent: 'Mozilla/5.0 (Test Browser)',
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`
    });
  }
  
  // Simulera analysis events
  for (let i = 0; i < 5; i++) {
    const analysisId = `demo_${Date.now()}_${i}`;
    const url = `https://example${i}.com`;
    const type = ['lighthouse', 'crawl'][Math.floor(Math.random() * 2)];
    
    await analyticsLogger.logAnalysisStart(analysisId, url, type, {
      source: 'demo'
    });
    
    // Simulera completion efter random tid
    setTimeout(async () => {
      const duration = Math.floor(Math.random() * 30000) + 5000; // 5-35 sekunder
      const success = Math.random() > 0.1; // 90% success rate
      
      await analyticsLogger.logAnalysisComplete(
        analysisId, url, type, duration, success,
        { count: success ? Math.floor(Math.random() * 50) + 10 : 0 }
      );
    }, Math.random() * 1000);
  }
  
  // Simulera performance metrics
  const metrics = ['memory_usage', 'cpu_usage', 'response_time', 'queue_length'];
  for (const metric of metrics) {
    await analyticsLogger.logSystemMetric(metric, Math.floor(Math.random() * 100));
  }
  
  // Simulera user actions
  const actions = ['page_view', 'button_click', 'form_submit', 'download_report'];
  for (let i = 0; i < 10; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    await analyticsLogger.logUserAction(action, `user_${i}`, {
      page: '/',
      source: 'demo'
    });
  }
}

// Beräkna business insights från analytics data
function calculateBusinessInsights(entries) {
  if (!entries || entries.length === 0) {
    return {
      summary: 'Ingen data tillgänglig för analys',
      recommendations: []
    };
  }
  
  const insights = {
    traffic: {
      totalRequests: 0,
      uniqueEndpoints: new Set(),
      peakHours: {},
      errorRate: 0
    },
    performance: {
      avgResponseTime: 0,
      slowestEndpoints: [],
      performanceIssues: []
    },
    users: {
      totalActions: 0,
      topActions: {},
      conversionRate: 0
    },
    recommendations: []
  };
  
  const apiCalls = entries.filter(e => e.eventType === 'api_call');
  const userActions = entries.filter(e => e.eventType === 'user_action');
  const performances = entries.filter(e => e.eventType === 'performance');
  
  // Traffic insights
  if (apiCalls.length > 0) {
    insights.traffic.totalRequests = apiCalls.length;
    insights.traffic.uniqueEndpoints = new Set(apiCalls.map(c => c.data.endpoint));
    
    const failures = apiCalls.filter(c => !c.data.success).length;
    insights.traffic.errorRate = Math.round((failures / apiCalls.length) * 100);
    
    // Peak hours analys
    apiCalls.forEach(call => {
      const hour = new Date(call.timestamp).getHours();
      insights.traffic.peakHours[hour] = (insights.traffic.peakHours[hour] || 0) + 1;
    });
  }
  
  // Performance insights
  if (apiCalls.length > 0) {
    const durations = apiCalls.map(c => c.data.duration).filter(d => d);
    if (durations.length > 0) {
      insights.performance.avgResponseTime = Math.round(
        durations.reduce((sum, d) => sum + d, 0) / durations.length
      );
      
      // Hitta långsamma endpoints
      const endpointTimes = {};
      apiCalls.forEach(call => {
        if (call.data.duration) {
          const ep = call.data.endpoint;
          if (!endpointTimes[ep]) endpointTimes[ep] = [];
          endpointTimes[ep].push(call.data.duration);
        }
      });
      
      insights.performance.slowestEndpoints = Object.entries(endpointTimes)
        .map(([endpoint, times]) => ({
          endpoint,
          avgTime: Math.round(times.reduce((a, b) => a + b) / times.length),
          calls: times.length
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 3);
    }
  }
  
  // User insights
  insights.users.totalActions = userActions.length;
  if (userActions.length > 0) {
    userActions.forEach(action => {
      const actionType = action.data.action;
      insights.users.topActions[actionType] = (insights.users.topActions[actionType] || 0) + 1;
    });
  }
  
  // Generera rekommendationer
  if (insights.traffic.errorRate > 10) {
    insights.recommendations.push({
      type: 'error_rate',
      priority: 'high',
      message: `Hög error rate (${insights.traffic.errorRate}%). Undersök failing endpoints.`
    });
  }
  
  if (insights.performance.avgResponseTime > 1000) {
    insights.recommendations.push({
      type: 'performance',
      priority: 'medium', 
      message: `Hög genomsnittlig response tid (${insights.performance.avgResponseTime}ms). Överväg caching eller optimering.`
    });
  }
  
  if (insights.traffic.totalRequests > 1000) {
    insights.recommendations.push({
      type: 'scaling',
      priority: 'low',
      message: 'Högt request-volym. Överväg horisontell skalning och load balancing.'
    });
  }
  
  return insights;
}

// Cleanup gamla analytics filer
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '30');
    
    await analyticsLogger.cleanup(daysToKeep);
    
    return NextResponse.json({ 
      success: true,
      message: `Analytics cleanup slutförd. Behåller ${daysToKeep} dagars data.`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics cleanup error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att rensa analytics data',
      message: error.message 
    }, { status: 500 });
  }
}