import { NextResponse } from "next/server";
import { HORIZON_URL } from "@/lib/constants";

/**
 * GET /api/health — readiness + liveness probe.
 * Checks Horizon connectivity and returns uptime.
 */

const startTime = Date.now();

export async function GET() {
  let horizonOk = false;
  try {
    const res = await fetch(`${HORIZON_URL}`, {
      signal: AbortSignal.timeout(5_000),
    });
    horizonOk = res.ok;
  } catch {
    horizonOk = false;
  }

  return NextResponse.json({
    ok: true,
    version: process.env.npm_package_version ?? "0.1.0",
    horizon: { url: HORIZON_URL, reachable: horizonOk },
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
}
