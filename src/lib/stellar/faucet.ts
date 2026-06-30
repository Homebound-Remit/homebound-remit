/**
 * Testnet account setup helpers
 */
import { FRIENDBOT_URL, ACCOUNT_POLL_TIMEOUT_MS } from "@/lib/constants";
import { addUSDCTrustline } from "./payments";
import { accountExists } from "./horizon";

export async function friendbot(publicKey: string): Promise<void> {
  const res = await fetch(
    `${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`,
    { signal: AbortSignal.timeout(15_000) }
  );
  if (!res.ok) {
    const text = await res.text();
    if (text.includes("already") || text.includes("op_already_exists")) return;
    throw new Error(`Friendbot failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

/** Poll Horizon until account appears; returns true when confirmed */
export async function waitForAccount(
  publicKey: string,
  intervalMs = 2_000
): Promise<boolean> {
  const deadline = Date.now() + ACCOUNT_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await accountExists(publicKey)) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

/**
 * Full testnet setup:
 * 1. Friendbot (skip if account already exists)
 * 2. Poll until account is on-chain
 * 3. Add USDC trustline (idempotent)
 */
export async function setupTestnetAccount(publicKey: string, secret: string) {
  if (!(await accountExists(publicKey))) {
    await friendbot(publicKey);
    const appeared = await waitForAccount(publicKey);
    if (!appeared) {
      throw new Error(
        "Account not confirmed on Stellar testnet within 30 s — " +
        "Friendbot may be overloaded. Please try again."
      );
    }
  }

  await addUSDCTrustline(secret);
  return { funded: true, trustlineAdded: true };
}
