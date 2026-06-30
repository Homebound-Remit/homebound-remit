/**
 * Demo seed data — pre-configured recipients and funded demo wallets.
 * The sender demo account is funded by Friendbot on first load.
 */

export interface DemoRecipient {
  id: string;
  name: string;
  relation: string;
  country: string;
  flag: string;
  currency: string;
  publicKey: string; // testnet key
  avatar: string;
}

export const DEMO_RECIPIENTS: DemoRecipient[] = [
  {
    id: "recipient_mama_grace",
    name: "Mama Grace",
    relation: "Mother",
    country: "Kenya",
    flag: "🇰🇪",
    currency: "KES",
    publicKey: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV",
    avatar: "👩🏾",
  },
  {
    id: "recipient_tito_santos",
    name: "Tito Santos",
    relation: "Uncle",
    country: "Philippines",
    flag: "🇵🇭",
    currency: "PHP",
    publicKey: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV",
    avatar: "👴🏽",
  },
  {
    id: "recipient_sister_amara",
    name: "Sister Amara",
    relation: "Sister",
    country: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    publicKey: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV",
    avatar: "👩🏿",
  },
];

export const DEMO_TRANSACTIONS = [
  {
    id: "demo_tx_1",
    type: "bill_pay",
    billerName: "Sunrise Academy",
    billerCategory: "school",
    amount: "85.00",
    currency: "KES",
    reference: "STU-20241",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "confirmed",
    fee: "0.01",
  },
  {
    id: "demo_tx_2",
    type: "cash",
    recipient: "Mama Grace",
    amount: "50.00",
    currency: "KES",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "confirmed",
    fee: "0.01",
  },
  {
    id: "demo_tx_3",
    type: "bill_pay",
    billerName: "Kenya Power & Light",
    billerCategory: "utility",
    amount: "30.00",
    currency: "KES",
    reference: "ACCT-55892",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "confirmed",
    fee: "0.01",
  },
];
