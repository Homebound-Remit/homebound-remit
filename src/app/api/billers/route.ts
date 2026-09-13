import { NextRequest, NextResponse } from "next/server";
import { listBillers, registerBiller } from "@/lib/biller/registry";
import { parseBody, BillerRegisterSchema } from "@/lib/validation/schemas";

export async function GET() {
  const billers = listBillers();
  return NextResponse.json({ ok: true, billers });
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, BillerRegisterSchema);
    if (parsed.error) return parsed.error;
    const { name, category, walletAddress, country, currency, logoUrl } = parsed.data;

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
