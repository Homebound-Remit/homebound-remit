/**
 * Soroban Contract Client Bridge
 * ──────────────────────────────
 * Real Soroban contract calls for biller_registry and voucher contracts.
 *
 * When MOCK_MODE = true (default for demo): uses in-memory stores.
 * When MOCK_MODE = false: calls deployed Soroban contracts on Stellar testnet.
 *
 * Deploy contracts first:  bash scripts/deploy-contracts.sh
 * Then set CONTRACT_ADDRESSES below or via .env.local.
 */

import {
  SorobanRpc,
  Contract,
  nativeToScVal,
  Address,
  xdr,
  Keypair,
  TransactionBuilder,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "@/lib/constants";

export const MOCK_MODE = process.env.NEXT_PUBLIC_SOROBAN_MOCK_MODE !== "false";

const RPC_URL = "https://soroban-testnet.stellar.org";

export const CONTRACT_ADDRESSES = {
  billerRegistry: process.env.NEXT_PUBLIC_BILLER_REGISTRY_CONTRACT ?? "",
  voucher:        process.env.NEXT_PUBLIC_VOUCHER_CONTRACT ?? "",
};

/** USDC token contract address on testnet (Circle's official) */
const USDC_TOKEN = process.env.NEXT_PUBLIC_USDC_TOKEN ?? "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRpcClient(): SorobanRpc.Server {
  return new SorobanRpc.Server(RPC_URL, { allowHttp: false });
}

async function loadAccountForSoroban(publicKey: string) {
  const rpc = getRpcClient();
  return rpc.getAccount(publicKey);
}

function extractResultXdr(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Try to extract resultXdr from the error message
  const match = msg.match(/resultXdr['":\s]+([A-Za-z0-9+/=]+)/);
  return match?.[1] ?? msg.slice(0, 200);
}

// ─── pay_bill ─────────────────────────────────────────────────────────────────

export async function sorobanPayBill(params: {
  senderSecret: string;
  billerId:     string;
  reference:    string;
  amount:       string;
  network?:     "testnet" | "mainnet";
}): Promise<{ txHash: string; receiptId: string }> {
  if (MOCK_MODE) {
    throw new Error("Use mock API route in MOCK_MODE");
  }

  const kp = Keypair.fromSecret(params.senderSecret);
  const rpc = getRpcClient();
  const contract = new Contract(CONTRACT_ADDRESSES.billerRegistry);

  const amountBigInt = BigInt(Math.round(parseFloat(params.amount) * 1e7));

  const account = await loadAccountForSoroban(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "pay_bill",
        new Address(kp.publicKey()).toScVal(),
        nativeToScVal(params.billerId, { type: "string" }),
        nativeToScVal(params.reference, { type: "string" }),
        nativeToScVal(amountBigInt, { type: "i128" }),
        new Address(USDC_TOKEN).toScVal(),
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await rpc.prepareTransaction(tx);
  prepared.sign(kp);
  const result = await rpc.sendTransaction(prepared);

  // Poll for confirmation
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await rpc.getTransaction(result.hash);
    if (status.status === "SUCCESS") {
      return { txHash: result.hash, receiptId: result.hash };
    }
    if (status.status === "FAILED") {
      throw new Error(`Transaction failed: ${extractResultXdr(status)}`);
    }
  }

  throw new Error("Transaction timed out waiting for confirmation");
}

// ─── create_voucher ───────────────────────────────────────────────────────────

export async function sorobanCreateVoucher(params: {
  senderSecret:    string;
  claimantAddress: string;
  amount:          string;
  expiryTimestamp: number;
}): Promise<{ voucherId: string; txHash: string }> {
  if (MOCK_MODE) {
    throw new Error("Use mock API route in MOCK_MODE");
  }

  const kp = Keypair.fromSecret(params.senderSecret);
  const rpc = getRpcClient();
  const contract = new Contract(CONTRACT_ADDRESSES.voucher);

  const amountBigInt = BigInt(Math.round(parseFloat(params.amount) * 1e7));

  const account = await loadAccountForSoroban(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "create",
        new Address(kp.publicKey()).toScVal(),
        new Address(params.claimantAddress).toScVal(),
        nativeToScVal(amountBigInt, { type: "i128" }),
        new Address(USDC_TOKEN).toScVal(),
        nativeToScVal(params.expiryTimestamp, { type: "u64" }),
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await rpc.prepareTransaction(tx);
  prepared.sign(kp);
  const result = await rpc.sendTransaction(prepared);

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await rpc.getTransaction(result.hash);
    if (status.status === "SUCCESS") {
      const voucherId = result.hash;
      return { voucherId, txHash: result.hash };
    }
    if (status.status === "FAILED") {
      throw new Error(`Transaction failed: ${extractResultXdr(status)}`);
    }
  }

  throw new Error("Transaction timed out waiting for confirmation");
}

// ─── claim_voucher ────────────────────────────────────────────────────────────

export async function sorobanClaimVoucher(params: {
  claimantSecret: string;
  voucherId:      string;
}): Promise<{ txHash: string }> {
  if (MOCK_MODE) {
    throw new Error("Use mock API route in MOCK_MODE");
  }

  const kp = Keypair.fromSecret(params.claimantSecret);
  const rpc = getRpcClient();
  const contract = new Contract(CONTRACT_ADDRESSES.voucher);

  const account = await loadAccountForSoroban(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "claim",
        nativeToScVal(Buffer.from(params.voucherId, "hex"), { type: "bytes" }),
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await rpc.prepareTransaction(tx);
  prepared.sign(kp);
  const result = await rpc.sendTransaction(prepared);

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await rpc.getTransaction(result.hash);
    if (status.status === "SUCCESS") {
      return { txHash: result.hash };
    }
    if (status.status === "FAILED") {
      throw new Error(`Transaction failed: ${extractResultXdr(status)}`);
    }
  }

  throw new Error("Transaction timed out waiting for confirmation");
}

// ─── get_biller (read-only simulation) ────────────────────────────────────────

export async function sorobanGetBiller(
  billerId: string,
): Promise<Record<string, unknown> | null> {
  if (MOCK_MODE) return null;

  try {
    const rpc = getRpcClient();
    const contract = new Contract(CONTRACT_ADDRESSES.billerRegistry);

    // Use a dummy public key for read-only simulation
    const dummyKp = Keypair.random();
    const dummyAccount = await rpc.getAccount(dummyKp.publicKey());

    const tx = new TransactionBuilder(dummyAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "get_biller",
          nativeToScVal(Buffer.from(billerId, "hex"), { type: "bytes" }),
        )
      )
      .setTimeout(30)
      .build();

    const result = await rpc.simulateTransaction(tx);
    if ("result" in result && result.result) {
      return { id: billerId, exists: true };
    }
    return null;
  } catch {
    return null;
  }
}
