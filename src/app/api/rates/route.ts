import { NextResponse } from "next/server";
import { getAllRates, convertToLocal } from "@/lib/fx/rates";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const amount = parseFloat(searchParams.get("amount") ?? "100");
  const currency = searchParams.get("currency") ?? "KES";

  const rates = getAllRates();
  const conversion = convertToLocal(amount, currency);

  return NextResponse.json({
    ok: true,
    rates,
    preview: {
      amountUSDC: amount,
      currency,
      ...conversion,
    },
  });
}
