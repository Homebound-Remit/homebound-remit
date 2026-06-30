"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletStore } from "@/store/wallet";
import { useTxStore } from "@/store/tx";
import { Stepper } from "@/components/ui/Stepper";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { FeeComparison } from "@/components/ui/FeeComparison";
import { convertToLocal } from "@/lib/fx/rates";
import { DEMO_RECIPIENTS } from "@/lib/demo/seeds";
import {
  Send, Wallet, Building2, Users, Link2,
  ArrowRight, CheckCircle2, Copy, ExternalLink,
  AlertTriangle, Receipt,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type SendMode = "bill_pay" | "cash" | "voucher";

interface Biller {
  id: string;
  name: string;
  category: string;
  currency: string;
  country: string;
}

const STEPS = [
  { label: "Amount" },
  { label: "Destination" },
  { label: "Confirm" },
  { label: "Receipt" },
];

const CATEGORY_EMOJI: Record<string, string> = {
  school: "🎓", utility: "💡", rent: "🏠", telecom: "📱", other: "🏢",
};

const SLIDE = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit:  { opacity: 0, x: -30 },
};

export default function SendPage() {
  const { publicKey, secretKey, usdcBalance, isConnected, setBalances, xlmBalance, useDemoBalance } =
    useWalletStore();
  const { addTx, setStatus, reset, pendingStatus, pendingStep } = useTxStore();

  const [step, setStep]                     = useState(0);
  const [mode, setMode]                     = useState<SendMode>("bill_pay");
  const [amount, setAmount]                 = useState("");
  const [billers, setBillers]               = useState<Biller[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [reference, setReference]           = useState("");
  const [selectedRecipient, setSelectedRecipient] =
    useState<typeof DEMO_RECIPIENTS[0] | null>(null);
  const [manualKey, setManualKey]           = useState("");
  const [memo, setMemo]                     = useState("");
  const [receipt, setReceipt]               = useState<{
    txHash?: string; voucherId?: string; claimUrl?: string;
    fee: string; localAmount: string; currency: string;
  } | null>(null);

  const amountNum  = parseFloat(amount) || 0;
  const currency   = selectedBiller?.currency ?? selectedRecipient?.currency ?? "KES";
  const local      = convertToLocal(amountNum, currency);
  const balance    = parseFloat(usdcBalance) || 0;
  const isBusy     = pendingStatus !== "idle" && pendingStatus !== "confirmed" && pendingStatus !== "failed";

  useEffect(() => {
    fetch("/api/billers")
      .then((r) => r.json())
      .then((d) => setBillers(d.billers ?? []))
      .catch(() => {});
  }, []);

  // Deduct from demo balance after successful send
  function deductBalance(amt: number) {
    const newBal = Math.max(0, balance - amt).toFixed(2);
    setBalances(newBal, xlmBalance);
  }

  async function handleSend() {
    if (!publicKey || !secretKey) return;
    reset();
    setStatus("building", "Building transaction…");
    try {
      let res: Response;

      if (mode === "bill_pay" && selectedBiller) {
        setStatus("signing", "Signing payment…");
        res = await fetch("/api/send/bill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderSecret: secretKey,
            billerId: selectedBiller.id,
            reference,
            amount,
          }),
        });
      } else if (mode === "voucher") {
        setStatus("signing", "Creating voucher…");
        res = await fetch("/api/send/voucher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderSecret: secretKey, amount, memo }),
        });
      } else {
        setStatus("signing", "Signing transfer…");
        const dest = selectedRecipient?.publicKey ?? manualKey;
        res = await fetch("/api/send/cash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderSecret: secretKey,
            recipientPublicKey: dest,
            amount,
            memo,
          }),
        });
      }

      setStatus("submitting", "Submitting to Stellar…");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Transaction failed");

      setStatus("confirmed");

      // Deduct from balance display (demo or real)
      deductBalance(amountNum);

      const receiptData = {
        txHash:      data.txHash,
        voucherId:   data.voucherId,
        claimUrl:    data.claimUrl,
        fee:         data.fee ?? "0.00001",
        localAmount: local.formatted,
        currency,
      };
      setReceipt(receiptData);

      addTx({
        id:                 data.txHash ?? data.voucherId ?? `tx_${Date.now()}`,
        type:               mode === "voucher" ? "voucher" : mode === "bill_pay" ? "bill_pay" : "cash",
        amountUSDC:         amount,
        memo,
        recipientPublicKey: selectedRecipient?.publicKey ?? manualKey,
        recipientName:      selectedRecipient?.name,
        billerId:           selectedBiller?.id,
        billerName:         selectedBiller?.name,
        reference,
        txHash:             data.txHash,
        voucherId:          data.voucherId,
        claimUrl:           data.claimUrl,
        fee:                data.fee ?? "0.00001",
        currency,
        localAmount:        local.formatted,
        createdAt:          new Date().toISOString(),
        status:             "confirmed",
      });

      toast.success(
        mode === "voucher" ? "Voucher created!" :
        mode === "bill_pay" ? "Bill paid!" : "Transfer sent!"
      );
      setStep(3);
    } catch (e: unknown) {
      setStatus("failed");
      toast.error(e instanceof Error ? e.message : "Transaction failed");
    }
  }

  function resetFlow() {
    setStep(0); setAmount(""); setSelectedBiller(null);
    setSelectedRecipient(null); setManualKey(""); setReference("");
    setMemo(""); setReceipt(null); reset();
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center space-y-4">
        <div className="text-5xl">🔒</div>
        <h2 className="text-2xl font-bold">Connect your wallet first</h2>
        <p className="text-white/50">You need a funded wallet to send money.</p>
        <Link href="/wallet">
          <Button size="lg" icon={<Wallet className="w-5 h-5" />}>Get Demo Wallet</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Send className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Send Money</h1>
            <p className="text-sm text-white/50">
              Balance: <span className="text-white font-semibold">${balance.toFixed(2)}</span> USDC
              {useDemoBalance && <span className="ml-1 text-yellow-400/70">(demo)</span>}
            </p>
          </div>
        </div>

        <div className="mb-8"><Stepper steps={STEPS} current={step} /></div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <StepAmount
                amount={amount} setAmount={setAmount}
                mode={mode} setMode={setMode}
                balance={balance} local={local}
                onNext={() => setStep(1)}
              />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <StepDestination
                mode={mode} billers={billers}
                selectedBiller={selectedBiller} setSelectedBiller={setSelectedBiller}
                selectedRecipient={selectedRecipient} setSelectedRecipient={setSelectedRecipient}
                manualKey={manualKey} setManualKey={setManualKey}
                reference={reference} setReference={setReference}
                memo={memo} setMemo={setMemo}
                onBack={() => setStep(0)} onNext={() => setStep(2)}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="s2" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <StepConfirm
                mode={mode} amount={amount} local={local}
                selectedBiller={selectedBiller}
                selectedRecipient={selectedRecipient}
                reference={reference} memo={memo}
                isBusy={isBusy} pendingStep={pendingStep}
                onBack={() => setStep(1)} onConfirm={handleSend}
              />
            </motion.div>
          )}
          {step === 3 && receipt && (
            <motion.div key="s3" variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }}>
              <StepReceipt
                mode={mode} amount={amount} local={local}
                receipt={receipt}
                selectedBiller={selectedBiller}
                selectedRecipient={selectedRecipient}
                reference={reference}
                onReset={resetFlow}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Step 0: Amount ────────────────────────────────────────────────────────
