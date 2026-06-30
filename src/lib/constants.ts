/**
 * App-wide constants
 * All magic numbers live here — one place to change for mainnet.
 */

// ─── Stellar network ─────────────────────────────────────────────────────────
export const STELLAR_NETWORK     = "testnet" as const;
export const HORIZON_URL         = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE  = "Test SDF Network ; September 2015";
export const FRIENDBOT_URL       = "https://friendbot.stellar.org";

/** Circle USDC on Stellar testnet */
export const USDC_CODE   = "USDC";
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

/** Stellar base fee in stroops (100 stroops = 0.00001 XLM) */
export const BASE_FEE = "100";

// ─── Fee model ───────────────────────────────────────────────────────────────
/** Homebound's effective fee in USD (Stellar network cost, not a spread) */
export const HOMEBOUND_FEE_USD = 0.01;

/** Industry-average wire/remittance fee percentage */
export const LEGACY_FEE_PCT = 6;

// ─── Demo ─────────────────────────────────────────────────────────────────────
/** Demo USDC balance applied as a display overlay when no real distributor is configured */
export const DEMO_USDC_BALANCE = "500.00";

/** Voucher expiry in days */
export const VOUCHER_EXPIRY_DAYS = 7;

// ─── Timeouts ─────────────────────────────────────────────────────────────────
/** Max time (ms) to wait for Friendbot account to appear on-chain */
export const ACCOUNT_POLL_TIMEOUT_MS = 30_000;

/** Horizon REST request timeout */
export const HORIZON_TIMEOUT_MS = 8_000;
