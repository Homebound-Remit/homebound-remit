/**
 * Shared TypeScript types used across the Homebound app.
 * API routes, UI components, and stores all import from here.
 */

// ─── Stellar ─────────────────────────────────────────────────────────────────

export interface StellarKeypair {
  publicKey: string;
  secretKey: string;
}

export interface TxResult {
  txHash: string;
  fee: string;    // XLM fee as decimal string
  ledger: number;
  createdAt: string;
}

// ─── Billers ─────────────────────────────────────────────────────────────────

export type BillerCategory = "rent" | "school" | "utility" | "telecom" | "other";

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

// ─── Vouchers ─────────────────────────────────────────────────────────────────

export type VoucherStatus = "unclaimed" | "claimed" | "reclaimed" | "expired";

export interface Voucher {
  id: string;
  balanceId: string;
  claimantPublicKey: string;
  claimantSecret: string;
  senderPublicKey: string;
  amountUSDC: string;
  memo?: string;
  status: VoucherStatus;
  createdAt: string;
  expiresAt: string;
  claimedAt?: string;
  txHashCreate: string;
  txHashClaim?: string;
}

// Voucher shape returned via API (secret stripped)
export type VoucherPublic = Omit<Voucher, "claimantSecret">;

// ─── FX Rates ────────────────────────────────────────────────────────────────
// Canonical definitions live in @/lib/fx/rates.ts (imported by consumers directly).
// Re-export here for any module that wants the type without the runtime cost.
export type { FXRate, FXConversion } from "@/lib/fx/rates";

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiOk<T = Record<string, unknown>> {
  ok: true;
  data?: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T = Record<string, unknown>> = ApiOk<T> | ApiError;

// ─── Send flow ───────────────────────────────────────────────────────────────

export type SendMode = "bill_pay" | "cash" | "voucher";

export interface SendResult {
  txHash?: string;
  voucherId?: string;
  claimUrl?: string;
  fee: string;
  localAmount: string;
  currency: string;
}

// ─── Demo / Seeds ────────────────────────────────────────────────────────────
// Canonical definition lives in @/lib/demo/seeds.ts (imported by consumers directly).
export type { DemoRecipient } from "@/lib/demo/seeds";
