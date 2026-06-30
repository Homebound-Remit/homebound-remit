import { NextResponse } from "next/server";
import { generateKeypair, fromSecret } from "@/lib/stellar/wallet";

/** Generate a fresh keypair — server-side, keeps SDK out of browser bundle */
export async function GET() {
  const kp = generateKeypair();
  return NextResponse.json({ ok: true, publicKey: kp.publicKey, secretKey: kp.secretKey });
}

/** Derive public key from secret key */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const secret = (body?.secret ?? "").trim();
    if (!secret.startsWith("S") || secret.length < 56) {
      return NextResponse.json(
        { ok: false, error: "Invalid secret key — must start with S and be 56+ characters" },
        { status: 400 }
      );
    }
    const kp = fromSecret(secret);
    return NextResponse.json({ ok: true, publicKey: kp.publicKey, secretKey: kp.secretKey });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid secret key" },
      { status: 400 }
    );
  }
}
