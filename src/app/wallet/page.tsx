"use client";
import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useWalletStore } from "@/store/wallet";
import { shortKey } from "@/lib/utils/keys";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Wallet, RefreshCw, Copy, ExternalLink, Zap,
  Eye, EyeOff, AlertTriangle, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

/* ── API helpers (no SDK in browser) ─────────────────────────────────────── */
async function apiFetchBalances(key: string) {
  const r = await fetch(`/api/account/${encodeURIComponent(key)}`);
  const d = await r.json();
  if (!d.ok) throw new Error(d.error ?? "Failed to fetch balances");
  return { usdc: d.usdc as string, xlm: d.xlm as string };
}

async function apiGenKeypair() {
  const r = await fetch("/api/keygen");
  const d = await r.json();
  if (!d.ok) throw new Error(d.error ?? "Keygen failed");
  return { publicKey: d.publicKey as string, secretKey: d.secretKey as string };
}

async function apiFromSecret(secret: string) {
  const r = await fetch("/api/keygen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
  });
  const d = await r.json();
  if (!d.ok) throw new Error(d.error ?? "Invalid secret key");
  return { publicKey: d.publicKey as string, secretKey: d.secretKey as string };
}

export default function WalletPage() {
  const {
    publicKey, secretKey, usdcBalance, xlmBalance,
    isConnected, useDemoBalance,
    setWallet, setBalances, setDemoBalance, disconnect,
  } = useWalletStore();

  const [balanceLoading, setBalanceLoading] = useState(false);
  const [setupLoading,   setSetupLoading]   = useState(false);
  const [faucetLoading,  setFaucetLoading]  = useState(false);
  const [importSecret,   setImportSecret]   = useState("");
  const [showSecret,     setShowSecret]     = useState(false);
  const [tab, setTab] = useState<"create" | "import">("create");

  const refreshBalances = useCallback(async (key: string) => {
    setBalanceLoading(true);
    try {
      const { usdc, xlm } = await apiFetchBalances(key);
      if (parseFloat(usdc) > 0) {
        setBalances(usdc, xlm);
      } else {
        setBalances(useDemoBalance ? usdcBalance : usdc, xlm);
      }
    } catch {
      toast.error("Could not fetch on-chain balances");
    } finally {
      setBalanceLoading(false);
    }
  }, [setBalances, useDemoBalance, usdcBalance]);

  useEffect(() => {
    if (isConnected && publicKey) refreshBalances(publicKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Generate & fund new wallet ────────────────────────────────────────── */
  async function handleGenerate() {
    setSetupLoading(true);
    try {
      toast.loading("Generating keypair…", { id: "setup" });
      const kp = await apiGenKeypair();

      toast.loading("Funding via Friendbot…", { id: "setup" });
      const res  = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: kp.publicKey, secret: kp.secretKey }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Setup failed");

      setWallet(kp.publicKey, kp.secretKey);

      if (data.useDemoBalance && data.demoBalance) {
        setDemoBalance(data.demoBalance);
        const { xlm } = await apiFetchBalances(kp.publicKey);
        setBalances(data.demoBalance, xlm);
      } else {
        await refreshBalances(kp.publicKey);
      }

      toast.success("Wallet ready — 500 demo USDC loaded!", { id: "setup" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Setup failed", { id: "setup" });
    } finally {
      setSetupLoading(false);
    }
  }

  /* ── Top-up faucet ─────────────────────────────────────────────────────── */
  async function handleFaucet() {
    if (!publicKey || !secretKey) return;
    setFaucetLoading(true);
    try {
      toast.loading("Adding test USDC…", { id: "faucet" });
      const res  = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey, secret: secretKey }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Faucet failed");

      if (data.useDemoBalance && data.demoBalance) {
        setDemoBalance(data.demoBalance);
        const { xlm } = await apiFetchBalances(publicKey);
        setBalances(data.demoBalance, xlm);
      } else {
        await refreshBalances(publicKey);
      }
      toast.success("500 demo USDC added!", { id: "faucet" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Faucet error", { id: "faucet" });
    } finally {
      setFaucetLoading(false);
    }
  }

  /* ── Import from secret key ────────────────────────────────────────────── */
  async function handleImport() {
    const s = importSecret.trim();
    if (!s) return;
    setSetupLoading(true);
    try {
      const kp = await apiFromSecret(s);
      setWallet(kp.publicKey, kp.secretKey);
      setImportSecret("");
      await refreshBalances(kp.publicKey);
      toast.success("Wallet imported!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invalid secret key");
    } finally {
      setSetupLoading(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  }
  // wallet page v2

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Wallet</h1>
            <p className="text-sm text-white/50">Testnet demo wallet — no real funds</p>
          </div>
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
              {(["create", "import"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === t ? "bg-stellar-card text-white shadow" : "text-white/40 hover:text-white/70"
                  }`}>
                  {t === "create" ? "Create New Wallet" : "Import Existing Key"}
                </button>
              ))}
            </div>

            {tab === "create" ? (
              <Card>
                <CardBody className="flex flex-col items-center gap-6 py-12">
                  <div className="w-20 h-20 rounded-2xl bg-brand-500/10 flex items-center justify-center text-5xl">🏠</div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Get your demo wallet</h2>
                    <p className="text-white/50 text-sm max-w-sm leading-relaxed">
                      We&apos;ll generate a Stellar keypair, fund it with XLM via Friendbot,
                      add a USDC trustline, and load <strong className="text-white">500 demo USDC</strong>.
                    </p>
                  </div>
                  <Button size="lg" loading={setupLoading} onClick={handleGenerate}
                    icon={<Zap className="w-5 h-5" />}>
                    {setupLoading ? "Setting up…" : "Generate & Fund Wallet"}
                  </Button>
                  <p className="text-xs text-white/30 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />Takes ~10 seconds · Testnet only
                  </p>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="flex flex-col gap-5">
                  <h2 className="font-bold text-lg">Import from secret key</h2>
                  <Input
                    label="Secret Key (S…)" type={showSecret ? "text" : "password"}
                    value={importSecret} onChange={(e) => setImportSecret(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleImport()}
                    placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    hint="56-character Stellar secret key starting with S"
                    suffix={
                      <button type="button" onClick={() => setShowSecret((v) => !v)}
                        className="text-white/40 hover:text-white transition-colors">
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-300/80">Demo only — never enter a mainnet key into any web app.</p>
                  </div>
                  <Button onClick={handleImport} loading={setupLoading}
                    disabled={importSecret.trim().length < 56}>
                    Import Wallet
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Balance card */}
            <Card className="gradient-border">
              <CardBody>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="green" dot>Connected</Badge>
                    <span className="text-xs text-white/40">Stellar Testnet</span>
                    {useDemoBalance && <Badge variant="yellow">Demo Balance</Badge>}
                  </div>
                  <button onClick={() => publicKey && refreshBalances(publicKey)}
                    disabled={balanceLoading} title="Refresh balances"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
                    <RefreshCw className={`w-4 h-4 ${balanceLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-white/50 mb-1">USDC Balance</p>
                  <p className="text-5xl font-black text-white tracking-tight">
                    ${parseFloat(usdcBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    {parseFloat(xlmBalance).toFixed(4)} XLM
                    {useDemoBalance && <span className="ml-2 text-yellow-400/60 text-xs">· demo USDC overlay</span>}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" loading={faucetLoading}
                    onClick={handleFaucet} icon={<Zap className="w-4 h-4" />} className="flex-1">
                    Top Up USDC
                  </Button>
                  <Link href="/send" className="flex-1">
                    <Button size="sm" className="w-full">Send Money →</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* Keys */}
            <Card>
              <CardHeader><h3 className="font-semibold text-sm text-white/70">Account Keys</h3></CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <p className="text-xs text-white/40 mb-1.5">Public Key</p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <code className="flex-1 text-xs font-mono text-white/80 break-all leading-relaxed">{publicKey}</code>
                    <button onClick={() => copy(publicKey!, "Public key")}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 hover:text-brand-400 text-white/40 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <a href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                      target="_blank" rel="noopener noreferrer"
                      className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 hover:text-brand-400 text-white/40 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1.5">Secret Key</p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <code className="flex-1 text-xs font-mono text-red-300/60 break-all leading-relaxed">
                      {showSecret ? secretKey : "S" + "•".repeat(55)}
                    </code>
                    <button onClick={() => setShowSecret((v) => !v)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 hover:text-white text-white/40 transition-colors">
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => copy(secretKey!, "Secret key")}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 hover:text-brand-400 text-white/40 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {useDemoBalance && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-300">Demo balance active</p>
                  <p className="text-xs text-blue-300/70 leading-relaxed">
                    Your Stellar account is real on testnet with XLM. The 500 USDC is a demo overlay
                    so you can explore all features. On-chain micro-txs still execute real testnet transactions
                    giving you genuine Stellar tx hashes.
                  </p>
                </div>
              </div>
            )}

            <Button variant="danger" onClick={disconnect} className="w-full">
              Disconnect Wallet
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
