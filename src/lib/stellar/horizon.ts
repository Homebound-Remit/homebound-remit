/**
 * Horizon REST client — all queries use native fetch.
 * The Horizon.Server instance is kept ONLY for tx submission
 * (submitTransaction), never for account loading.
 *
 * Includes typed response interfaces, retry logic, and centralized errors.
 */
import { Horizon } from "@stellar/stellar-sdk";
import { HORIZON_URL, USDC_CODE, HORIZON_TIMEOUT_MS } from "@/lib/constants";
import { withRetry } from "./retry";
import { AccountNotFoundError, HorizonTimeoutError, classifyHorizonError } from "../errors/stellar";

let _server: Horizon.Server | null = null;

export function getServer(): Horizon.Server {
  if (!_server) {
    _server = new Horizon.Server(HORIZON_URL, { allowHttp: false });
  }
  return _server;
}

// ─── Typed Horizon response interfaces ───────────────────────────────────────

export interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
}

export interface HorizonAccountResponse {
  id: string;
  sequence: string;
  subentry_count: number;
  balances: HorizonBalance[];
  thresholds: { low_threshold: number; med_threshold: number; high_threshold: number };
  flags: { auth_required: boolean; auth_revocable: boolean; auth_clawback_enabled: boolean };
  paging_token: string;
}

// ─── Internal helper ─────────────────────────────────────────────────────────

async function fetchAccountJson(publicKey: string): Promise<HorizonAccountResponse | null> {
  try {
    const data = await withRetry(async () => {
      const res = await fetch(
        `${HORIZON_URL}/accounts/${encodeURIComponent(publicKey)}`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(HORIZON_TIMEOUT_MS),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        throw classifyHorizonError(res.status, body);
      }
      return res.json() as Promise<HorizonAccountResponse>;
    }, {
      maxRetries: 2,
      baseDelayMs: 400,
      retryableStatuses: [429, 502, 503, 504],
    });
    return data;
  } catch (err) {
    if (err instanceof AccountNotFoundError) return null;
    if (err instanceof HorizonTimeoutError) return null;
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function accountExists(publicKey: string): Promise<boolean> {
  return (await fetchAccountJson(publicKey)) !== null;
}

export async function getUSDCBalance(publicKey: string): Promise<string> {
  const data = await fetchAccountJson(publicKey);
  if (!data) return "0";
  const b = data.balances.find(
    (b) => b.asset_type === "credit_alphanum4" && b.asset_code === USDC_CODE,
  );
  return b?.balance ?? "0";
}

export async function getXLMBalance(publicKey: string): Promise<string> {
  const data = await fetchAccountJson(publicKey);
  if (!data) return "0";
  const b = data.balances.find((b) => b.asset_type === "native");
  return b?.balance ?? "0";
}

/**
 * Load a Stellar account for use in TransactionBuilder.
 * Uses native fetch instead of SDK's axios to avoid RSC issues.
 */
export async function loadAccount(publicKey: string) {
  const data = await fetchAccountJson(publicKey);
  if (!data) throw new AccountNotFoundError(publicKey);

  // Return an object shaped like Horizon.AccountResponse
  // (enough for TransactionBuilder to work)
  return {
    id:              publicKey,
    accountId:       () => publicKey,
    sequenceNumber:  () => data.sequence,
    incrementSequenceNumber: () => {},
    sequence:        data.sequence,
    balances:        data.balances,
  };
}
