import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Server-Side Configuration
 * 
 * Initializes Sentry for API route error tracking.
 * 
 * Setup:
 * 1. Create a project at https://sentry.io
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in your .env.local
 */

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of server-side transactions

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Set environment
  environment: process.env.NODE_ENV,
});
