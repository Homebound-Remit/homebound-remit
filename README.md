<div align="center">

# 🏠 Homebound

### Send money home. Pay the actual bill.

**A diaspora remittance + direct bill-pay super-app built on Stellar.**

Instead of sending $200 that gets spent on the way — a worker in the US pays their mother's rent in Nairobi, the kids' school fees in Manila, or a utility bill in Lagos. Directly. In seconds. For cents.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7B61FF?style=flat-square&logo=stellar)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/API_Tests-19%2F19_passing-22c55e?style=flat-square)](./scripts/smoke-fast.mjs)

</div>

---

## The Problem

| | Reality |
|---|---|
| Annual remittance flow | **$650B+** |
| Average fee (Western Union, wire) | **~6%** — $12 on a $200 transfer |
| Sender control over how cash is spent | **None** |
| Recipient requirement | **Often unbanked** |

Senders have zero visibility once cash arrives. It may cover groceries instead of the school fees it was meant for. There's no receipt, no audit trail, no guarantee.

## The Solution

Homebound wraps Stellar's USDC payment rail with **purpose-bound controls**:

| Mode | What it does |
|---|---|
| 🏦 **Bill Pay** | Pay rent, school fees, utilities directly to a registered biller — the biller gets notified instantly |
| 💸 **Cash Transfer** | Standard wallet-to-wallet USDC with a real Stellar tx hash |
| 🎟 **Voucher Link** | Claimable USDC link — recipient claims from any browser, no wallet required |

**Fee comparison on a $200 transfer:**

```
Traditional wire  ████████████████████  $12.00  (6%)
Homebound         ▌                      $0.01  (~0.005%)
                                        ─────────────────
                              You save  $11.99
```

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Start dev server
npm run dev

# 3. Open
open http://localhost:3000

# 4. Run API tests (optional)
node scripts/smoke-fast.mjs
```

**Environment** (`.env.local` — already pre-configured for testnet):
```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: pre-funded USDC distributor for real airdrops
DEMO_DISTRIBUTOR_SECRET=

