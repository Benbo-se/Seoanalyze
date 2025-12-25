import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
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
  
  // Configure which integrations to use
  integrations: [
    new Sentry.BrowserTracing({
      // Set up automatic route change tracking for Next.js
      routingInstrumentation: Sentry.nextRouterInstrumentation(
        typeof window !== 'undefined' ? window.location : undefined
      ),
    }),
  ],
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_RELEASE || '1.0.0',
});