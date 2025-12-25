import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Set sample rate for performance monitoring
  tracesSampleRate: 0.1,
  
  // Set sample rate for profiling  
  profilesSampleRate: 0.1,
  
  // Configure error reporting
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.RELEASE || '1.0.0',
  
  // Server-specific configuration
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});