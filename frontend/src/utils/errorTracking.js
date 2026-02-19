import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception with additional context
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context information
 * @param {string} level - Error level (error, warning, info)
 */
export function captureException(error, context = {}, level = 'error') {
  Sentry.withScope((scope) => {
    // Set level
    scope.setLevel(level);
    
    // Add context
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    
    // Add user context if available
    const userContext = getUserContext();
    if (userContext) {
      scope.setUser(userContext);
    }
    
    // Capture the exception
    Sentry.captureException(error);
  });
}

/**
 * Capture a message with context
 * @param {string} message - The message to capture
 * @param {string} level - Message level
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    
    Sentry.captureMessage(message);
  });
}

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
export function setUser(user) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {string} category - Breadcrumb category
 * @param {string} level - Breadcrumb level
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track performance metrics
 * @param {string} name - Transaction name
 * @param {Function} operation - Operation to track
 */
export async function trackTransaction(name, operation) {
  const transaction = Sentry.startTransaction({
    name,
    op: 'function',
  });
  
  Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));
  
  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Get user context from current session/localStorage
 */
function getUserContext() {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionId = sessionStorage.getItem('sessionId');
    const userId = localStorage.getItem('userId');
    
    return {
      id: userId || 'anonymous',
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}