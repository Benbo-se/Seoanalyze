const axios = require('axios');

/**
 * Smart crawler with retry logic and error classification
 * Reduces "Status: undefined" by implementing intelligent retry strategies
 */
class SmartCrawler {
  
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialTimeout = options.initialTimeout || 10000; // 10s
    this.maxTimeout = options.maxTimeout || 30000; // 30s
    this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0; +https://seoanalyze.se)';
    
    // Error classification statistics
    this.errorStats = {
      total: 0,
      byType: {},
      retrySuccess: 0,
      finalFailures: 0
    };
  }

  /**
   * Fetch URL with smart retry logic and error classification
   * @param {string} url - URL to fetch
   * @param {Object} options - Additional fetch options
   * @returns {Object} Response with status, data, and error classification
   */
  async fetchWithRetry(url, options = {}) {
    const fetchOptions = {
      timeout: this.initialTimeout,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options.headers
      },
      maxRedirects: 5,
      validateStatus: () => true, // Accept all status codes
      ...options
    };

    let lastError = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Increase timeout on retries
        const currentTimeout = Math.min(
          this.initialTimeout * Math.pow(1.5, attempt), 
          this.maxTimeout
        );
        
        const response = await axios.get(url, {
          ...fetchOptions,
          timeout: currentTimeout
        });

        // Track successful retry
        if (attempt > 0) {
          this.errorStats.retrySuccess++;
        }

        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.status >= 200 && response.status < 300,
          headers: response.headers,
          data: response.data,
          url: response.config.url,
          redirected: response.request._redirectCount > 0,
          errorType: null,
          errorMessage: null,
          attempt: attempt,
          success: true
        };

      } catch (error) {
        lastError = error;
        this.errorStats.total++;
        
        const errorType = this.classifyError(error);
        this.errorStats.byType[errorType] = (this.errorStats.byType[errorType] || 0) + 1;
        
        // Don't retry certain error types
        if (this.shouldNotRetry(errorType)) {
          break;
        }
        
        // Don't retry on final attempt
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Wait before retry with exponential backoff
        await this.backoff(attempt);
      }
    }

    // All retries failed
    this.errorStats.finalFailures++;
    const errorType = this.classifyError(lastError);
    
    return {
      status: null,
      statusText: null,
      ok: false,
      headers: {},
      data: null,
      url: url,
      redirected: false,
      errorType: errorType,
      errorMessage: this.getErrorMessage(lastError, errorType),
      attempt: this.maxRetries,
      success: false
    };
  }

  /**
   * Classify error for better handling and statistics
   */
  classifyError(error) {
    if (!error) return 'UNKNOWN_ERROR';
    
    // Axios error handling
    if (error.code) {
      switch (error.code) {
        case 'ENOTFOUND':
          return 'DNS_ERROR';
        case 'ETIMEDOUT':
        case 'ECONNABORTED':
          return 'TIMEOUT';
        case 'ECONNREFUSED':
          return 'CONNECTION_REFUSED';
        case 'ECONNRESET':
          return 'CONNECTION_RESET';
        case 'EHOSTUNREACH':
          return 'HOST_UNREACHABLE';
        case 'EPROTO':
          return 'PROTOCOL_ERROR';
        case 'CERT_HAS_EXPIRED':
        case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
          return 'SSL_ERROR';
        default:
          return `NETWORK_ERROR_${error.code}`;
      }
    }

    // HTTP response errors
    if (error.response) {
      const status = error.response.status;
      if (status >= 400 && status < 500) {
        return `HTTP_CLIENT_ERROR_${status}`;
      } else if (status >= 500) {
        return `HTTP_SERVER_ERROR_${status}`;
      }
    }

    // Request timeout
    if (error.message?.includes('timeout')) {
      return 'TIMEOUT';
    }

    // Network errors
    if (error.message?.includes('network')) {
      return 'NETWORK_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine if error type should not be retried
   */
  shouldNotRetry(errorType) {
    const noRetryErrors = [
      'DNS_ERROR',
      'HTTP_CLIENT_ERROR_400',
      'HTTP_CLIENT_ERROR_401', 
      'HTTP_CLIENT_ERROR_403',
      'HTTP_CLIENT_ERROR_404',
      'HTTP_CLIENT_ERROR_410',
      'SSL_ERROR',
      'PROTOCOL_ERROR'
    ];
    
    return noRetryErrors.includes(errorType);
  }

  /**
   * Get human-readable error message
   */
  getErrorMessage(error, errorType) {
    const messages = {
      'DNS_ERROR': 'Domain not found - check URL spelling',
      'TIMEOUT': 'Request timed out - server may be slow or overloaded',
      'CONNECTION_REFUSED': 'Connection refused - server may be down',
      'CONNECTION_RESET': 'Connection reset - temporary network issue',
      'HOST_UNREACHABLE': 'Host unreachable - network connectivity issue',
      'SSL_ERROR': 'SSL/TLS certificate error - insecure connection',
      'PROTOCOL_ERROR': 'Protocol error - server configuration issue',
      'HTTP_CLIENT_ERROR_400': 'Bad request - invalid URL format',
      'HTTP_CLIENT_ERROR_401': 'Unauthorized - authentication required',
      'HTTP_CLIENT_ERROR_403': 'Forbidden - access denied',
      'HTTP_CLIENT_ERROR_404': 'Page not found',
      'HTTP_CLIENT_ERROR_410': 'Page permanently removed',
      'HTTP_SERVER_ERROR_500': 'Server error - temporary issue',
      'HTTP_SERVER_ERROR_502': 'Bad gateway - server configuration issue',
      'HTTP_SERVER_ERROR_503': 'Service unavailable - server overloaded',
      'HTTP_SERVER_ERROR_504': 'Gateway timeout - server too slow',
      'NETWORK_ERROR': 'Network connectivity issue',
      'UNKNOWN_ERROR': 'Unknown error occurred'
    };

    return messages[errorType] || `${errorType}: ${error?.message || 'Unknown error'}`;
  }

  /**
   * Exponential backoff with jitter
   */
  async backoff(attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    
    // Exponential backoff: 1s, 2s, 4s, 8s (capped at 10s)
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    // Add random jitter (±25%) to prevent thundering herd
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    const finalDelay = Math.max(100, delay + jitter);
    
    return new Promise(resolve => setTimeout(resolve, finalDelay));
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats() {
    const totalRequests = this.errorStats.total + this.errorStats.retrySuccess;
    const successRate = totalRequests > 0 ? 
      ((totalRequests - this.errorStats.finalFailures) / totalRequests * 100).toFixed(1) : 
      100;
    
    const undefinedRate = totalRequests > 0 ? 
      (this.errorStats.finalFailures / totalRequests * 100).toFixed(1) : 
      0;

    return {
      totalRequests,
      totalErrors: this.errorStats.total,
      finalFailures: this.errorStats.finalFailures,
      retrySuccesses: this.errorStats.retrySuccess,
      successRate: `${successRate}%`,
      undefinedRate: `${undefinedRate}%`,
      errorsByType: this.errorStats.byType,
      acceptanceCriteria: {
        target: '< 3% undefined status',
        actual: `${undefinedRate}%`,
        met: parseFloat(undefinedRate) < 3
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.errorStats = {
      total: 0,
      byType: {},
      retrySuccess: 0,
      finalFailures: 0
    };
  }

  /**
   * Fetch multiple URLs with concurrency control
   */
  async fetchMultiple(urls, concurrency = 5) {
    const results = [];
    const chunks = this.chunkArray(urls, concurrency);
    
    for (const chunk of chunks) {
      const promises = chunk.map(url => this.fetchWithRetry(url));
      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }
    
    return results;
  }

  /**
   * Utility to chunk array for concurrency control
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Enhanced link checking with classification
   */
  async checkLink(url, sourceUrl = null) {
    const result = await this.fetchWithRetry(url);
    
    return {
      url: url,
      sourceUrl: sourceUrl,
      status: result.status,
      statusText: result.statusText,
      ok: result.ok,
      errorType: result.errorType,
      errorMessage: result.errorMessage,
      redirected: result.redirected,
      finalUrl: result.url,
      retryAttempts: result.attempt,
      classification: this.classifyLinkStatus(result)
    };
  }

  /**
   * Classify link status for better reporting
   */
  classifyLinkStatus(result) {
    if (result.success) {
      if (result.status === 200) {
        return 'working';
      } else if (result.status >= 300 && result.status < 400) {
        return 'redirect';
      } else {
        return 'warning';
      }
    } else {
      if (result.errorType?.includes('CLIENT_ERROR_4')) {
        return 'broken';
      } else if (result.errorType?.includes('SERVER_ERROR_5')) {
        return 'server_error';
      } else {
        return 'unreachable';
      }
    }
  }
}

module.exports = SmartCrawler;