# Optional: deployed Soroban contracts (mainnet upgrade)
NEXT_PUBLIC_BILLER_REGISTRY_CONTRACT=
NEXT_PUBLIC_VOUCHER_CONTRACT=
```

---

## Demo Walkthrough

### 1 — Get a wallet

Go to `/wallet` → **Generate & Fund Wallet**

- Generates a real Stellar testnet keypair
- Calls Friendbot to fund with XLM
- Adds a USDC trustline
- Loads **500 demo USDC** for exploration
- Takes ~10s (Friendbot round-trip)

### 2 — Pay a bill

Go to `/send` → **Pay a Bill** → pick **Sunrise Academy**

- Enter reference: `STU-20241`
- Confirm — a real Stellar micro-tx anchors the receipt on-chain
- Sender sees: tx hash, KSh local amount, fee savings vs 6%
- Go to `/biller` → **Sunrise Academy** shows the payment instantly

### 3 — Send a voucher (walletless)

Go to `/send` → **Voucher Link** → enter $50

- Generates a claim URL like `http://localhost:3000/claim/v_...`
- Open the URL in a new tab (simulates the recipient's phone)
- Click **Claim** — funds are received without ever creating a wallet
- The claim is anchored on Stellar with a real tx hash

---

## Project Structure

```
HOMEBOUND/
│
├── contracts/                     Soroban smart contracts (Rust)
│   ├── biller_registry/           register_biller · pay_bill → ReceiptEvent
│   └── voucher/                   create · claim · reclaim
│
├── scripts/
│   ├── smoke-fast.mjs             19-test API suite (no testnet needed for most)
│   └── smoke-test.mjs             Full end-to-end including faucet
│
├── public/logos/                  Biller category SVG icons
│
└── src/
    ├── app/                       Next.js App Router
    │   ├── page.tsx               Landing — hero, stats, features, CTA
    │   ├── wallet/                Connect · generate · import
    │   ├── send/                  4-step send flow (amount → dest → confirm → receipt)
    │   ├── claim/[id]/            Walletless voucher claim page
    │   ├── biller/                Live biller dashboard (auto-refreshes)
    │   ├── dashboard/             Sender history + savings tracker
    │   └── api/
    │       ├── keygen/            GET keypair · POST derive from secret
    │       ├── faucet/            POST fund testnet account
    │       ├── account/[key]/     GET USDC + XLM balances
    │       ├── billers/           GET list · POST register · GET [id]
    │       ├── send/bill/         POST pay_bill (Soroban seam)
    │       ├── send/cash/         POST wallet-to-wallet USDC
    │       ├── send/voucher/      POST create claimable voucher
    │       ├── voucher/[id]/      GET details · POST claim
    │       ├── payments/          GET all confirmed payments
    │       └── rates/             GET FX preview with mark
    │
    ├── components/
    │   ├── layout/                Navbar · Footer
    │   └── ui/                    Button · Card · Badge · Input · Stepper · FeeComparison
    │
    ├── lib/
    │   ├── constants.ts           ← Single source of truth for all config values
    │   ├── stellar/               SDK wrappers (SERVER-SIDE ONLY)
    │   │   ├── horizon.ts         Native-fetch account queries + tx submission
    │   │   ├── payments.ts        sendUSDC · addUSDCTrustline
    │   │   ├── microtx.ts         Micro self-payment for on-chain hash anchoring
    │   │   ├── claimable.ts       createVoucher · claimVoucher · reclaimVoucher
    │   │   ├── faucet.ts          friendbot · waitForAccount · setupTestnetAccount
    │   │   ├── wallet.ts          generateKeypair · fromSecret (pure, no base32.js)
    │   │   └── index.ts           Server-side barrel — ⚠ never import in client
    │   ├── biller/registry.ts     Biller + payment store (globalThis singleton)
    │   ├── voucher/store.ts       Voucher store (globalThis singleton)
    │   ├── fx/rates.ts            FX rates · mark calculation · convertToLocal
    │   ├── soroban/client.ts      Mock ↔ live contract swap (flip MOCK_MODE)
    │   ├── demo/seeds.ts          Demo recipients · seed transactions
    │   └── utils/keys.ts          shortKey() — browser-safe, no SDK
    │
    ├── store/
    │   ├── wallet.ts              Zustand wallet state (localStorage persisted)
    │   └── tx.ts                  Transaction history (localStorage persisted)
    │
    └── types/index.ts             Shared TypeScript interfaces
```

---

## API Reference

All routes return `{ ok: true, ... }` on success or `{ ok: false, error: string }` on failure.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/keygen` | Generate fresh Stellar keypair |
| `POST` | `/api/keygen` | `{ secret }` → derive public key |
| `POST` | `/api/faucet` | `{ publicKey, secret }` → fund + trustline |
| `GET` | `/api/account/:key` | USDC + XLM balances |
| `GET` | `/api/billers` | List all active billers |
| `POST` | `/api/billers` | Register new biller |
| `GET` | `/api/billers/:id` | Biller detail + payment history |
| `POST` | `/api/send/bill` | `pay_bill(billerId, reference, amount)` |
| `POST` | `/api/send/cash` | Wallet-to-wallet USDC |
| `POST` | `/api/send/voucher` | Create claimable voucher link |
| `GET` | `/api/voucher/:id` | Voucher status (secret never exposed) |
| `POST` | `/api/voucher/:id` | Claim voucher → returns tx hash |
| `GET` | `/api/payments` | All confirmed bill payments |
| `GET` | `/api/rates?amount=&currency=` | FX preview with 0.5% mark applied |

---

## Soroban Contract Architecture

The mock API and the real Soroban contracts share **identical interfaces**. Swapping is one line:

```ts
// src/lib/soroban/client.ts
export const MOCK_MODE = true;  // ← flip to false, fill CONTRACT_ADDRESSES
```

**Biller Registry contract** (`contracts/biller_registry/`):
```rust
fn register_biller(name, category, wallet_address, currency) → biller_id
fn pay_bill(sender, biller_id, reference, amount, token)     → Receipt + ReceiptEvent
fn get_biller(biller_id) → Option<Biller>
fn list_billers() → Vec<BytesN<32>>
fn deactivate_biller(biller_id)
```

**Voucher contract** (`contracts/voucher/`):
```rust
fn create(sender, claimant, amount, token, expiry) → voucher_id
fn claim(voucher_id)    // transfers to claimant, before expiry
fn reclaim(voucher_id)  // returns to sender, after expiry
fn get_voucher(voucher_id) → Option<Voucher>
```

`ReceiptEvent` emitted by `pay_bill` is indexable off-chain via Horizon, giving billers a real-time feed without polling.

---

## Seed Data

**Billers (auto-seeded on startup):**

| Biller | Category | Country | Currency |
|---|---|---|---|
| Sunrise Academy | 🎓 school | Kenya | KES |
| Kenya Power & Light | 💡 utility | Kenya | KES |
| Manila Heights Landlord | 🏠 rent | Philippines | PHP |
| Safaricom (Airtime) | 📱 telecom | Kenya | KES |

**Demo recipients:** Mama Grace 🇰🇪 · Tito Santos 🇵🇭 · Sister Amara 🇳🇬

**FX rates with mark** (real integration: SEP-38 oracle or Stellar DEX):

| Currency | Rate | Mark |
|---|---|---|
| 🇰🇪 KES | 129.50/USD | 0.5% |
| 🇵🇭 PHP | 58.20/USD | 0.5% |
| 🇳🇬 NGN | 1,550/USD | 0.8% |
| 🇬🇭 GHS | 15.80/USD | 0.5% |
| 🇮🇳 INR | 83.50/USD | 0.4% |
| 🇲🇽 MXN | 17.80/USD | 0.4% |

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router, Route Handlers) |
| Blockchain | Stellar testnet · USDC · `@stellar/stellar-sdk` v12 |
| Smart contracts | Soroban (Rust) — `biller_registry` + `voucher` |
| State | Zustand — wallet + tx history (localStorage) |
| Styling | Tailwind CSS v3 · dark theme |
| Animation | Framer Motion |
| Notifications | React Hot Toast |
| Data fetching | TanStack Query |
| TypeScript | Strict mode · shared types in `src/types/` |

---

## Key Engineering Decisions

**Why native `fetch` for Horizon queries instead of the SDK's `axios`?**
Next.js Route Handlers run in an RSC context where the SDK's internal `base32.js` calls `new Buffer()` (deprecated), causing crashes. All account queries use `fetch` directly against the Horizon REST API. The SDK is only used for `tx.sign()` and `server.submitTransaction()`.

**Why `globalThis` for in-memory stores?**
Next.js hot-reload creates new module instances for each route compile. Without `globalThis`, each API route gets a fresh empty Map and state is lost between requests. The `globalThis` singleton pattern is the same approach used for database connection pools in Next.js apps.

**Why a pure keypair implementation in `wallet.ts`?**
`Keypair.fromSecret()` in the SDK triggers `base32.js` → `new Buffer()` crash in RSC. `wallet.ts` uses `tweetnacl` + a hand-rolled StrKey encoder that uses `Uint8Array` throughout — no `Buffer`, no `base32.js`.

---

## SCF Pitch Notes

- **$650B market** — Stellar's headline real-world use case
- **Novel twist** — purpose-bound money: $150 pays "Mom's rent", not groceries
- **Social impact** — school fees, utilities, rent that *actually arrive*
- **Walletless UX** — voucher links eliminate the biggest adoption barrier for unbanked recipients
- **Transparent economics** — $0.01 vs $12. Impossible to ignore on a demo slide
- **Clean upgrade path** — one flag separates mock demo from live Soroban mainnet

---

<div align="center">

*Testnet only · No real funds · Built for Stellar Community Fund*

</div>
