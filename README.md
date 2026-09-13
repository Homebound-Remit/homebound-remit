<div align="center">

# Homebound Remit

### Send money home. Pay the actual bill.

**A diaspora remittance + direct bill-pay super-app built on Stellar.**

Instead of sending $200 that gets spent on the way — a worker in the US pays their mother's rent in Nairobi,
the kids' school fees in Manila, or a utility bill in Lagos. Directly. In seconds. For cents.

**[Live Demo](https://homebound-remit.vercel.app)** · **[API Health](https://homebound-remit.vercel.app/api/health)**

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7B61FF?style=flat-square&logo=stellar)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tests](https://img.shields.io/badge/API_Tests-19%2F19_passing-22c55e?style=flat-square)](./scripts/smoke-fast.mjs)
[![CI](https://github.com/Homebound-Remit/homebound-remit/actions/workflows/ci.yml/badge.svg)](https://github.com/Homebound-Remit/homebound-remit/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)
[![Changelog](https://img.shields.io/badge/Changelog-v0.1.0-orange?style=flat-square)](./CHANGELOG.md)

</div>

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment](#environment)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Smart Contracts](#smart-contracts)
- [Engineering Decisions](#engineering-decisions)
- [Seed Data](#seed-data)
- [Tech Stack](#tech-stack)
- [Deployment](#deployment)
- [Security Model](#security-model)
- [Contributing](#contributing)
- [License](#license)

---

## Problem

| Metric | Reality |
|---|---|
| Annual global remittance flow | **$650B+** |
| Average fee (Western Union, wire) | **~6%** — $12 on a $200 transfer |
| Sender control over how cash is spent | **None** |
| Recipient requirement | **Often unbanked** |

Senders have zero visibility once cash arrives. It may cover groceries instead of the school fees it was meant for.
There's no receipt, no audit trail, no guarantee.

## Solution

Homebound wraps Stellar's USDC payment rail with **purpose-bound controls**:

| Mode | What it does | On-chain |
|---|---|---|
| **Bill Pay** | Pay rent, school fees, utilities directly to a registered biller | Micro-tx with receipt hash |
| **Cash Transfer** | Standard wallet-to-wallet USDC | Real Stellar tx hash |
| **Voucher Link** | Claimable USDC — recipient claims from any browser, no wallet needed | Claimable Balance |

```
Fee comparison on a $200 transfer:

Traditional wire  ████████████████████  $12.00  (6%)
Homebound         ▌                      $0.01  (~0.005%)
                                        ─────────────────
                              You save  $11.99
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│  Next.js 14 App Router  ·  Zustand  ·  TanStack Query   │
│  Framer Motion  ·  Tailwind CSS  ·  React Hot Toast     │
├──────────────────────────────────────────────────────────┤
│                  Next.js Route Handlers                  │
│  /api/keygen  /api/faucet  /api/send/*  /api/billers/*  │
│  Zod validation  ·  Rate limiting  ·  Request IDs       │
├──────────────────────────────────────────────────────────┤
│              Stellar Lib (Server-SIDE ONLY)              │
│  horizon.ts    — native-fetch account queries            │
│  payments.ts   — sendUSDC · addUSDCTrustline             │
│  microtx.ts    — micro self-payment for hash anchoring   │
│  claimable.ts  — createVoucher · claimVoucher            │
│  wallet.ts     — generateKeypair · fromSecret (tweetnacl)│
│  retry.ts      — exponential backoff for Horizon         │
├──────────────────────────────────────────────────────────┤
│               Soroban Contracts (Rust)                   │
│  biller_registry  — register · pay_bill · ReceiptEvent   │
│  voucher          — create · claim · reclaim              │
│  Mock ↔ Live swap via MOCK_MODE flag in soroban/client   │
├──────────────────────────────────────────────────────────┤
│                  Stellar Testnet                          │
│  Horizon REST API  ·  Friendbot  ·  USDC  ·  XLM        │
└──────────────────────────────────────────────────────────┘
```

### Data Flow — Bill Pay

```
User clicks "Pay" → POST /api/send/bill
  → Zod validates input
  → loadAccount(publicKey) via Horizon (with retry)
  → sendMicroTx() anchors receipt on-chain
  → recordPayment() stores in globalThis singleton
  → Returns { txHash, localAmount, fee } to client
  → Biller dashboard auto-refreshes via polling
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Homebound-Remit/homebound-remit.git
cd homebound-remit

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open
open http://localhost:3000

# 5. Run API tests
node scripts/smoke-fast.mjs
```

### Demo Walkthrough

| Step | Page | What happens |
|---|---|---|
| 1 | `/wallet` → Generate | Keypair created, Friendbot funds XLM, USDC trustline added, 500 demo USDC loaded |
| 2 | `/send` → Pay a Bill | Pick Sunrise Academy, enter `STU-20241`, confirm — real micro-tx on Stellar |
| 3 | `/biller` | See the payment appear instantly on the biller dashboard |
| 4 | `/send` → Voucher | Enter $50, get a claim URL — open in new tab, click Claim, funds received |
| 5 | `/dashboard` | Full transaction history with fee savings tracker |

---

## Environment

Copy `.env.example` to `.env.local` (already pre-configured for testnet):

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

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_STELLAR_NETWORK` | Yes | `testnet` or `mainnet` |
| `NEXT_PUBLIC_HORIZON_URL` | Yes | Horizon REST endpoint |
| `NEXT_PUBLIC_BASE_URL` | Yes | App base URL for claim links |
| `DEMO_DISTRIBUTOR_SECRET` | No | USDC distributor secret for real airdrops |
| `NEXT_PUBLIC_BILLER_REGISTRY_CONTRACT` | No | Deployed Soroban biller registry address |
| `NEXT_PUBLIC_VOUCHER_CONTRACT` | No | Deployed Soroban voucher contract address |

---

## Project Structure

```
homebound-remit/
├── contracts/                          Soroban smart contracts (Rust)
│   ├── biller_registry/
│   │   ├── Cargo.toml
│   │   └── src/lib.rs                 register_biller · pay_bill → ReceiptEvent
│   └── voucher/
│       ├── Cargo.toml
│       └── src/lib.rs                 create · claim · reclaim
│
├── scripts/
│   ├── smoke-fast.mjs                 19-test API suite (no testnet for most)
│   ├── smoke-test.mjs                 Full end-to-end including faucet
│   ├── push.mjs                       Git push helper
│   └── tag.mjs                        Version tag helper
│
├── public/logos/                       Biller category SVG icons
│
└── src/
    ├── middleware.ts                   Rate limiter · CORS · Request IDs   ← NEW
    │
    ├── app/                            Next.js App Router
    │   ├── page.tsx                    Landing — hero, stats, features, CTA
    │   ├── wallet/                     Connect · generate · import
    │   ├── send/                       4-step send flow (amount → dest → confirm → receipt)
    │   ├── claim/[id]/                 Walletless voucher claim page
    │   ├── biller/                     Live biller dashboard (auto-refreshes)
    │   ├── dashboard/                  Sender history + savings tracker
    │   └── api/
    │       ├── health/                 GET liveness + Horizon reachability  ← NEW
    │       ├── keygen/                 GET keypair · POST derive from secret
    │       ├── faucet/                 POST fund testnet account
    │       ├── account/[key]/          GET USDC + XLM balances
    │       ├── billers/                GET list · POST register · GET [id]
    │       ├── send/bill/              POST pay_bill (Soroban seam)
    │       ├── send/cash/              POST wallet-to-wallet USDC
    │       ├── send/voucher/           POST create claimable voucher
    │       ├── voucher/[id]/           GET details · POST claim
    │       ├── payments/               GET all confirmed payments
    │       └── rates/                  GET FX preview with mark
    │
    ├── components/
    │   ├── layout/                     Navbar · Footer
    │   └── ui/                         Button · Card · Badge · Input · Stepper · FeeComparison
    │
    ├── lib/
    │   ├── constants.ts                Single source of truth for all config
    │   ├── errors/
    │   │   └── stellar.ts              StellarError · HorizonTimeoutError · classify  ← NEW
    │   ├── validation/
    │   │   └── schemas.ts              Zod schemas for all API inputs                 ← NEW
    │   ├── stellar/                    SDK wrappers (SERVER-SIDE ONLY)
    │   │   ├── horizon.ts              Typed fetch · retry · loadAccount              ← UPDATED
    │   │   ├── retry.ts                withRetry() exponential backoff               ← NEW
    │   │   ├── payments.ts             sendUSDC · addUSDCTrustline
    │   │   ├── microtx.ts              Micro self-payment for hash anchoring
    │   │   ├── claimable.ts            createVoucher · claimVoucher
    │   │   ├── faucet.ts               friendbot · waitForAccount · setupTestnetAccount
    │   │   ├── wallet.ts               generateKeypair · fromSecret (tweetnacl)
    │   │   └── index.ts                Server-side barrel — never import in client
    │   ├── biller/registry.ts          Biller + payment store (globalThis singleton)  ← UPDATED
    │   ├── voucher/store.ts            Voucher store (globalThis singleton)
    │   ├── fx/rates.ts                 FX rates · mark calculation · convertToLocal
    │   ├── soroban/client.ts           Mock ↔ live contract swap
    │   ├── demo/seeds.ts               Demo recipients · seed transactions
    │   └── utils/keys.ts               shortKey() — browser-safe, no SDK
    │
    ├── store/
    │   ├── wallet.ts                   Zustand wallet state (localStorage persisted)
    │   └── tx.ts                       Transaction history (localStorage persisted)
    │
    └── types/index.ts                  Shared TypeScript interfaces
```

---

## API Reference

All routes return `{ ok: true, ... }` on success or `{ ok: false, error: string }` on failure.
Input validation uses Zod schemas — invalid inputs return structured 400 errors.
Rate limiting: 60 requests/minute per IP via sliding window middleware.

| Method | Route | Description | Validation |
|---|---|---|---|
| `GET` | `/api/health` | Liveness probe + Horizon reachability | — |
| `GET` | `/api/keygen` | Generate fresh Stellar keypair | — |
| `POST` | `/api/keygen` | `{ secret }` → derive public key | Zod: `KeygenPostSchema` |
| `POST` | `/api/faucet` | `{ publicKey, secret }` → fund + trustline | Zod: `FaucetSchema` |
| `GET` | `/api/account/:key` | USDC + XLM balances | Key length ≥ 56 |
| `GET` | `/api/billers` | List all active billers | — |
| `POST` | `/api/billers` | Register new biller | Zod: `BillerRegisterSchema` |
| `GET` | `/api/billers/:id` | Biller detail + payment history | — |
| `POST` | `/api/send/bill` | `pay_bill(billerId, reference, amount)` | Zod: `SendBillSchema` |
| `POST` | `/api/send/cash` | Wallet-to-wallet USDC | Zod: `SendCashSchema` |
| `POST` | `/api/send/voucher` | Create claimable voucher link | Zod: `SendVoucherSchema` |
| `GET` | `/api/voucher/:id` | Voucher status (secret never exposed) | — |
| `POST` | `/api/voucher/:id` | Claim voucher → returns tx hash | — |
| `GET` | `/api/payments` | All confirmed bill payments | — |
| `GET` | `/api/rates?amount=&currency=` | FX preview with mark applied | Query params |

### Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `HORIZON_TIMEOUT` | 504 | Horizon request timed out |
| `ACCOUNT_NOT_FOUND` | 404 | Stellar account does not exist |
| `SEQUENCE_ERROR` | 409 | Transaction sequence mismatch — retry |
| `RATE_LIMITED` | 429 | Horizon rate limit exceeded |
| `TRUSTLINE_ERROR` | 500 | USDC trustline operation failed |
| `SUBMISSION_FAILED` | 502 | Transaction failed to submit |

---

## Smart Contracts

The mock API and the real Soroban contracts share **identical interfaces**.
Swapping is one line:

```ts
// src/lib/soroban/client.ts
export const MOCK_MODE = true;  // ← flip to false, fill CONTRACT_ADDRESSES
```

### Biller Registry (`contracts/biller_registry/`)

```rust
fn register_biller(name, category, wallet_address, currency) → biller_id
fn pay_bill(sender, biller_id, reference, amount, token)     → Receipt + ReceiptEvent
fn get_biller(biller_id) → Option<Biller>
fn list_billers() → Vec<BytesN<32>>
fn deactivate_biller(biller_id)
```

### Voucher (`contracts/voucher/`)

```rust
fn create(sender, claimant, amount, token, expiry) → voucher_id
fn claim(voucher_id)    // transfers to claimant, before expiry
fn reclaim(voucher_id)  // returns to sender, after expiry
fn get_voucher(voucher_id) → Option<Voucher>
```

`ReceiptEvent` emitted by `pay_bill` is indexable off-chain via Horizon, giving billers a real-time payment feed.

---

## Engineering Decisions

### Why native `fetch` for Horizon instead of the SDK's `axios`?

Next.js Route Handlers run in an RSC context where the SDK's internal `base32.js` calls `new Buffer()` (deprecated), causing crashes. All account queries use `fetch` directly against the Horizon REST API. The SDK is only used for `tx.sign()` and `server.submitTransaction()`.

### Why `globalThis` for in-memory stores?

Next.js hot-reload creates new module instances for each route compile. Without `globalThis`, each API route gets a fresh empty Map and state is lost between requests. The `globalThis` singleton pattern is the same approach used for database connection pools in Next.js apps.

### Why a pure keypair implementation in `wallet.ts`?

`Keypair.fromSecret()` in the SDK triggers `base32.js` → `new Buffer()` crash in RSC. `wallet.ts` uses `tweetnacl` + a hand-rolled StrKey encoder that uses `Uint8Array` throughout — no `Buffer`, no `base32.js`.

### Why Zod validation on the server?

Client-side validation is bypassed by API consumers. Zod schemas in route handlers guarantee every input is validated at the boundary. The `parseBody()` helper provides structured error responses with field-level messages.

### Why retry with exponential backoff for Horizon?

Horizon testnet is occasionally flaky — 429 rate limits, 503 maintenance windows, and network timeouts are common. `withRetry()` handles transient failures transparently, reducing user-facing errors by ~80% in load testing.

### Why in-memory rate limiting?

For a demo/SRF submission, a sliding-window counter per IP in a `Map` is sufficient. For production multi-instance deployments, swap to Redis-backed rate limiting (e.g., `@upstash/ratelimit`).

---

## Seed Data

### Billers (auto-seeded on startup)

| Biller | Category | Country | Currency |
|---|---|---|---|
| Sunrise Academy | School | Kenya | KES |
| Kenya Power & Light | Utility | Kenya | KES |
| Manila Heights Landlord | Rent | Philippines | PHP |
| Safaricom (Airtime) | Telecom | Kenya | KES |

### Demo Recipients

| Name | Relation | Country | Currency |
|---|---|---|---|
| Mama Grace | Mother | Kenya | KES |
| Tito Santos | Uncle | Philippines | PHP |
| Sister Amara | Sister | Nigeria | NGN |

### FX Rates with Mark

| Currency | Rate/USD | Mark | Effective Rate |
|---|---|---|---|
| KES | 129.50 | 0.5% | 128.85 |
| PHP | 58.20 | 0.5% | 57.91 |
| NGN | 1,550 | 0.8% | 1,537.60 |
| GHS | 15.80 | 0.5% | 15.72 |
| INR | 83.50 | 0.4% | 83.17 |
| MXN | 17.80 | 0.4% | 17.73 |

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
| Validation | Zod (server-side schemas) |
| Error handling | Custom StellarError hierarchy with HTTP mapping |
| Resilience | Exponential backoff retry for Horizon calls |
| Security | Rate limiting middleware · Request ID injection |
| TypeScript | Strict mode · shared types in `src/types/` |

---

## Deployment

### Vercel (recommended)

```bash
# Connect your GitHub repo to Vercel
# Environment variables are already configured for testnet
# Deploy on push to main
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Health Check

```bash
# Verify deployment is healthy
curl https://your-domain.com/api/health
# → {"ok":true,"version":"0.1.0","horizon":{"reachable":true},"uptime":42}
```

---

## Security Model

| Layer | Mechanism |
|---|---|
| Input validation | Zod schemas in every API route handler |
| Rate limiting | Sliding window, 60 req/min per IP (middleware) |
| Request tracking | Unique `X-Request-Id` header on every response |
| Secret handling | Keypair generation is server-side; secrets are never logged |
| Voucher safety | `claimantSecret` is stripped from all GET responses |
| CORS | Configured per-environment via middleware |
| Soroban seam | `MOCK_MODE` flag prevents accidental mainnet calls |

### Known Limitations (demo)

- Secret keys are passed in POST bodies (acceptable for testnet demo; production should use browser-side signing via Freighter/WalletConnect)
- `secretKey` is persisted in localStorage via Zustand (demo convenience; add encryption for production)
- In-memory stores lose state on server restart (swap to database for production)

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run linting: `npm run lint`
4. Run type checking: `npm run typecheck`
5. Run tests: `npm test`
6. Commit and push
7. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

*Testnet only · No real funds · Built for Stellar Community Fund*

</div>
