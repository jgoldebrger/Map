type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
const MAX_STORE = 10_000;

function prune(now: number) {
  if (store.size < MAX_STORE) return;
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
    if (store.size < MAX_STORE / 2) break;
  }
}

export function clientIp(request: { headers: { get(name: string): string | null } }): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function consumeRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { success: boolean; retryAfterSec?: number } {
  const now = Date.now();
  prune(now);

  let bucket = store.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    store.set(key, bucket);
    return { success: true };
  }

  if (bucket.count >= limit) {
    return {
      success: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count++;
  return { success: true };
}
