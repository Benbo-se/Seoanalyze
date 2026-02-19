// Circuit Breaker - Skyddar externa API:er från överbelastning
// Expert förslag: 30% fail rate → 2min paus, självhelande system

class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    
    // Default konfiguration baserad på expert-förslaget
    this.config = {
      failureThreshold: options.failureThreshold || 5,        // 5 failures innan öppning
      failureRate: options.failureRate || 0.30,              // 30% fail rate triggers
      recoveryTimeout: options.recoveryTimeout || 120000,    // 2 minuter recovery
      monitoringWindow: options.monitoringWindow || 60000,   // 1 minut window
      halfOpenMaxCalls: options.halfOpenMaxCalls || 3,       // 3 test calls i half-open
      ...options
    };
    
    // Circuit states
    this.state = 'CLOSED';        // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
    this.halfOpenCalls = 0;
    
    // Sliding window för failure rate beräkning
    this.callHistory = [];
    this.windowStart = Date.now();
    
    console.log(`🛡️ Circuit Breaker initialized for ${serviceName}`);
  }

  async call(asyncFunction, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker OPEN for ${this.serviceName}. Next attempt at ${new Date(this.nextAttempt).toLocaleTimeString()}`);
      }
      
      // Övergå till HALF_OPEN efter recovery timeout
      this.state = 'HALF_OPEN';
      this.halfOpenCalls = 0;
      console.log(`🔄 Circuit breaker ${this.serviceName}: OPEN → HALF_OPEN`);
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      throw new Error(`Circuit breaker HALF_OPEN limit exceeded for ${this.serviceName}`);
    }

    const startTime = Date.now();
    
    try {
      const result = await asyncFunction(...args);
      this.onSuccess(startTime);
      return result;
      
    } catch (error) {
      this.onFailure(startTime, error);
      throw error;
    }
  }

  onSuccess(startTime) {
    const duration = Date.now() - startTime;
    this.addToHistory(true, duration);
    
    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
      this.successes++;
      
      // Om vi har tillräckligt med framgångsrika calls, stäng circuit
      if (this.successes >= this.config.halfOpenMaxCalls) {
        this.state = 'CLOSED';
        this.failures = 0;
        this.successes = 0;
        this.halfOpenCalls = 0;
        console.log(`✅ Circuit breaker ${this.serviceName}: HALF_OPEN → CLOSED (recovered)`);
      }
    }
    
    // Reset failure count vid framgång i CLOSED state
    if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  onFailure(startTime, error) {
    const duration = Date.now() - startTime;
    this.addToHistory(false, duration, error.message);
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Vid failure i HALF_OPEN, gå direkt tillbaka till OPEN
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.config.recoveryTimeout;
      this.successes = 0;
      this.halfOpenCalls = 0;
      console.log(`❌ Circuit breaker ${this.serviceName}: HALF_OPEN → OPEN (failed recovery)`);
      return;
    }

    // Kontrollera om vi ska öppna circuit
    if (this.shouldTrip()) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.config.recoveryTimeout;
      console.log(`🔴 Circuit breaker ${this.serviceName}: CLOSED → OPEN (${this.getFailureRate()}% failure rate)`);
    }
  }

  shouldTrip() {
    if (this.state !== 'CLOSED') return false;
    
    // Trip om vi har för många failures
    if (this.failures >= this.config.failureThreshold) {
      return true;
    }
    
    // Trip om failure rate är för hög
    const failureRate = this.getFailureRate();
    if (failureRate >= this.config.failureRate * 100 && this.getTotalCalls() >= 10) {
      return true;
    }
    
    return false;
  }

  addToHistory(success, duration, error = null) {
    const now = Date.now();
    
    // Rensa gamla entries utanför monitoring window
    this.callHistory = this.callHistory.filter(
      entry => now - entry.timestamp < this.config.monitoringWindow
    );
    
    // Lägg till ny entry
    this.callHistory.push({
      timestamp: now,
      success,
      duration,
      error
    });
  }

  getStats() {
    const now = Date.now();
    const recentCalls = this.callHistory.filter(
      entry => now - entry.timestamp < this.config.monitoringWindow
    );
    
    const totalCalls = recentCalls.length;
    const successfulCalls = recentCalls.filter(c => c.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const failureRate = totalCalls > 0 ? (failedCalls / totalCalls * 100) : 0;
    
    const avgDuration = totalCalls > 0 
      ? Math.round(recentCalls.reduce((sum, c) => sum + c.duration, 0) / totalCalls)
      : 0;
    
    return {
      serviceName: this.serviceName,
      state: this.state,
      totalCalls,
      successfulCalls,
      failedCalls,
      failureRate: Math.round(failureRate * 100) / 100,
      avgResponseTime: avgDuration,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      nextAttempt: this.nextAttempt ? new Date(this.nextAttempt).toISOString() : null,
      config: this.config
    };
  }

  getFailureRate() {
    const totalCalls = this.getTotalCalls();
    if (totalCalls === 0) return 0;
    
    const failedCalls = this.callHistory.filter(c => !c.success).length;
    return Math.round((failedCalls / totalCalls) * 100 * 100) / 100;
  }

  getTotalCalls() {
    const now = Date.now();
    return this.callHistory.filter(
      entry => now - entry.timestamp < this.config.monitoringWindow
    ).length;
  }

  // Manuell reset
  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.callHistory = [];
    this.lastFailureTime = null;
    this.nextAttempt = null;
    
    console.log(`🔄 Circuit breaker ${this.serviceName} manually reset`);
  }

  // Test funktioner
  forceOpen() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.config.recoveryTimeout;
    console.log(`⚠️ Circuit breaker ${this.serviceName} manually opened`);
  }
}

// Singleton manager för alla circuit breakers
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  get(serviceName, options = {}) {
    if (!this.breakers.has(serviceName)) {
      this.breakers.set(serviceName, new CircuitBreaker(serviceName, options));
    }
    return this.breakers.get(serviceName);
  }

  getAllStats() {
    const stats = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  reset(serviceName = null) {
    if (serviceName) {
      const breaker = this.breakers.get(serviceName);
      if (breaker) breaker.reset();
    } else {
      // Reset alla breakers
      for (const breaker of this.breakers.values()) {
        breaker.reset();
      }
    }
  }
}

module.exports = {
  CircuitBreaker,
  CircuitBreakerManager: new CircuitBreakerManager()
};