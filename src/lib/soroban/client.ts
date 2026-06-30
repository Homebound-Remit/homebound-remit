/**
 * Soroban Contract Client Bridge
 * ──────────────────────────────
 * This is the clean seam between the mock API implementation and the real
 * Soroban contracts. Swap MOCK_MODE = false and fill CONTRACT_ADDRESSES
 * to point all bill-pay flows at the on-chain contracts.
 *
 * The interface is identical — the API routes call these functions, not
 * Horizon/mock stores directly.
 */

export const MOCK_MODE = true; // flip to false for mainnet

export const CONTRACT_ADDRESSES = {
  billerRegistry: process.env.NEXT_PUBLIC_BILLER_REGISTRY_CONTRACT ?? "",
  voucher:        process.env.NEXT_PUBLIC_VOUCHER_CONTRACT ?? "",
};

/**
 * pay_bill — Soroban contract call stub.
 *
 * In MOCK_MODE:  delegates to recordPayment() in the registry store.
 * In LIVE mode:  calls the deployed BillerRegistry contract on Stellar testnet.
 *
 * @example
 * // Replace the body of /api/send/bill/route.ts with:
 * const receipt = await sorobanPayBill({
 *   senderSecret, billerId, reference, amount, network: "testnet"
 * });
 */
export async function sorobanPayBill(params: {
  senderSecret: string;
  billerId:     string;
  reference:    string;
  amount:       string;
  network?:     "testnet" | "mainnet";
}): Promise<{ txHash: string; receiptId: string }> {
  if (MOCK_MODE) {
    // Delegate to mock: handled in /api/send/bill route
    throw new Error("Use mock API route in MOCK_MODE");
  }

  // ── Real Soroban path ─────────────────────────────────────────────────────
  // const { SorobanRpc, Contract, nativeToScVal, Keypair, TransactionBuilder } =
  //   await import("@stellar/stellar-sdk");
  //
  // const rpc = new SorobanRpc.Server("https://soroban-testnet.stellar.org");
  // const kp  = Keypair.fromSecret(params.senderSecret);
  // const contract = new Contract(CONTRACT_ADDRESSES.billerRegistry);
  //
  // const tx = new TransactionBuilder(await rpc.getAccount(kp.publicKey()), { fee: "1000" })
  //   .addOperation(contract.call(
  //     "pay_bill",
  //     nativeToScVal(kp.publicKey(), { type: "address" }),
  //     nativeToScVal(params.billerId,  { type: "string" }),
  //     nativeToScVal(params.reference, { type: "string" }),
  //     nativeToScVal(BigInt(Math.round(parseFloat(params.amount) * 1e7)), { type: "i128" }),
  //     nativeToScVal(USDC_CONTRACT_ADDRESS, { type: "address" }),
  //   ))
  //   .setTimeout(30)
  //   .build();
  //
  // const prepared = await rpc.prepareTransaction(tx);
  // prepared.sign(kp);
  // const result = await rpc.sendTransaction(prepared);
  // return { txHash: result.hash, receiptId: result.hash };

  throw new Error("Live Soroban integration not yet configured — set CONTRACT_ADDRESSES");
}

/**
 * create_voucher — Soroban contract call stub.
 */
export async function sorobanCreateVoucher(params: {
  senderSecret:   string;
  claimantAddress:string;
  amount:         string;
  expiryTimestamp:number;
}): Promise<{ voucherId: string; txHash: string }> {
  if (MOCK_MODE) {
    throw new Error("Use mock API route in MOCK_MODE");
  }
  // Stub — see sorobanPayBill for the real implementation pattern
  throw new Error("Live Soroban integration not yet configured");
}
