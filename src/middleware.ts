import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight sliding-window rate limiter using an in-memory Map.
 * Sufficient for a demo; swap to Redis-backed for production multi-instance.
 */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;  // per window per IP

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(ip, timestamps);
  return timestamps.length > MAX_REQUESTS;
}

export function middleware(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";

  if (rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests — please slow down" },
      { status: 429 },
    );
  }

  const res = NextResponse.next();

  // CORS for same-origin; tighten for production
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("X-Request-Id", crypto.randomUUID());

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
