/**
 * Stellar payment operations — server-side only.
 * Never import this in client components; use /api/* routes.
 */
import {
  Asset, Keypair, Memo, Operation, TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  BASE_FEE, NETWORK_PASSPHRASE, USDC_CODE, USDC_ISSUER, HORIZON_URL, HORIZON_TIMEOUT_MS,
} from "@/lib/constants";
import { getServer, loadAccount } from "./horizon";

// Lazy singleton — avoids "Issuer is invalid" at module-eval time in Next.js RSC
let _usdc: Asset | null = null;
export function getUSDC(): Asset {
  if (!_usdc) _usdc = new Asset(USDC_CODE, USDC_ISSUER);
  return _usdc;
}

export interface PaymentResult {
  txHash: string;
  fee: string;
  ledger: number;
  createdAt: string;
}

/** Native-fetch trustline check — avoids the SDK's axios in RSC context */
async function hasTrustline(publicKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${encodeURIComponent(publicKey)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(HORIZON_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const data = await res.json() as {
      balances: Array<{ asset_type: string; asset_code?: string }>;
    };
    return data.balances.some(
      (b) => b.asset_type === "credit_alphanum4" && b.asset_code === USDC_CODE
    );
  } catch {
    return false;
  }
}

/** Send USDC from sender → recipient */
export async function sendUSDC(
  senderSecret: string,
  recipientPublicKey: string,
  amount: string,
  memo?: string
): Promise<PaymentResult> {
  const kp      = Keypair.fromSecret(senderSecret);
  const server  = getServer();
  const account = await loadAccount(kp.publicKey());

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({ destination: recipientPublicKey, asset: getUSDC(), amount })
  );
  if (memo) builder.addMemo(Memo.text(memo.slice(0, 28)));

  const tx = builder.setTimeout(30).build();
  tx.sign(kp);


  const r: any = await server.submitTransaction(tx);
  return {
    txHash:    r.hash,
    fee:       String(Number(r.fee_charged ?? BASE_FEE) / 1e7),
    ledger:    r.ledger ?? 0,
    createdAt: new Date().toISOString(),
  };
}

/** Add USDC trustline (idempotent) */
export async function addUSDCTrustline(secret: string): Promise<void> {
  const kp = Keypair.fromSecret(secret);
  if (await hasTrustline(kp.publicKey())) return;

  const server  = getServer();
  const account = await loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: getUSDC(), limit: "1000000" }))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  await server.submitTransaction(tx);
}
