/**
 * One cancel at a time per stay in this process.
 *
 * A double click (or two tabs) sent two cancels for the same stay at once. Both read it as
 * open and both asked the gateway for a refund, so the guest could get paid back twice.
 * The second cancel now waits for the first and then sees the stay as already refunded.
 */
const g = globalThis as typeof globalThis & { __twCancelLocks__?: Map<string, Promise<unknown>> };

function locks() {
  g.__twCancelLocks__ ??= new Map();
  return g.__twCancelLocks__;
}

export async function withCancelLock<T>(key: string, run: () => Promise<T>): Promise<T> {
  const map = locks();
  const before = map.get(key) ?? Promise.resolve();
  const mine = before.catch(() => undefined).then(run);
  const tail = mine.catch(() => undefined);
  map.set(key, tail);
  try {
    return await mine;
  } finally {
    if (map.get(key) === tail) map.delete(key);
  }
}
