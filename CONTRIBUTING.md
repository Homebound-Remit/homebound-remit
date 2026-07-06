# Contributing to Homebound Remit

Thanks for your interest in contributing. Homebound Remit is a Stellar-native remittance + bill-pay app — contributions that add corridors, billers, currencies, or improve the UX are especially welcome.

---

## Getting Started

```bash
git clone https://github.com/Homebound-Remit/homebound-remit.git
cd homebound-remit
npm install
npm run dev          # http://localhost:3000
node scripts/smoke-fast.mjs   # run API tests (must be 19/19)
```

---

## Ways to Contribute

### 🌍 Add a new corridor / biller
Add an entry to the seed array in `src/lib/biller/registry.ts`:
```ts
{
  id: "biller_your_name",
  name: "Your Biller Name",
  category: "school" | "utility" | "rent" | "telecom" | "other",
  walletAddress: "G...",  // testnet public key
  country: "Country",
  currency: "XXX",        // ISO 4217 code
  active: true,
  createdAt: new Date().toISOString(),
}
```
Then add the FX rate in `src/lib/fx/rates.ts` if the currency is new.

### 💱 Add a new currency
Add to `BASE_RATES` in `src/lib/fx/rates.ts`:
```ts
XXX: { currency: "XXX", symbol: "X", flag: "🏳", ratePerUSD: 0.0, mark: 0.005 },
```

### 🔧 Fix a bug
1. Open an issue first for non-trivial bugs
2. Branch from `main`
3. Fix + run `node scripts/smoke-fast.mjs` (must stay 19/19)
4. Open a PR

### 📖 Improve documentation
README, inline comments, API docs — all welcome.

---

## Rules

### Import boundaries
```
Browser (client components)     ❌ src/lib/stellar/*
                                ✅ src/lib/fx/rates.ts
                                ✅ src/lib/utils/keys.ts
                                ✅ /api/* routes

Server (API routes / lib)       ✅ Everything
```

### Store pattern
All in-memory stores must use `globalThis` singleton to survive Next.js hot-reload:
```ts
declare global { var __hb_mystore: Map<string, T> | undefined; }
function getStore() {
  if (!globalThis.__hb_mystore) globalThis.__hb_mystore = new Map();
  return globalThis.__hb_mystore;
}
```

### No Keypair in route handlers
`Keypair.fromSecret()` uses `base32.js` which crashes in Next.js RSC. Use `src/lib/stellar/wallet.ts` helpers (pure `tweetnacl` implementation) or call `/api/keygen` from the client.

### Tests must pass
`node scripts/smoke-fast.mjs` must show **19/19 passed** before any PR is merged.

---

## Soroban Contract Upgrade Path

All bill-pay and voucher logic has a clean seam for on-chain contracts:

```ts
// src/lib/soroban/client.ts
export const MOCK_MODE = true;  // flip to false + fill CONTRACT_ADDRESSES
```

If you're deploying the Soroban contracts:
1. Deploy `contracts/biller_registry/` and `contracts/voucher/` to testnet
2. Set `NEXT_PUBLIC_BILLER_REGISTRY_CONTRACT` and `NEXT_PUBLIC_VOUCHER_CONTRACT` in `.env.local`
3. Set `MOCK_MODE = false` in `src/lib/soroban/client.ts`
4. Uncomment the real invocation bodies in that file

---

## Commit Style

```
feat: add NGN corridor with GTBank biller
fix: voucher store state loss across requests
chore: update FX rates for Q3 2025
docs: add setup instructions for Soroban deployment
```

---

## PR Checklist

- [ ] `node scripts/smoke-fast.mjs` passes (19/19)
- [ ] No Stellar SDK imports in client components
- [ ] New stores use `globalThis` singleton
- [ ] Tested in browser at `localhost:3000`
- [ ] CHANGELOG.md updated if user-facing change

---

## Questions

Open a [GitHub Discussion](https://github.com/Homebound-Remit/homebound-remit/discussions) or file an issue with the `question` label.
