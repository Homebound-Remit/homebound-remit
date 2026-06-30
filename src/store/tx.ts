import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TxType = "cash" | "bill_pay" | "voucher";
export type TxStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "confirmed"
  | "failed";

export interface Transaction {
  id: string;
  type: TxType;
  amountUSDC: string;
  memo?: string;
  recipientPublicKey?: string;
  recipientName?: string;
  billerId?: string;
  billerName?: string;
  reference?: string;
  txHash?: string;
  voucherId?: string;
  claimUrl?: string;
  fee?: string;
  currency?: string;
  localAmount?: string;
  createdAt: string;
  status: "confirmed" | "failed";
}

interface TxState {
  history: Transaction[];
  pendingStatus: TxStatus;
  pendingStep: string;

  addTx: (tx: Transaction) => void;
  setStatus: (status: TxStatus, step?: string) => void;
  reset: () => void;
  clearHistory: () => void;
}

export const useTxStore = create<TxState>()(
  persist(
    (set) => ({
      history: [],
      pendingStatus: "idle",
      pendingStep: "",

      addTx: (tx) =>
        set((s) => ({
          history: [tx, ...s.history].slice(0, 100),
        })),

      setStatus: (status, step = "") =>
        set({ pendingStatus: status, pendingStep: step }),

      reset: () =>
        set({ pendingStatus: "idle", pendingStep: "" }),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "homebound-tx-history",
      partialize: (s) => ({ history: s.history }),
    }
  )
);
