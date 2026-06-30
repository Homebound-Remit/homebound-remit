/**
 * Micro self-payment — anchors any operation on-chain with a real tx hash.
 * Cost: 100 stroops (~$0.000001). Used by bill-pay and voucher flows.
 */
import { Asset, Keypair, Memo, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { BASE_FEE, NETWORK_PASSPHRASE } from "@/lib/constants";
import { getServer, loadAccount } from "./horizon";

export interface MicroTxResult {
  txHash: string;
  fee: string;
  ledger: number;
  createdAt: string;
}

export async function sendMicroTx(
  senderSecret: string,
  memoText: string
): Promise<MicroTxResult> {
  const kp      = Keypair.fromSecret(senderSecret);
  const server  = getServer();
  const account = await loadAccount(kp.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: kp.publicKey(),
        asset: Asset.native(),
        amount: "0.0000001",
      })
    )
    .addMemo(Memo.text(memoText.slice(0, 28)))
    .setTimeout(30)
    .build();

  tx.sign(kp);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const r = await server.submitTransaction(tx) as any;
  return {
    txHash:    r.hash,
    fee:       String(Number(r.fee_charged ?? BASE_FEE) / 1e7),
    ledger:    r.ledger ?? 0,
    createdAt: new Date().toISOString(),
  };
}
