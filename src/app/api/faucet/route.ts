import { NextRequest, NextResponse } from "next/server";
import { setupTestnetAccount } from "@/lib/stellar/faucet";
import { DEMO_USDC_BALANCE } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { publicKey, secret } = await req.json() as {
      publicKey?: string;
      secret?: string;
    };

    if (!publicKey || !secret) {
      return NextResponse.json(
        { ok: false, error: "publicKey and secret are required" },
        { status: 400 }
      );
    }

    await setupTestnetAccount(publicKey, secret);

    return NextResponse.json({
      ok:              true,
      funded:          true,
      trustlineAdded:  true,
      useDemoBalance:  true,
      demoBalance:     DEMO_USDC_BALANCE,
      message:         "Account funded with XLM · USDC trustline added · demo balance overlay applied",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/faucet]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
