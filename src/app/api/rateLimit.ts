// Simple in-memory rate limiter for demo purposes
// TODO: Replace with Redis-backed rate limiter for production scaling

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const WINDOW_SIZE = 60 * 1000;
const MAX_REQUESTS = 60;

export function rateLimitMiddleware(identifier: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || (now - entry.windowStart) > WINDOW_SIZE) {
    // New window or first request
    rateLimitStore.set(identifier, {
      count: 1,
      windowStart: now,
    });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.windowStart + WINDOW_SIZE - now) / 1000);
    return { 
      allowed: false, 
      retryAfter 
    };
  }

  entry.count++;
  return { allowed: true };
}

export function getRateLimitStatus(identifier: string) {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry || (now - entry.windowStart) > WINDOW_SIZE) {
    return {
      remaining: MAX_REQUESTS,
      resetTime: Math.ceil((now + WINDOW_SIZE) / 1000),
    };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    resetTime: Math.ceil((entry.windowStart + WINDOW_SIZE) / 1000),
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if ((now - entry.windowStart) > WINDOW_SIZE) {
      rateLimitStore.delete(key);
    }
  }
}, WINDOW_SIZE);