function StepAmount({ amount, setAmount, mode, setMode, balance, local, onNext }: {
  amount: string; setAmount: (v: string) => void;
  mode: SendMode; setMode: (m: SendMode) => void;
  balance: number; local: ReturnType<typeof convertToLocal>;
  onNext: () => void;
}) {
  const num   = parseFloat(amount) || 0;
  const valid = num > 0 && num <= balance;

  return (
    <div className="space-y-5">
      <Card><CardBody className="p-4">
        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Send type</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: "bill_pay", label: "Pay a Bill",     icon: Building2 },
            { key: "cash",     label: "Cash Transfer",  icon: Users },
            { key: "voucher",  label: "Voucher Link",   icon: Link2 },
          ] as { key: SendMode; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setMode(key)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                mode === key
                  ? "bg-brand-500/15 border-brand-500/50 text-brand-400"
                  : "border-white/10 text-white/50 hover:border-white/25 hover:text-white/80"
              }`}>
              <Icon className="w-5 h-5" />{label}
            </button>
          ))}
        </div>
      </CardBody></Card>

      <Card><CardBody className="space-y-4">
        <Input
          label="Amount (USDC)" type="number" min="0.01" step="0.01"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          prefix={<span className="text-brand-400 font-bold text-lg">$</span>}
          suffix="USDC"
          hint={`Available: $${balance.toFixed(2)}`}
          error={num > balance && balance > 0 ? "Insufficient balance" : undefined}
        />
        {num > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <span className="text-sm text-white/50">Recipient receives</span>
            <span className="font-bold text-white">{local.formatted}</span>
          </motion.div>
        )}
      </CardBody></Card>

      {num > 0 && <FeeComparison amountUSD={num} />}

      <Button className="w-full" size="lg" disabled={!valid} onClick={onNext}
        icon={<ArrowRight className="w-5 h-5" />}>
        Continue
      </Button>
    </div>
  );
}

// ─── Step 1: Destination ───────────────────────────────────────────────────
function StepDestination({
  mode, billers, selectedBiller, setSelectedBiller,
  selectedRecipient, setSelectedRecipient,
  manualKey, setManualKey,
  reference, setReference,
  memo, setMemo,
  onBack, onNext,
}: {
  mode: SendMode; billers: Biller[];
  selectedBiller: Biller | null; setSelectedBiller: (b: Biller | null) => void;
  selectedRecipient: typeof DEMO_RECIPIENTS[0] | null;
  setSelectedRecipient: (r: typeof DEMO_RECIPIENTS[0] | null) => void;
  manualKey: string; setManualKey: (v: string) => void;
  reference: string; setReference: (v: string) => void;
  memo: string; setMemo: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const canProceed =
    mode === "bill_pay" ? !!selectedBiller && reference.trim().length > 0 :
    mode === "cash"     ? !!(selectedRecipient || manualKey.trim()) :
    true;

  return (
    <div className="space-y-5">
      {mode === "bill_pay" && (<>
        <Card><CardBody className="space-y-3">
          <p className="text-sm font-semibold text-white/70">Select biller</p>
          {billers.length === 0 && (
            <p className="text-sm text-white/40 py-4 text-center">Loading billers…</p>
          )}
          {billers.map((b) => (
            <button key={b.id} onClick={() => setSelectedBiller(b)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedBiller?.id === b.id
                  ? "bg-brand-500/10 border-brand-500/50"
                  : "border-white/10 hover:border-white/25"
              }`}>
              <span className="text-2xl">{CATEGORY_EMOJI[b.category] ?? "🏢"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{b.name}</p>
                <p className="text-xs text-white/40 capitalize">{b.category} · {b.country} · {b.currency}</p>
              </div>
              {selectedBiller?.id === b.id && <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />}
            </button>
          ))}
        </CardBody></Card>
        {selectedBiller && (
          <Input label="Reference / Account Number"
            value={reference} onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. STU-20241, ACCT-55892, TENANT-7"
            hint="The biller sees this on their dashboard" />
        )}
      </>)}

      {mode === "cash" && (<>
        <Card><CardBody className="space-y-2">
          <p className="text-sm font-semibold text-white/70 mb-1">Quick recipients</p>
          {DEMO_RECIPIENTS.map((r) => (
            <button key={r.id} onClick={() => { setSelectedRecipient(r); setManualKey(""); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedRecipient?.id === r.id
                  ? "bg-brand-500/10 border-brand-500/50"
                  : "border-white/10 hover:border-white/25"
              }`}>
              <span className="text-2xl">{r.avatar}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{r.name}</p>
                <p className="text-xs text-white/40">{r.relation} · {r.flag} {r.country}</p>
              </div>
              {selectedRecipient?.id === r.id && <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />}
            </button>
          ))}
        </CardBody></Card>
        <div className="relative my-1">
          <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
          <span className="relative bg-[#111827] px-3 text-xs text-white/30 mx-auto block w-fit">or enter address</span>
        </div>
        <Input label="Stellar Address" value={manualKey}
          onChange={(e) => { setManualKey(e.target.value); setSelectedRecipient(null); }}
          placeholder="G..." hint="Any Stellar public key" />
        <Input label="Memo (optional)" value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. For groceries" hint="Max 28 chars" />
      </>)}

      {mode === "voucher" && (
        <Card><CardBody className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Link2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-sm text-purple-200/80 leading-relaxed">
              A claimable voucher link will be generated. Share it — the recipient
              doesn&apos;t need a wallet. Expires in 7 days; you can reclaim if unclaimed.
            </p>
          </div>
          <Input label="Note (optional)" value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. For Mama's groceries" />
        </CardBody></Card>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1"
          icon={<ArrowRight className="w-5 h-5" />}>Continue</Button>
      </div>
    </div>
  );
}

// ─── Step 2: Confirm ───────────────────────────────────────────────────────
function StepConfirm({ mode, amount, local, selectedBiller, selectedRecipient,
  reference, memo, isBusy, pendingStep, onBack, onConfirm }: {
  mode: SendMode; amount: string; local: ReturnType<typeof convertToLocal>;
  selectedBiller: Biller | null;
  selectedRecipient: typeof DEMO_RECIPIENTS[0] | null;
  reference: string; memo: string;
  isBusy: boolean; pendingStep: string;
  onBack: () => void; onConfirm: () => void;
}) {
  const num = parseFloat(amount) || 0;
  return (
    <div className="space-y-5">
      <Card className="gradient-border"><CardBody className="space-y-3">
        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Review transfer</p>
        <Row label="Type">
          <Badge variant={mode === "bill_pay" ? "blue" : mode === "voucher" ? "purple" : "green"}>
            {mode === "bill_pay" ? "Bill Payment" : mode === "voucher" ? "Voucher" : "Cash Transfer"}
          </Badge>
        </Row>
        <Row label="Amount"><span className="font-bold text-white text-lg">${amount} USDC</span></Row>
        <Row label="Recipient receives"><span className="text-brand-400 font-semibold">{local.formatted}</span></Row>
        {selectedBiller && <>
          <Row label="Biller">
            <span>{CATEGORY_EMOJI[selectedBiller.category] ?? "🏢"} {selectedBiller.name}</span>
          </Row>
          <Row label="Reference"><code className="text-sm font-mono">{reference}</code></Row>
        </>}
        {selectedRecipient && (
          <Row label="Recipient"><span>{selectedRecipient.avatar} {selectedRecipient.name}</span></Row>
        )}
        {memo && <Row label="Note"><span className="text-white/70">{memo}</span></Row>}
        <div className="border-t border-white/5 pt-3">
          <Row label="Network fee">
            <div className="flex items-center gap-2">
              <span className="text-brand-400 font-bold">~$0.01</span>
              <span className="text-xs text-white/25 line-through">${(num * 0.06).toFixed(2)} traditional</span>
            </div>
          </Row>
        </div>
      </CardBody></Card>

      {isBusy && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-sm text-brand-400">{pendingStep || "Processing…"}</p>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-300/70">Testnet demo — no real funds involved.</p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} disabled={isBusy} className="flex-1">Back</Button>
        <Button onClick={onConfirm} loading={isBusy} className="flex-1">Confirm & Send</Button>
      </div>
    </div>
  );
}

// ─── Step 3: Receipt ───────────────────────────────────────────────────────
function StepReceipt({ mode, amount, local, receipt, selectedBiller,
  selectedRecipient, reference, onReset }: {
  mode: SendMode; amount: string; local: ReturnType<typeof convertToLocal>;
  receipt: { txHash?: string; voucherId?: string; claimUrl?: string; fee: string; localAmount: string; currency: string };
  selectedBiller: Biller | null;
  selectedRecipient: typeof DEMO_RECIPIENTS[0] | null;
  reference: string; onReset: () => void;
}) {
  const num = parseFloat(amount) || 0;
  const legacySave = (num * 0.06 - 0.01).toFixed(2);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold">
          {mode === "voucher" ? "Voucher Created!" : mode === "bill_pay" ? "Bill Paid!" : "Sent!"}
        </h2>
        <p className="text-white/50 text-sm">Settled on Stellar in ~3 seconds</p>
      </div>

      <Card className="gradient-border"><CardBody className="space-y-3">
        <Row label="Sent"><span className="font-bold text-white">${amount} USDC</span></Row>
        <Row label="Received"><span className="font-bold text-brand-400">{local.formatted}</span></Row>
        {selectedBiller && (
          <Row label="Biller"><span>{CATEGORY_EMOJI[selectedBiller.category] ?? "🏢"} {selectedBiller.name}</span></Row>
        )}
        {reference && <Row label="Reference"><code className="text-sm font-mono">{reference}</code></Row>}
        {selectedRecipient && (
          <Row label="Recipient"><span>{selectedRecipient.avatar} {selectedRecipient.name}</span></Row>
        )}
        <Row label="Fee"><span className="text-brand-400 font-semibold">~$0.01</span></Row>
        <Row label="Saved vs. 6%">
          <span className="text-brand-400 font-bold">${legacySave}</span>
        </Row>
      </CardBody></Card>

      {receipt.txHash && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <Receipt className="w-4 h-4 text-white/40 shrink-0" />
          <code className="flex-1 text-xs font-mono text-white/60 truncate">{receipt.txHash}</code>
          <button onClick={() => copyText(receipt.txHash!)}
            className="shrink-0 p-1.5 rounded hover:text-brand-400 text-white/30 transition-colors">
            <Copy className="w-4 h-4" />
          </button>
          <a href={`https://stellar.expert/explorer/testnet/tx/${receipt.txHash}`}
            target="_blank" rel="noopener noreferrer"
            className="shrink-0 p-1.5 rounded hover:text-brand-400 text-white/30 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {receipt.claimUrl && (
        <Card><CardBody className="space-y-3">
          <p className="text-sm font-semibold text-purple-400">🎟 Voucher claim link</p>
          <p className="text-xs text-white/50">Share this — the recipient can claim without a wallet.</p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <code className="flex-1 text-xs font-mono text-purple-300/80 truncate">{receipt.claimUrl}</code>
            <button onClick={() => copyText(receipt.claimUrl!)}
              className="shrink-0 p-1.5 hover:text-purple-300 text-purple-400/50 transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </CardBody></Card>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onReset} className="flex-1">Send Another</Button>
        <Link href={mode === "bill_pay" ? "/biller" : "/dashboard"} className="flex-1">
          <Button className="w-full">
            {mode === "bill_pay" ? "View Biller Dashboard" : "View History"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/50 shrink-0">{label}</span>
      <span className="text-sm text-white text-right">{children}</span>
    </div>
  );
}
