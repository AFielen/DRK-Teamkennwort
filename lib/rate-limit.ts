/**
 * In-memory rate limiter with TTL.
 * No Redis needed for MVP.
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.firstAttempt > 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check and increment rate limit.
 * @param key - Unique key (e.g., `login:${ip}` or `unlock:${userId}:${teamId}`)
 * @param maxAttempts - Maximum attempts in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    store.set(key, { count: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterMs = windowMs - (now - entry.firstAttempt);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  entry.lastAttempt = now;

  // Progressive delay: 0, 1s, 2s, 4s, 8s
  const delay = entry.count <= 1 ? 0 : Math.pow(2, entry.count - 2) * 1000;

  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterMs: delay,
  };
}

/**
 * Reset rate limit for a key (e.g., after successful login).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
