/**
 * Biller Registry — globalThis singleton so state survives
 * Next.js hot-reload and RSC module isolation in dev mode.
 */
import type { BillerCategory } from "@/types";

export interface Biller {
  id: string;
  name: string;
  category: BillerCategory;
  walletAddress: string;
  logoUrl?: string;
  country: string;
  currency: string;
  active: boolean;
  createdAt: string;
}

export interface BillPayment {
  id: string;
  billerId: string;
  billerName: string;
  senderPublicKey: string;
  reference: string;
  amountUSDC: string;
  amountLocal: string;
  currency: string;
  txHash: string;
  createdAt: string;
  status: "pending" | "confirmed" | "failed";
}

declare global {
  // eslint-disable-next-line no-var
  var __hb_billers: Map<string, Biller> | undefined;
  // eslint-disable-next-line no-var
  var __hb_payments: Map<string, BillPayment> | undefined;
}

function getBillerStore(): Map<string, Biller> {
  if (!globalThis.__hb_billers) {
    globalThis.__hb_billers = new Map();
    seedBillers(globalThis.__hb_billers);
  }
  return globalThis.__hb_billers;
}

function getPaymentStore(): Map<string, BillPayment> {
  if (!globalThis.__hb_payments) {
    globalThis.__hb_payments = new Map();
  }
  return globalThis.__hb_payments;
}

function seedBillers(store: Map<string, Biller>) {
  const billers: Biller[] = [
    {
      id: "biller_sunrise_school",
      name: "Sunrise Academy",
      category: "school",
      walletAddress: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV",
      logoUrl: "/logos/school.svg",
      country: "Kenya",
      currency: "KES",
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "biller_kenya_power",
      name: "Kenya Power & Light",
      category: "utility",
      walletAddress: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV",
      logoUrl: "/logos/utility.svg",
      country: "Kenya",
      currency: "KES",
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "biller_manila_landlord",
      name: "Manila Heights Landlord",
      category: "rent",
      walletAddress: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV",
      logoUrl: "/logos/rent.svg",
      country: "Philippines",
      currency: "PHP",
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "biller_safaricom",
      name: "Safaricom (Airtime)",
      category: "telecom",
      walletAddress: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV",
      logoUrl: "/logos/telecom.svg",
      country: "Kenya",
      currency: "KES",
      active: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
  ];
  for (const b of billers) store.set(b.id, b);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function listBillers(): Biller[] {
  return Array.from(getBillerStore().values()).filter((b) => b.active);
}

export function getBiller(id: string): Biller | undefined {
  return getBillerStore().get(id);
}

export function registerBiller(data: Omit<Biller, "id" | "createdAt">): Biller {
  const id = `biller_${data.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
  const biller: Biller = { ...data, id, createdAt: new Date().toISOString() };
  getBillerStore().set(id, biller);
  return biller;
}

export function recordPayment(p: Omit<BillPayment, "id">): BillPayment {
  const id   = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const full = { ...p, id } as BillPayment;
  getPaymentStore().set(id, full);
  return full;
}

export function getPaymentsForBiller(billerId: string): BillPayment[] {
  return Array.from(getPaymentStore().values())
    .filter((p) => p.billerId === billerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllPayments(): BillPayment[] {
  return Array.from(getPaymentStore().values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
