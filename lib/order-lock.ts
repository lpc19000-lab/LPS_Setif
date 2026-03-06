// ── In-Memory Order Processing Lock ────────────────────────────────────────
// Prevents duplicate order submissions from the same customer.
// Uses a simple Set with automatic cleanup after timeout.

const activeLocks = new Map<string, number>();

const LOCK_TIMEOUT_MS = 30_000; // 30 seconds

export function acquireOrderLock(customerId: string): boolean {
  const now = Date.now();

  // Clean expired locks
  for (const [key, timestamp] of activeLocks) {
    if (now - timestamp > LOCK_TIMEOUT_MS) {
      activeLocks.delete(key);
    }
  }

  if (activeLocks.has(customerId)) {
    return false; // Lock already held
  }

  activeLocks.set(customerId, now);
  return true;
}

export function releaseOrderLock(customerId: string): void {
  activeLocks.delete(customerId);
}
