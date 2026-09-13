import { NextRequest, NextResponse } from "next/server";
import { setupTestnetAccount } from "@/lib/stellar/faucet";
import { DEMO_USDC_BALANCE } from "@/lib/constants";
import { parseBody, FaucetSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, FaucetSchema);
    if (parsed.error) return parsed.error;
    const { publicKey, secret } = parsed.data;

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
