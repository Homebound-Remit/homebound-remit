import { NextRequest, NextResponse } from "next/server";
import { listBillers, registerBiller, getBiller } from "@/lib/biller/registry";

export async function GET() {
  const billers = listBillers();
  return NextResponse.json({ ok: true, billers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, walletAddress, country, currency, logoUrl } = body;
    if (!name || !category || !walletAddress || !country || !currency) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    const biller = registerBiller({
      name, category, walletAddress, country, currency,
      logoUrl: logoUrl ?? undefined,
      active: true,
    });
    return NextResponse.json({ ok: true, biller }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
