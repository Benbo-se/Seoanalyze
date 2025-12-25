// Circuit Breaker API - Monitor och hantera circuit breakers
import { NextResponse } from 'next/server';

const { CircuitBreakerManager } = require('../../../core/circuit-breaker');

export const runtime = 'nodejs';

// GET - Hämta circuit breaker status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const test = searchParams.get('test') === 'true';
    
    if (test && service) {
      // Testa circuit breaker med simulerade failures
      const breaker = CircuitBreakerManager.get(service, {
        failureThreshold: 3,
        recoveryTimeout: 5000 // 5 sekunder för snabbare test
      });
      
      const testResults = [];
      
      // Simulera API calls med failures
      for (let i = 0; i < 10; i++) {
        try {
          const result = await breaker.call(async () => {
            // Simulera failure på calls 3, 4, 5 för att trigga circuit breaker
            if ([2, 3, 4].includes(i)) {
              throw new Error(`Simulerat API fel - call ${i + 1}`);
            }
            
            // Simulera API response tid
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
            return { success: true, data: `API response ${i + 1}` };
          });
          
          testResults.push({
            call: i + 1,
            success: true,
            result: result.data,
            circuitState: breaker.getStats().state,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          testResults.push({
            call: i + 1,
            success: false,
            error: error.message,
            circuitState: breaker.getStats().state,
            timestamp: new Date().toISOString()
          });
        }
        
        // Kort paus mellan calls
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const stats = breaker.getStats();
      
      return NextResponse.json({
        success: true,
        service,
        testResults,
        finalStats: stats,
        summary: {
          totalCalls: testResults.length,
          successfulCalls: testResults.filter(r => r.success).length,
          failedCalls: testResults.filter(r => !r.success).length,
          finalCircuitState: stats.state
        }
      });
    }
    
    if (service) {
      // Hämta stats för specifik service
      const breaker = CircuitBreakerManager.get(service);
      const stats = breaker.getStats();
      
      return NextResponse.json({
        success: true,
        service,
        stats
      });
    }
    
    // Hämta alla circuit breaker stats
    const allStats = CircuitBreakerManager.getAllStats();
    
    return NextResponse.json({
      success: true,
      circuitBreakers: allStats,
      summary: {
        totalServices: Object.keys(allStats).length,
        openCircuits: Object.values(allStats).filter(s => s.state === 'OPEN').length,
        halfOpenCircuits: Object.values(allStats).filter(s => s.state === 'HALF_OPEN').length,
        closedCircuits: Object.values(allStats).filter(s => s.state === 'CLOSED').length
      }
    });
    
  } catch (error) {
    console.error('Circuit Breaker API error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att hämta circuit breaker status',
      message: error.message 
    }, { status: 500 });
  }
}

// POST - Konfigurera eller reset circuit breaker
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.service) {
      return NextResponse.json({ 
        error: 'Service name krävs' 
      }, { status: 400 });
    }
    
    const { service, action, config = {} } = body;
    
    if (action === 'reset') {
      CircuitBreakerManager.reset(service);
      
      console.log(`🔄 Circuit breaker reset för ${service}`);
      
      return NextResponse.json({ 
        success: true,
        message: `Circuit breaker reset för ${service}`,
        service,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'configure') {
      // Skapa/uppdatera circuit breaker konfiguration
      const breaker = CircuitBreakerManager.get(service, config);
      
      console.log(`⚙️ Circuit breaker konfigurerad för ${service}:`, config);
      
      return NextResponse.json({ 
        success: true,
        message: `Circuit breaker konfigurerad för ${service}`,
        service,
        config: breaker.config,
        stats: breaker.getStats(),
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'force-open') {
      const breaker = CircuitBreakerManager.get(service);
      breaker.forceOpen();
      
      console.log(`⚠️ Circuit breaker manuellt öppnad för ${service}`);
      
      return NextResponse.json({ 
        success: true,
        message: `Circuit breaker öppnad för ${service}`,
        service,
        stats: breaker.getStats(),
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ 
      error: 'Okänd action. Använd: reset, configure, eller force-open' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Circuit Breaker config error:', error);
    return NextResponse.json({ 
      error: 'Misslyckades att konfigurera circuit breaker',
      message: error.message 
    }, { status: 500 });
  }
}