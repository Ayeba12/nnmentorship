/**
 * Next.js Instrumentation Hook
 * 
 * Initializes Sentry on server startup for server-side error tracking
 * and performance monitoring of API routes.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}
