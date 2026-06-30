# Security Policy

## Scope

This is a **testnet-only demo** application. No real funds are involved.

## Reporting a Vulnerability

If you discover a security issue in the codebase (not testnet keys — those are intentionally demo-only):

1. **Do not** open a public GitHub issue
2. Email the maintainers or open a [GitHub Security Advisory](https://github.com/Homebound-Remit/homebound-remit/security/advisories/new)
3. Include steps to reproduce and potential impact

We will respond within 72 hours.

## Known Non-Issues

- Testnet secret keys embedded in demo data — intentional, zero real-world value
- `sodium-native` webpack warnings — cosmetic only, SDK falls back to pure-JS signing
- In-memory stores reset on server restart — by design for demo mode
