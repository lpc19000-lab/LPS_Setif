// ── Simple In-Memory Rate Limiter ──────────────────────────────────────────
// Tracks request counts per IP within a rolling window.
// Suitable for single-instance deployments.

interface RateEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup (every 100 checks)
  if (Math.random() < 0.01) {
    for (const [key, entry] of store) {
      if (now > entry.resetTime) store.delete(key);
    }
  }

  const entry = store.get(ip);

  if (!entry || now > entry.resetTime) {
    store.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return true;
  }

  return false;
}
