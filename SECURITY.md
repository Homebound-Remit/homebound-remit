# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Yes     |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report security issues by emailing the maintainers directly or opening a
[GitHub Security Advisory](https://github.com/Homebound-Remit/homebound-remit/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

You will receive a response within 48 hours.

## Scope

This is a **testnet demo application**. It handles no real funds.

The following are explicitly **out of scope** for this demo:
- Secret keys stored in `localStorage` (demo only — production would use a hardware wallet or SEP-30)
- In-memory stores reset on server restart (production would use a database)
- No rate limiting on API routes (demo only)

For production deployments, these concerns must be addressed before handling real funds.
