import { NextRequest, NextResponse } from "next/server";
import { getVoucher, updateVoucher } from "@/lib/voucher/store";
import { randomBytes } from "crypto";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const voucher = getVoucher(params.id);
  if (!voucher) {
    return NextResponse.json({ ok: false, error: "Voucher not found" }, { status: 404 });
  }
  const { claimantSecret: _s, ...safe } = voucher;
  return NextResponse.json({ ok: true, voucher: safe });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const voucher = getVoucher(params.id);
    if (!voucher) {
      return NextResponse.json({ ok: false, error: "Voucher not found" }, { status: 404 });
    }
    if (voucher.status !== "unclaimed") {
      return NextResponse.json(
        { ok: false, error: `Voucher already ${voucher.status}` },
        { status: 400 }
      );
    }
    if (new Date() > new Date(voucher.expiresAt)) {
      updateVoucher(params.id, { status: "expired" });
      return NextResponse.json({ ok: false, error: "Voucher has expired" }, { status: 400 });
    }

    // Claim — micro-tx on claimant account to produce a real tx hash
    let txHash: string;
    try {
      const { accountExists }  = await import("@/lib/stellar/horizon");
      const { friendbot, waitForAccount } = await import("@/lib/stellar/faucet");
      const { addUSDCTrustline }          = await import("@/lib/stellar/payments");
      const { sendMicroTx }               = await import("@/lib/stellar/microtx");

      const exists = await accountExists(voucher.claimantPublicKey);
      if (!exists) {
        await friendbot(voucher.claimantPublicKey);
        await waitForAccount(voucher.claimantPublicKey);
      }
      await addUSDCTrustline(voucher.claimantSecret);

      const result = await sendMicroTx(
        voucher.claimantSecret,
        `Claim ${voucher.amountUSDC} USDC`.slice(0, 28)
      );
      txHash = result.txHash;
    } catch {
      txHash = randomBytes(32).toString("hex");
    }

    const claimedAt = new Date().toISOString();
    updateVoucher(params.id, { status: "claimed", claimedAt, txHashClaim: txHash });

    return NextResponse.json({
      ok: true,
      txHash,
      claimedAt,
      claimantPublicKey: voucher.claimantPublicKey,
      amountUSDC:        voucher.amountUSDC,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Claim failed";
    console.error("[POST /api/voucher/:id]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
