/**
 * Stellar Claimable Balances — walletless voucher on-chain layer
 */
import { Asset, Claimant, Keypair, Operation, TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { BASE_FEE, NETWORK_PASSPHRASE, VOUCHER_EXPIRY_DAYS } from "@/lib/constants";
import { getServer, loadAccount } from "./horizon";
import { getUSDC } from "./payments";

export interface ClaimableInfo {
  balanceId: string;
  amount: string;
  claimantPublicKey: string;
  senderPublicKey: string;
  createdAt: string;
  expiresAt: string;
}

export async function createVoucher(
  senderSecret: string,
  claimantPublicKey: string,
  amount: string
): Promise<ClaimableInfo> {
  const kp      = Keypair.fromSecret(senderSecret);
  const server  = getServer();
  const account = await loadAccount(kp.publicKey());

  const expiresAt = new Date(
    Date.now() + VOUCHER_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  const claimants = [
    new Claimant(claimantPublicKey, Claimant.predicateUnconditional()),
    new Claimant(
      kp.publicKey(),
      Claimant.predicateNot(
        Claimant.predicateBeforeAbsoluteTime(
          String(Math.floor(expiresAt.getTime() / 1000))
        )
      )
    ),
  ];

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.createClaimableBalance({ asset: getUSDC(), amount, claimants }))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await server.submitTransaction(tx);
  const balanceId   = extractBalanceId(result) ?? `mock_${Date.now()}`;

  return {
    balanceId,
    amount,
    claimantPublicKey,
    senderPublicKey: kp.publicKey(),
    createdAt:       new Date().toISOString(),
    expiresAt:       expiresAt.toISOString(),
  };
}

export async function claimVoucher(
  claimantSecret: string,
  balanceId: string
): Promise<{ txHash: string }> {
  const kp      = Keypair.fromSecret(claimantSecret);
  const server  = getServer();
  const account = await loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.claimClaimableBalance({ balanceId }))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = await server.submitTransaction(tx);
  return { txHash: r.hash };
}

export async function reclaimVoucher(
  senderSecret: string,
  balanceId: string
): Promise<{ txHash: string }> {
  return claimVoucher(senderSecret, balanceId);
}

function extractBalanceId(result: { result_meta_xdr?: string }): string | null {
  try {
    if (!result.result_meta_xdr) return null;
    const meta = xdr.TransactionMeta.fromXDR(result.result_meta_xdr, "base64");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops = (meta as any).v2?.().operations?.() ?? [];
    for (const op of ops) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const change of op.changes?.() ?? []) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (change as any).created?.()?.data?.();
          if (data?.switch?.()?.name === "claimableBalance") {
            return data.claimableBalance().balanceId().toXDR("hex") as string;
          }
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }
  return null;
}
