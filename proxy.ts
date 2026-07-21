import { NextRequest, NextResponse } from 'next/server';
import { getLimiterForPath, isRateLimitConfigured } from '@/lib/rate-limit';

/**
 * Next.js Edge Middleware
 * 
 * Applies rate limiting to all /api/* routes using Upstash Redis.
 * Returns 429 Too Many Requests when limits are exceeded.
 * 
 * If Upstash environment variables are not configured, the middleware
 * passes through all requests without rate limiting.
 */
export async function proxy(request: NextRequest) {
  // Skip rate limiting if not configured
  if (!isRateLimitConfigured()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const limiter = getLimiterForPath(pathname);

  // No limiter for this path, pass through
  if (!limiter) {
    return NextResponse.next();
  }

  // Identify the rate limit key (prefer authenticated user ID/email, fallback to IP)
  let identifier = '';
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    if (token.startsWith('mock-token-')) {
      identifier = token.replace('mock-token-', '');
    } else if (token.startsWith('ey') && token.includes('.')) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
        identifier = payload.sub || payload.email || '';
      } catch (e) {}
    }
  }

  // Fallback to IP address if unauthenticated
  if (!identifier) {
    identifier = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'anonymous';
  }

  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Attach rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', reset.toString());
    return response;
  } catch (error) {
    // If rate limiting fails (Redis down), allow the request through
    console.error('Rate limit check failed:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/api/:path*',
};
