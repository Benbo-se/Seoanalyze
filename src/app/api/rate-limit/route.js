// Rate Limit API - Monitor och konfigurera rate limiting
import { NextResponse } from 'next/server';

const rateLimiter = require('../../../core/rate-limiter');

export const runtime = 'nodejs';

// GET - Hämta rate limiting status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const test = searchParams.get('test') === 'true';
    
    if (test && domain) {
      // Testa rate limiting för en domain
      const testResults = [];
      
      for (let i = 0; i < 6; i++) {
        const result = await rateLimiter.checkRateLimit(domain);
        testResults.push({
          request: i + 1,
          allowed: result.allowed,
          tokens: result.tokens,
          retryAfter: result.retryAfter,
          timestamp: new Date().toISOString()
        });
        
        // Kort paus mellan requests
        if (i < 5) await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return NextResponse.json({
        success: true,
        domain,
        testResults,
        summary: {
          allowed: testResults.filter(r => r.allowed).length,
          blocked: testResults.filter(r => !r.allowed).length,
          totalRequests: testResults.length
        }
      });
    }
    
    // Hämta stats
    const stats = await rateLimiter.getStats(domain);
    
    return NextResponse.json({
      success: true,
      stats,
      config: {
        defaultRate: 1, // requests per second
        defaultBurst: 4, // burst capacity
        windowSeconds: 60
      }
    });
    
  } catch (error) {
    console.error('Rate Limit API error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att hämta rate limit status',
      message: error.message 
    }, { status: 500 });
  }
}

// POST - Konfigurera rate limiting för en domain
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.domain) {
      return NextResponse.json({ 
        error: 'Domain krävs för konfiguration' 
      }, { status: 400 });
    }
    
    const { domain, rate = 1, burst = 4, window = 60 } = body;
    
    // Validera input
    if (rate < 0.1 || rate > 100) {
      return NextResponse.json({ 
        error: 'Rate måste vara mellan 0.1 och 100 requests per sekund' 
      }, { status: 400 });
    }
    
    if (burst < 1 || burst > 100) {
      return NextResponse.json({ 
        error: 'Burst måste vara mellan 1 och 100' 
      }, { status: 400 });
    }
    
    // Testa den nya konfigurationen
    const testResult = await rateLimiter.checkRateLimit(domain, {
      rate,
      burst,
      window
    });
    
    console.log(`⚡ Rate limiting konfigurerad för ${domain}: ${rate} rps, burst ${burst}`);
    
    return NextResponse.json({ 
      success: true,
      message: `Rate limiting konfigurerad för ${domain}`,
      config: { domain, rate, burst, window },
      testResult,
      appliedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Rate Limit config error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att konfigurera rate limiting',
      message: error.message 
    }, { status: 500 });
  }
}