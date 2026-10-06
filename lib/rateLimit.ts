import { NextRequest, NextResponse } from "next/server";

// simple in-memory rate limiter for api routes. good enough to stop
// someone hammering an endpoint from one session, but heads up: vercel
// runs these as separate short-lived instances, so this count doesn't
// reliably carry over between them - it's not a real wall against a
// determined attacker spreading requests across many instances. for that
// you'd want a shared store like upstash redis instead of this map.
const buckets = new Map<string, { count: number; resetAt: number }>();

// clear out old entries occasionally so this doesn't grow forever
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

function getClientIp(req: NextRequest): string {
  // vercel sets this; first entry is the real client
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Call at the top of a route handler. Returns a 429 response if this IP has
 * gone over the limit, or null if it's fine to continue.
 *
 *   const limited = rateLimit(req, "create-payment-intent", { max: 10, windowMs: 60_000 });
 *   if (limited) return limited;
 */
export function rateLimit(
  req: NextRequest,
  routeKey: string,
  { max, windowMs }: { max: number; windowMs: number }
): NextResponse | null {
  sweep();

  const ip = getClientIp(req);
  const key = `${routeKey}:${ip}`;
  const now = Date.now();

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (bucket.count >= max) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again in a moment." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  bucket.count += 1;
  return null;
}
