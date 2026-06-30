import { NextRequest, NextResponse } from "next/server";
import { getUSDCBalance, getXLMBalance, accountExists } from "@/lib/stellar/horizon";

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key;
    if (!key || key.length < 56) {
      return NextResponse.json({ ok: false, error: "Invalid key" }, { status: 400 });
    }

    const [exists, usdc, xlm] = await Promise.all([
      accountExists(key),
      getUSDCBalance(key),
      getXLMBalance(key),
    ]);

    return NextResponse.json({ ok: true, exists, usdc, xlm });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
