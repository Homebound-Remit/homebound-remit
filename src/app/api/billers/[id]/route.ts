import { NextRequest, NextResponse } from "next/server";
import { getBiller, getPaymentsForBiller } from "@/lib/biller/registry";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const biller = getBiller(params.id);
  if (!biller) {
    return NextResponse.json({ ok: false, error: "Biller not found" }, { status: 404 });
  }
  const payments = getPaymentsForBiller(params.id);
  return NextResponse.json({ ok: true, biller, payments });
}
