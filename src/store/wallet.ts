import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WalletState {
  publicKey: string | null;
  secretKey: string | null;
  usdcBalance: string;
  xlmBalance: string;
  isConnected: boolean;
  isLoading: boolean;
  useDemoBalance: boolean;

  setWallet: (pub: string, sec: string) => void;
  setBalances: (usdc: string, xlm: string) => void;
  setDemoBalance: (balance: string) => void;
  setLoading: (v: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      publicKey: null,
      secretKey: null,
      usdcBalance: "0",
      xlmBalance: "0",
      isConnected: false,
      isLoading: false,
      useDemoBalance: false,

      setWallet: (pub, sec) =>
        set({ publicKey: pub, secretKey: sec, isConnected: true }),

      setBalances: (usdc, xlm) =>
        set({ usdcBalance: usdc, xlmBalance: xlm }),

      setDemoBalance: (balance: string) =>
        set({ usdcBalance: balance, useDemoBalance: true }),

      setLoading: (v) => set({ isLoading: v }),

      disconnect: () =>
        set({
          publicKey: null,
          secretKey: null,
          usdcBalance: "0",
          xlmBalance: "0",
          isConnected: false,
          useDemoBalance: false,
        }),
    }),
    {
      name: "homebound-wallet",
      partialize: (s) => ({
        publicKey: s.publicKey,
        secretKey: s.secretKey,
        isConnected: s.isConnected,
        usdcBalance: s.usdcBalance,
        xlmBalance: s.xlmBalance,
        useDemoBalance: s.useDemoBalance,
      }),
    }
  )
);
