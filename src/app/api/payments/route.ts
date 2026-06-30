import { NextRequest, NextResponse } from "next/server";
import { getAllPayments } from "@/lib/biller/registry";

export async function GET() {
  const payments = getAllPayments();
  return NextResponse.json({ ok: true, payments });
}
