/**
 * Voucher in-memory store
 *
 * Uses a globalThis singleton to survive Next.js hot-reload and RSC
 * module isolation — the same trick Next.js uses for DB connections.
 */
import type { VoucherStatus } from "@/types";

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

// Persist across hot-reloads in dev and across RSC module instances
declare global {
  // eslint-disable-next-line no-var
  var __hb_vouchers: Map<string, Voucher> | undefined;
}

function getStore(): Map<string, Voucher> {
  if (!globalThis.__hb_vouchers) {
    globalThis.__hb_vouchers = new Map();
  }
  return globalThis.__hb_vouchers;
}

export function saveVoucher(v: Voucher): void {
  getStore().set(v.id, v);
}

export function getVoucher(id: string): Voucher | undefined {
  return getStore().get(id);
}

export function updateVoucher(id: string, patch: Partial<Voucher>): Voucher | undefined {
  const store = getStore();
  const v = store.get(id);
  if (!v) return undefined;
  const updated = { ...v, ...patch };
  store.set(id, updated);
  return updated;
}

export function listVouchers(senderPublicKey: string): Voucher[] {
  return Array.from(getStore().values())
    .filter((v) => v.senderPublicKey === senderPublicKey)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
