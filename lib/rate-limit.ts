import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiter factory using Upstash Redis.
 * 
 * Configures sliding window rate limiters for different route tiers:
 * - Auth routes: 5 requests per 60 seconds (strict, prevents brute force)
 * - Upload routes: 10 requests per 60 seconds (prevent abuse)
 * - General API routes: 60 requests per 60 seconds (generous default)
 * 
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL: Your Upstash Redis REST endpoint
 * - UPSTASH_REDIS_REST_TOKEN: Your Upstash Redis REST token
 */

const isConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

function createRedis() {
  if (!isConfigured) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function createLimiter(requests: number, window: string) {
  const redis = createRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
    prefix: 'navy-mentorship',
  });
}

/** Strict limiter for auth routes (login, signup, password reset) */
export const authLimiter = createLimiter(5, '60 s');

/** Upload limiter for file upload routes */
export const uploadLimiter = createLimiter(30, '60 s');

/** General API limiter */
export const apiLimiter = createLimiter(60, '60 s');

/**
 * Determine the appropriate rate limiter for a given pathname.
 */
export function getLimiterForPath(pathname: string) {
  if (pathname.startsWith('/api/auth')) return authLimiter;
  if (pathname.startsWith('/api/upload')) return uploadLimiter;
  if (pathname.startsWith('/api/')) return apiLimiter;
  return null;
}

/**
 * Check if rate limiting is configured (env vars present).
 */
export function isRateLimitConfigured() {
  return isConfigured;
}
