// Enhanced Analytics Logger - Strukturerad loggning för bättre analytics
// Expert förslag: Samla metrics för business insights och debugging

const fs = require('fs').promises;
const path = require('path');

class AnalyticsLogger {
  constructor() {
    this.logDir = process.env.ANALYTICS_LOG_DIR || './logs';
    this.initialized = false;
    this.bufferSize = 100; // Buffer 100 entries before writing
    this.logBuffer = [];
    this.flushInterval = 30000; // Flush every 30 seconds
    
    // Olika typer av events
    this.eventTypes = {
      API_CALL: 'api_call',
      ANALYSIS_START: 'analysis_start',
      ANALYSIS_COMPLETE: 'analysis_complete',
      ERROR: 'error',
      PERFORMANCE: 'performance',
      USER_ACTION: 'user_action',
      SYSTEM_METRIC: 'system_metric',
      RATE_LIMIT: 'rate_limit',
      CIRCUIT_BREAKER: 'circuit_breaker'
    };
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      console.log(`[ANALYTICS] Logger initialized at ${this.logDir}`);
      
      // Starta flush interval
      setInterval(() => this.flushBuffer(), this.flushInterval);
      
      // Graceful shutdown - flush vid exit
      process.on('beforeExit', () => this.flushBuffer());
      process.on('SIGINT', () => this.flushBuffer());
      process.on('SIGTERM', () => this.flushBuffer());
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Analytics Logger:', error);
    }
  }

  // Logga API calls med detaljerad information
  async logApiCall(endpoint, method, statusCode, duration, metadata = {}) {
    await this.log(this.eventTypes.API_CALL, {
      endpoint,
      method,
      statusCode,
      duration,
      success: statusCode < 400,
      ...metadata
    });
  }

  // Logga analys start
  async logAnalysisStart(analysisId, url, type, metadata = {}) {
    await this.log(this.eventTypes.ANALYSIS_START, {
      analysisId,
      url,
      type,
      ...metadata
    });
  }

  // Logga analys completion
  async logAnalysisComplete(analysisId, url, type, duration, success, results = {}) {
    await this.log(this.eventTypes.ANALYSIS_COMPLETE, {
      analysisId,
      url,
      type,
      duration,
      success,
      resultsCount: results.count || 0,
      errorCount: results.errors || 0,
      ...results
    });
  }

  // Logga fel med stack trace
  async logError(error, context = {}) {
    await this.log(this.eventTypes.ERROR, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    });
  }

  // Logga performance metrics
  async logPerformance(metric, value, unit = 'ms', metadata = {}) {
    await this.log(this.eventTypes.PERFORMANCE, {
      metric,
      value,
      unit,
      ...metadata
    });
  }

  // Logga användaraktioner
  async logUserAction(action, userId = null, metadata = {}) {
    await this.log(this.eventTypes.USER_ACTION, {
      action,
      userId,
      ...metadata
    });
  }

  // Logga system metrics
  async logSystemMetric(name, value, metadata = {}) {
    await this.log(this.eventTypes.SYSTEM_METRIC, {
      name,
      value,
      ...metadata
    });
  }

  // Logga rate limiting events
  async logRateLimit(domain, allowed, tokens, retryAfter = null) {
    await this.log(this.eventTypes.RATE_LIMIT, {
      domain,
      allowed,
      tokens,
      retryAfter
    });
  }

  // Logga circuit breaker events
  async logCircuitBreaker(service, state, action, metadata = {}) {
    await this.log(this.eventTypes.CIRCUIT_BREAKER, {
      service,
      state,
      action,
      ...metadata
    });
  }

  // Generell log funktion
  async log(eventType, data) {
    if (!this.initialized) {
      await this.initialize();
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      data: {
        ...data,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        hostname: require('os').hostname()
      }
    };

    // Lägg till i buffer
    this.logBuffer.push(logEntry);

    // Flush om buffer är full
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    // Console output för development
    if (process.env.NODE_ENV !== 'production') {
      this.consoleLog(eventType, data);
    }
  }

  // Flush buffer till fil
  async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `analytics-${today}.jsonl`);
      
      const entries = this.logBuffer.splice(0); // Empty buffer
      const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      
      await fs.appendFile(logFile, logLines, 'utf8');
      
      if (entries.length > 0) {
        console.log(`[FLUSH] Flushed ${entries.length} analytics entries to ${logFile}`);
      }
    } catch (error) {
      console.error('Failed to flush analytics buffer:', error);
      // Återställ entries till buffer om write misslyckades
      this.logBuffer.unshift(...entries);
    }
  }

  // Console output för development
  consoleLog(eventType, data) {
    const emoji = {
      [this.eventTypes.API_CALL]: data.success ? '[OK]' : '[FAIL]',
      [this.eventTypes.ANALYSIS_START]: '[START]',
      [this.eventTypes.ANALYSIS_COMPLETE]: '[DONE]',
      [this.eventTypes.ERROR]: '[ERROR]',
      [this.eventTypes.PERFORMANCE]: '[PERF]',
      [this.eventTypes.USER_ACTION]: '[USER]',
      [this.eventTypes.SYSTEM_METRIC]: '[METRIC]',
      [this.eventTypes.RATE_LIMIT]: data.allowed ? '[ALLOW]' : '[BLOCK]',
      [this.eventTypes.CIRCUIT_BREAKER]: '[CIRCUIT]'
    };

    console.log(`${emoji[eventType] || '[LOG]'} [${eventType}]`, 
      JSON.stringify(data, null, 0));
  }

  // Hämta analytics data från filer
  async getAnalytics(date = null, eventType = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `analytics-${targetDate}.jsonl`);
      
      try {
        const content = await fs.readFile(logFile, 'utf8');
        const entries = content.trim().split('\n')
          .filter(line => line)
          .map(line => JSON.parse(line));
        
        // Filtrera på eventType om specificerat
        const filteredEntries = eventType 
          ? entries.filter(entry => entry.eventType === eventType)
          : entries;

        return {
          date: targetDate,
          totalEntries: filteredEntries.length,
          entries: filteredEntries,
          summary: this.generateSummary(filteredEntries)
        };
      } catch (fileError) {
        return {
          date: targetDate,
          totalEntries: 0,
          entries: [],
          error: `No analytics data found for ${targetDate}`
        };
      }
    } catch (error) {
      throw new Error(`Failed to read analytics: ${error.message}`);
    }
  }

  // Generera sammanfattning av analytics data
  generateSummary(entries) {
    const summary = {
      byEventType: {},
      timeRange: {
        start: null,
        end: null
      },
      performance: {
        apiCalls: {
          total: 0,
          successful: 0,
          failed: 0,
          avgDuration: 0
        }
      }
    };

    if (entries.length === 0) return summary;

    // Räkna events per typ
    entries.forEach(entry => {
      const type = entry.eventType;
      summary.byEventType[type] = (summary.byEventType[type] || 0) + 1;
    });

    // Tid range
    const timestamps = entries.map(e => new Date(e.timestamp));
    summary.timeRange.start = new Date(Math.min(...timestamps)).toISOString();
    summary.timeRange.end = new Date(Math.max(...timestamps)).toISOString();

    // API call performance
    const apiCalls = entries.filter(e => e.eventType === this.eventTypes.API_CALL);
    if (apiCalls.length > 0) {
      summary.performance.apiCalls.total = apiCalls.length;
      summary.performance.apiCalls.successful = apiCalls.filter(c => c.data.success).length;
      summary.performance.apiCalls.failed = apiCalls.filter(c => !c.data.success).length;
      
      const durations = apiCalls.map(c => c.data.duration).filter(d => d);
      if (durations.length > 0) {
        summary.performance.apiCalls.avgDuration = 
          Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
      }
    }

    return summary;
  }

  // Rensa gamla log filer
  async cleanup(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const analyticsFiles = files.filter(f => f.startsWith('analytics-') && f.endsWith('.jsonl'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const file of analyticsFiles) {
        const dateMatch = file.match(/analytics-(\d{4}-\d{2}-\d{2})\.jsonl/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          if (fileDate < cutoffDate) {
            await fs.unlink(path.join(this.logDir, file));
            console.log(`[CLEANUP] Cleaned up old analytics file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Analytics cleanup failed:', error);
    }
  }
}

module.exports = new AnalyticsLogger();