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

export interface FXRate {
  currency: string;
  symbol: string;
  flag: string;
  ratePerUSD: number;
  mark: number;
}

export interface FXConversion {
  localAmount: number;
  effectiveRate: number;
  markAmount: number;
  markPct: number;
  formatted: string;
}

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

export interface DemoRecipient {
  id: string;
  name: string;
  relation: string;
  country: string;
  flag: string;
  currency: string;
  publicKey: string;
  avatar: string;
}
