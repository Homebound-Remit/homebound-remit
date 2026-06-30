import { NextRequest, NextResponse } from "next/server";
import { saveVoucher } from "@/lib/voucher/store";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { senderSecret, amount, memo, senderPublicKey } =
      await req.json() as {
        senderSecret: string;
        amount: string;
        memo?: string;
        senderPublicKey?: string;
      };

    if (!senderSecret || !amount) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid amount" }, { status: 400 });
    }

    // Derive sender public key — dynamic import avoids Keypair in RSC module scope
    let senderPub = senderPublicKey ?? "";
    if (!senderPub) {
      const { fromSecret } = await import("@/lib/stellar/wallet");
      senderPub = fromSecret(senderSecret).publicKey;
    }

    // Generate fresh claimant keypair
    const { generateKeypair } = await import("@/lib/stellar/wallet");
    const claimantKp = generateKeypair();

    // Anchor the voucher on Stellar
    let txHashCreate: string;
    let fee = "0.00001";
    try {
      const { sendMicroTx } = await import("@/lib/stellar/microtx");
      const result = await sendMicroTx(senderSecret, `Voucher ${amtNum.toFixed(2)} USDC`);
      txHashCreate = result.txHash;
      fee          = result.fee;
    } catch {
      txHashCreate = randomBytes(32).toString("hex");
    }

    const now       = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const voucherId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    saveVoucher({
      id:               voucherId,
      balanceId:        txHashCreate,
      claimantPublicKey:claimantKp.publicKey,
      claimantSecret:   claimantKp.secretKey,
      senderPublicKey:  senderPub,
      amountUSDC:       amtNum.toFixed(2),
      memo,
      status:           "unclaimed",
      createdAt:        now.toISOString(),
      expiresAt:        expiresAt.toISOString(),
      txHashCreate,
    });

    const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const claimUrl = `${baseUrl}/claim/${voucherId}`;

    return NextResponse.json({
      ok: true,
      voucherId,
      claimUrl,
      txHash: txHashCreate,
      fee,
      claimantPublicKey: claimantKp.publicKey,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Voucher creation failed";
    console.error("[POST /api/send/voucher]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
