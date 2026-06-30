/**
 * Fast smoke test — skips faucet (no testnet calls).
 * Run with: node scripts/smoke-fast.mjs
 */

const BASE = "http://localhost:3000";
let passed = 0; let failed = 0;

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
function assert(c, m) { if (!c) throw new Error(m); }
const get  = (p)    => fetch(`${BASE}${p}`).then(r => r.json());
const post = (p, b) => fetch(`${BASE}${p}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
}).then(r => r.json());

console.log("\n🏠 Homebound Fast Smoke Tests (no testnet)\n");

console.log("Billers:");
let billers = [];
await test("GET /api/billers — 4 seeded billers", async () => {
  const d = await get("/api/billers");
  assert(d.ok && d.billers.length >= 4, `Expected ≥4: ${d.error ?? d.billers.length}`);
  billers = d.billers;
  const cats = billers.map(b => b.category);
  assert(cats.includes("school"),  "Missing school biller");
  assert(cats.includes("utility"), "Missing utility biller");
  assert(cats.includes("rent"),    "Missing rent biller");
  assert(cats.includes("telecom"), "Missing telecom biller");
});

await test("GET /api/billers/[id] — school biller detail", async () => {
  const id = billers.find(b => b.category === "school")?.id;
  const d  = await get(`/api/billers/${id}`);
  assert(d.ok && d.biller.name === "Sunrise Academy", `Wrong biller: ${JSON.stringify(d)}`);
  assert(Array.isArray(d.payments), "payments should be an array");
});

await test("GET /api/billers/nonexistent — 404", async () => {
  const r = await fetch(`${BASE}/api/billers/does_not_exist`);
  assert(r.status === 404, `Expected 404 got ${r.status}`);
});

console.log("\nFX Rates:");
await test("GET /api/rates KES — correct symbol and positive amount", async () => {
  const d = await get("/api/rates?amount=100&currency=KES");
  assert(d.ok, d.error);
  assert(d.preview.formatted.includes("KSh"), "Expected KSh symbol");
  assert(d.preview.localAmount > 10000, "100 USDC should be > 10,000 KES");
  assert(d.preview.markPct === 0.5, "KES mark should be 0.5%");
});

await test("GET /api/rates PHP — correct conversion", async () => {
  const d = await get("/api/rates?amount=50&currency=PHP");
  assert(d.ok && d.preview.formatted.includes("₱"), "Expected ₱ symbol");
});

await test("GET /api/rates NGN — higher mark", async () => {
  const d = await get("/api/rates?amount=100&currency=NGN");
  assert(d.ok && d.preview.markPct === 0.8, "NGN mark should be 0.8%");
});

await test("GET /api/rates — all 7 currencies present", async () => {
  const d = await get("/api/rates?amount=1&currency=USD");
  assert(d.ok && d.rates.length === 7, `Expected 7 rates, got ${d.rates?.length}`);
});

console.log("\nKeypair:");
let kp = null;
await test("GET /api/keygen — valid G/S keypair", async () => {
  const d = await get("/api/keygen");
  assert(d.ok, d.error);
  assert(d.publicKey.startsWith("G") && d.publicKey.length === 56, "Bad public key");
  assert(d.secretKey.startsWith("S") && d.secretKey.length === 56, "Bad secret key");
  kp = d;
});

await test("POST /api/keygen — derives matching public key", async () => {
  const d = await post("/api/keygen", { secret: kp.secretKey });
  assert(d.ok, d.error);
  assert(d.publicKey === kp.publicKey, `Expected ${kp.publicKey} got ${d.publicKey}`);
});

await test("POST /api/keygen — rejects bad secret", async () => {
  const d = await post("/api/keygen", { secret: "not-a-secret" });
  assert(!d.ok, "Should reject invalid secret");
});

console.log("\nPayments feed:");
await test("GET /api/payments — returns array", async () => {
  const d = await get("/api/payments");
  assert(d.ok && Array.isArray(d.payments), "Should return payments array");
});

console.log("\nBill Pay (uses micro-tx on testnet):");
await test("POST /api/send/bill — records payment + real tx hash", async () => {
  const billerId = billers.find(b => b.category === "school")?.id;
  const d = await post("/api/send/bill", {
    senderSecret: kp.secretKey,
    billerId,
    reference: "STU-TEST-001",
    amount: "5",
  });
  assert(d.ok, `Error: ${d.error}`);
  assert(d.txHash?.length > 0,   "txHash missing");
  assert(d.billerName === "Sunrise Academy", "billerName wrong");
  assert(d.reference === "STU-TEST-001",     "reference wrong");
  assert(d.localAmount?.includes("KSh"),     "localAmount should include KSh");
});

await test("POST /api/send/bill — payment appears in biller dashboard", async () => {
  const billerId = billers.find(b => b.category === "school")?.id;
  const d = await get(`/api/billers/${billerId}`);
  assert(d.ok && d.payments.length > 0, "Payment not in biller feed");
  const p = d.payments[0];
  assert(p.status === "confirmed",     "Payment should be confirmed");
  assert(p.reference === "STU-TEST-001", "Wrong reference");
  assert(parseFloat(p.amountUSDC) === 5, "Wrong amount");
});

console.log("\nVoucher:");
let voucherId = null;
await test("POST /api/send/voucher — creates voucher with claim URL", async () => {
  const d = await post("/api/send/voucher", {
    senderSecret: kp.secretKey,
    amount: "8.00",
    memo: "Fast smoke test",
  });
  assert(d.ok, `Error: ${d.error}`);
  assert(d.voucherId?.startsWith("v_"), "Bad voucherId");
  assert(d.claimUrl?.includes("/claim/"), "Bad claimUrl");
  assert(d.txHash?.length > 0, "txHash missing");
  voucherId = d.voucherId;
});

await test("GET /api/voucher/[id] — unclaimed, correct amount", async () => {
  const d = await get(`/api/voucher/${voucherId}`);
  assert(d.ok, d.error);
  assert(d.voucher.status === "unclaimed", `Bad status: ${d.voucher.status}`);
  assert(d.voucher.amountUSDC === "8.00",  `Bad amount: ${d.voucher.amountUSDC}`);
  assert(d.voucher.memo === "Fast smoke test", "Memo mismatch");
  assert(!d.voucher.claimantSecret, "claimantSecret should NOT be exposed via GET");
});

await test("POST /api/voucher/[id] — claims voucher, returns tx hash", async () => {
  const d = await post(`/api/voucher/${voucherId}`, {});
  assert(d.ok, `Claim failed: ${d.error}`);
  assert(d.txHash?.length > 0,       "txHash missing");
  assert(d.claimantPublicKey?.startsWith("G"), "claimantPublicKey missing");
  assert(d.amountUSDC === "8.00",    "amountUSDC mismatch");
  assert(d.claimedAt,                "claimedAt missing");
});

await test("GET /api/voucher/[id] — status is now claimed", async () => {
  const d = await get(`/api/voucher/${voucherId}`);
  assert(d.ok && d.voucher.status === "claimed", `Expected claimed, got ${d.voucher.status}`);
});

await test("POST /api/voucher/[id] — rejects double-claim", async () => {
  const d = await post(`/api/voucher/${voucherId}`, {});
  assert(!d.ok, "Double-claim should be rejected");
  assert(d.error.toLowerCase().includes("claimed"), `Error: ${d.error}`);
});

await test("GET /api/voucher/nonexistent — 404", async () => {
  const r = await fetch(`${BASE}/api/voucher/v_fake_id`);
  assert(r.status === 404, `Expected 404 got ${r.status}`);
});

// ─── Summary ─────────────────────────────────────────────────────────────────
const emoji = failed === 0 ? "🎉" : "⚠ ";
console.log(`\n${"─".repeat(50)}`);
console.log(`  ${emoji} ${passed} passed  ${failed} failed  ${passed + failed} total\n`);
process.exit(failed === 0 ? 0 : 1);
