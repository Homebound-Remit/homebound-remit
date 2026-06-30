/**
 * Horizon REST client — all queries use native fetch.
 * The Horizon.Server instance is kept ONLY for tx submission
 * (submitTransaction), never for account loading.
 */
import { Horizon } from "@stellar/stellar-sdk";
import { HORIZON_URL, USDC_CODE, HORIZON_TIMEOUT_MS } from "@/lib/constants";

let _server: Horizon.Server | null = null;

export function getServer(): Horizon.Server {
  if (!_server) {
    _server = new Horizon.Server(HORIZON_URL, { allowHttp: false });
  }
  return _server;
}

// ─── Internal helper ─────────────────────────────────────────────────────────

type AccountJson = {
  sequence: string;
  balances: Array<{ asset_type: string; asset_code?: string; balance: string }>;
};

async function fetchAccountJson(publicKey: string): Promise<AccountJson | null> {
  try {
    const res = await fetch(
      `${HORIZON_URL}/accounts/${encodeURIComponent(publicKey)}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(HORIZON_TIMEOUT_MS),
      }
    );
    if (!res.ok) return null;
    return res.json() as Promise<AccountJson>;
  } catch {
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
    (b) => b.asset_type === "credit_alphanum4" && b.asset_code === USDC_CODE
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
  if (!data) throw new Error(`Account ${publicKey} not found on Stellar testnet`);

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
