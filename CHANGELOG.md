# Changelog

All notable changes to Homebound Remit are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.1.0] — 2025-06-30

### Added
- **Bill Pay flow** — pay rent, school fees, utilities directly to registered billers
- **Cash Transfer** — wallet-to-wallet USDC with real Stellar tx hash
- **Voucher Links** — claimable USDC for walletless recipients (no wallet required)
- **Biller Dashboard** — live incoming payment feed, auto-refreshes every 10s
- **Sender Dashboard** — full transaction history + fee savings tracker
- **FX Rate Mark** — local-currency display (KES, PHP, NGN, GHS, INR, MXN) with 0.5% spread
- **Testnet Faucet** — one-click wallet generation, Friendbot XLM funding, USDC trustline
- **4 seeded billers** — Sunrise Academy, Kenya Power & Light, Manila Heights Landlord, Safaricom
- **3 demo recipients** — Mama Grace 🇰🇪, Tito Santos 🇵🇭, Sister Amara 🇳🇬
- **Soroban contracts** (Rust) — `biller_registry` and `voucher` with clean mock ↔ live seam
- **19-test API suite** — `node scripts/smoke-fast.mjs` covers all routes
- **GitHub Actions CI** — build + typecheck + lint on every push

### Architecture
- Pure keypair implementation (`tweetnacl` + hand-rolled StrKey) — avoids `base32.js` crash in Next.js RSC
- All Horizon queries use native `fetch` — no SDK axios wrapper in Route Handlers
- `globalThis` singletons for in-memory stores — survive hot-reload and RSC module isolation
- `src/lib/constants.ts` — single source of truth for all config values

### Fixed
- `Keypair.fromSecret()` crash in Next.js RSC (`base32.js → new Buffer()`)
- Voucher store state loss between requests (fixed with `globalThis`)
- `Horizon.Server.loadAccount()` RSC incompatibility (replaced with native fetch)
