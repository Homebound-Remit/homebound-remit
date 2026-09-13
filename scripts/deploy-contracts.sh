#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Homebound — Soroban Contract Deployment Script
# ──────────────────────────────────────────────────────────────────────────────
# Deploys biller_registry and voucher contracts to Stellar testnet.
#
# Prerequisites:
#   1. Install Soroban CLI:  cargo install --locked soroban-cli
#   2. Install Stellar CLI:  cargo install --locked stellar-cli
#   3. Fund a deployer account:  stellar keys generate --network testnet --fund deployer
#
# Usage:
#   bash scripts/deploy-contracts.sh
#
# After deployment, copy the contract addresses into .env.local:
#   NEXT_PUBLIC_BILLER_REGISTRY_CONTRACT=<biller_registry_address>
#   NEXT_PUBLIC_VOUCHER_CONTRACT=<voucher_address>
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

NETWORK="testnet"
SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
USDC_TOKEN="CB64D3G7SM22THDRK5PT25IEDMTKNTY6HNO3VQGQUZRBVJNHQRUW5KIY"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Homebound — Soroban Contract Deployment"
echo " Network: testnet"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Build contracts
echo "→ Building biller_registry..."
cd contracts/biller_registry
soroban contract build
echo "  ✓ biller_registry.wasm built"
cd ../..

echo "→ Building voucher..."
cd contracts/voucher
soroban contract build
echo "  ✓ voucher.wasm built"
cd ../..

# Step 2: Deploy biller_registry
echo ""
echo "→ Deploying biller_registry to testnet..."
BILLER_REGISTRY_ADDR=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/biller_registry.wasm \
  --network $NETWORK \
  --source deployer)
echo "  ✓ biller_registry deployed: $BILLER_REGISTRY_ADDR"

# Step 3: Initialize biller_registry
echo "→ Initializing biller_registry..."
soroban contract invoke \
  --id "$BILLER_REGISTRY_ADDR" \
  --network $NETWORK \
  --source deployer \
  -- initialize \
  --admin deployer
echo "  ✓ biller_registry initialized"

# Step 4: Register seed billers
echo "→ Registering seed billers..."

soroban contract invoke \
  --id "$BILLER_REGISTRY_ADDR" \
  --network $NETWORK \
  --source deployer \
  -- register_biller \
  --name "Sunrise Academy" \
  --category school \
  --wallet_address "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV" \
  --currency KES
echo "  ✓ Sunrise Academy registered"

soroban contract invoke \
  --id "$BILLER_REGISTRY_ADDR" \
  --network $NETWORK \
  --source deployer \
  -- register_biller \
  --name "Kenya Power & Light" \
  --category utility \
  --wallet_address "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV" \
  --currency KES
echo "  ✓ Kenya Power & Light registered"

soroban contract invoke \
  --id "$BILLER_REGISTRY_ADDR" \
  --network $NETWORK \
  --source deployer \
  -- register_biller \
  --name "Manila Heights Landlord" \
  --category rent \
  --wallet_address "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV" \
  --currency PHP
echo "  ✓ Manila Heights Landlord registered"

soroban contract invoke \
  --id "$BILLER_REGISTRY_ADDR" \
  --network $NETWORK \
  --source deployer \
  -- register_biller \
  --name "Safaricom (Airtime)" \
  --category telecom \
  --wallet_address "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV" \
  --currency KES
echo "  ✓ Safaricom registered"

# Step 5: Deploy voucher contract
echo ""
echo "→ Deploying voucher contract to testnet..."
VOUCHER_ADDR=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/voucher.wasm \
  --network $NETWORK \
  --source deployer)
echo "  ✓ voucher deployed: $VOUCHER_ADDR"

# Step 6: Output addresses
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Bill Registry:  $BILLER_REGISTRY_ADDR"
echo "Voucher:        $VOUCHER_ADDR"
echo ""
echo "Add to .env.local:"
echo "  NEXT_PUBLIC_BILLER_REGISTRY_CONTRACT=$BILLER_REGISTRY_ADDR"
echo "  NEXT_PUBLIC_VOUCHER_CONTRACT=$VOUCHER_ADDR"
echo ""
echo "Verify on Stellar Explorer:"
echo "  https://stellar.expert/explorer/testnet/contract/$BILLER_REGISTRY_ADDR"
echo "  https://stellar.expert/explorer/testnet/contract/$VOUCHER_ADDR"
echo ""
echo "Then flip MOCK_MODE to false in src/lib/soroban/client.ts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
