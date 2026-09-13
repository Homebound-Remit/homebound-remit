import { NextResponse } from "next/server";
import { generateKeypair, fromSecret } from "@/lib/stellar/wallet";
import { parseBody, KeygenPostSchema } from "@/lib/validation/schemas";

/** Generate a fresh keypair — server-side, keeps SDK out of browser bundle */
export async function GET() {
  const kp = generateKeypair();
  return NextResponse.json({ ok: true, publicKey: kp.publicKey, secretKey: kp.secretKey });
}

/** Derive public key from secret key */
export async function POST(req: Request) {
  try {
    const parsed = await parseBody(req, KeygenPostSchema);
    if (parsed.error) return parsed.error;
    const kp = fromSecret(parsed.data.secret);
    return NextResponse.json({ ok: true, publicKey: kp.publicKey, secretKey: kp.secretKey });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid secret key" },
      { status: 400 }
    );
  }
}
