/**
 * Homebound smoke test — run with: node scripts/smoke-test.mjs
 * Tests every API route end-to-end against the running dev server.
 */

const BASE = "http://localhost:3000";
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌  ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  return r.json();
}

console.log("\n🏠 Homebound Smoke Tests\n");

// ─── Billers ────────────────────────────────────────────────────────────────
console.log("Billers:");
let billers = [];
await test("GET /api/billers returns seeded data", async () => {
  const d = await get("/api/billers");
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.billers.length >= 4, `Expected ≥4 billers, got ${d.billers.length}`);
  billers = d.billers;
});

await test("GET /api/billers/[id] returns biller + payments", async () => {
  const id = billers[0]?.id;
  assert(id, "No biller id");
  const d = await get(`/api/billers/${id}`);
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.biller.id === id, "Biller id mismatch");
});

// ─── Rates ──────────────────────────────────────────────────────────────────
console.log("\nFX Rates:");
await test("GET /api/rates?amount=100&currency=KES", async () => {
  const d = await get("/api/rates?amount=100&currency=KES");
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.preview.localAmount > 0, "localAmount should be > 0");
  assert(d.preview.formatted.includes("KSh"), "formatted should include KSh");
});

await test("GET /api/rates?amount=150&currency=PHP", async () => {
  const d = await get("/api/rates?amount=150&currency=PHP");
  assert(d.ok && d.preview.localAmount > 0, "PHP rate failed");
});

// ─── Keygen ─────────────────────────────────────────────────────────────────
console.log("\nKeypair:");
let kp = null;
await test("GET /api/keygen generates valid Stellar keypair", async () => {
  const d = await get("/api/keygen");
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.publicKey.startsWith("G"), "Public key must start with G");
  assert(d.secretKey.startsWith("S"), "Secret key must start with S");
  assert(d.publicKey.length === 56, "Public key must be 56 chars");
  kp = d;
});

await test("POST /api/keygen derives public key from secret", async () => {
  const d = await post("/api/keygen", { secret: kp.secretKey });
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.publicKey === kp.publicKey, "Derived public key mismatch");
});

// ─── Faucet ──────────────────────────────────────────────────────────────────
console.log("\nFaucet (calls Stellar testnet — may take ~15s):");
await test("POST /api/faucet funds account + adds USDC trustline", async () => {
  const d = await post("/api/faucet", {
    publicKey: kp.publicKey,
    secret: kp.secretKey,
  });
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.funded === true, "funded should be true");
  assert(d.trustlineAdded === true, "trustlineAdded should be true");
  assert(d.useDemoBalance === true, "useDemoBalance should be true");
  assert(d.demoBalance === "500.00", "demoBalance should be 500.00");
});

// ─── Account balances ────────────────────────────────────────────────────────
console.log("\nAccount:");
await test("GET /api/account/[key] returns balances after funding", async () => {
  const d = await get(`/api/account/${kp.publicKey}`);
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.exists === true, "Account should exist after faucet");
  assert(parseFloat(d.xlm) > 0, "XLM balance should be > 0 after funding");
});

// ─── Bill pay ─────────────────────────────────────────────────────────────────
console.log("\nBill Pay:");
let billTxHash = null;
await test("POST /api/send/bill records payment + returns tx hash", async () => {
  const billerId = billers.find(b => b.category === "school")?.id;
  assert(billerId, "No school biller found");
  const d = await post("/api/send/bill", {
    senderSecret: kp.secretKey,
    billerId,
    reference: "STU-SMOKE-001",
    amount: "10",
  });
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.txHash, "txHash missing");
  assert(d.billerName, "billerName missing");
  assert(d.localAmount, "localAmount missing");
  billTxHash = d.txHash;
});

await test("GET /api/payments shows bill payment", async () => {
  const d = await get("/api/payments");
  assert(d.ok, `ok=false: ${d.error}`);
  const found = d.payments.find(p => p.reference === "STU-SMOKE-001");
  assert(found, "Payment not found in /api/payments");
  assert(found.status === "confirmed", "Payment status should be confirmed");
});

await test("GET /api/billers/[id] shows payment in dashboard feed", async () => {
  const billerId = billers.find(b => b.category === "school")?.id;
  const d = await get(`/api/billers/${billerId}`);
  assert(d.ok && d.payments.length > 0, "No payments on biller dashboard");
});

// ─── Cash send ───────────────────────────────────────────────────────────────
console.log("\nCash Transfer:");
await test("POST /api/send/cash returns tx hash (demo mode)", async () => {
  const d = await post("/api/send/cash", {
    senderSecret: kp.secretKey,
    recipientPublicKey: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBEWF34RDIVZ1SDXRPASV",
    amount: "5",
    memo: "Smoke test cash",
  });
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.txHash, "txHash missing");
});

// ─── Voucher ─────────────────────────────────────────────────────────────────
console.log("\nVoucher:");
let voucherId = null;
let claimUrl  = null;
await test("POST /api/send/voucher creates claimable voucher", async () => {
  const d = await post("/api/send/voucher", {
    senderSecret: kp.secretKey,
    amount: "7.50",
    memo: "Smoke test voucher",
  });
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.voucherId, "voucherId missing");
  assert(d.claimUrl,  "claimUrl missing");
  assert(d.txHash,    "txHash missing");
  voucherId = d.voucherId;
  claimUrl  = d.claimUrl;
});

await test("GET /api/voucher/[id] returns unclaimed voucher", async () => {
  const d = await get(`/api/voucher/${voucherId}`);
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.voucher.status === "unclaimed", "Status should be unclaimed");
  assert(d.voucher.amountUSDC === "7.50", "Amount mismatch");
});

await test("POST /api/voucher/[id] claims the voucher", async () => {
  const d = await post(`/api/voucher/${voucherId}`, {});
  assert(d.ok, `ok=false: ${d.error}`);
  assert(d.txHash, "txHash missing after claim");
  assert(d.claimantPublicKey, "claimantPublicKey missing");
});

await test("POST /api/voucher/[id] rejects double-claim", async () => {
  const d = await post(`/api/voucher/${voucherId}`, {});
  assert(!d.ok, "Should reject double-claim");
  assert(d.error.toLowerCase().includes("claimed"), "Error should mention claimed");
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(45)}`);
console.log(`  Passed: ${passed}   Failed: ${failed}   Total: ${passed + failed}`);
if (failed === 0) {
  console.log("  🎉 All tests passed!\n");
  process.exit(0);
} else {
  console.log("  ⚠  Some tests failed.\n");
  process.exit(1);
}
