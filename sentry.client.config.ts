import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Client-Side Configuration
 * 
 * Initializes Sentry for browser error tracking with:
 * - Performance monitoring (10% sample rate)
 * - Session replay (10% sample rate, 100% on error)
 * 
 * Setup:
 * 1. Create a project at https://sentry.io
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in your .env.local
 */

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Set environment
  environment: process.env.NODE_ENV,
});
