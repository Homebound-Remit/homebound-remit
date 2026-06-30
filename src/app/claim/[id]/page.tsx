"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { convertToLocal } from "@/lib/fx/rates";
import {
  Gift, CheckCircle2, XCircle, Clock,
  ExternalLink, Copy, AlertTriangle, Wallet, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface VoucherData {
  id: string;
  amountUSDC: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  claimedAt?: string;
  memo?: string;
  senderPublicKey: string;
  claimantPublicKey: string;
}

type ClaimState = "idle" | "loading" | "claiming" | "claimed" | "error";

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const [voucher, setVoucher]   = useState<VoucherData | null>(null);
  const [claimState, setClaimState] = useState<ClaimState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [claimResult, setClaimResult] = useState<{
    txHash: string; claimantPublicKey: string; amountUSDC: string;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/voucher/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setVoucher(d.voucher);
          setClaimState(
            d.voucher.status === "claimed"   ? "claimed" :
            d.voucher.status === "reclaimed" ? "error"   :
            d.voucher.status === "expired"   ? "error"   : "idle"
          );
          if (d.voucher.status === "expired")   setErrorMsg("This voucher has expired.");
          if (d.voucher.status === "reclaimed") setErrorMsg("This voucher was reclaimed by the sender.");
        } else {
          setErrorMsg(d.error ?? "Voucher not found");
          setClaimState("error");
        }
      })
      .catch(() => {
        setErrorMsg("Could not load voucher. Check your connection.");
        setClaimState("error");
      });
  }, [id]);

  async function handleClaim() {
    if (!voucher) return;
    setClaimState("claiming");
    try {
      toast.loading("Claiming your funds…", { id: "claim" });
      const res  = await fetch(`/api/voucher/${id}`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Claim failed");

      setClaimResult({
        txHash:             data.txHash,
        claimantPublicKey:  data.claimantPublicKey ?? voucher.claimantPublicKey,
        amountUSDC:         data.amountUSDC ?? voucher.amountUSDC,
      });
      setClaimState("claimed");
      toast.success("Funds claimed!", { id: "claim" });
    } catch (e: unknown) {
      setClaimState("idle");
      toast.error(e instanceof Error ? e.message : "Claim failed", { id: "claim" });
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (claimState === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (claimState === "error" && !voucher) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
        <XCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-2xl font-bold">Voucher unavailable</h2>
        <p className="text-white/50">{errorMsg}</p>
        <Link href="/"><Button variant="secondary">Go Home</Button></Link>
      </div>
    );
  }

  const amtNum     = parseFloat(voucher?.amountUSDC ?? "0");
  const local      = convertToLocal(amtNum, "KES");
  const isExpired  = voucher ? new Date() > new Date(voucher.expiresAt) : false;
  const expiresStr = voucher
    ? new Date(voucher.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-brand-500/15 flex items-center justify-center mx-auto text-4xl">
            🎟️
          </div>
          <h1 className="text-3xl font-bold">
            {claimState === "claimed" ? "Funds Received!" : "You've been sent money"}
          </h1>
          <p className="text-white/50 text-sm">
            {claimState === "claimed"
              ? "The USDC has been deposited to the claimant wallet."
              : "Someone sent you a Homebound voucher — claim it below."}
          </p>
        </div>

        {/* Amount */}
        <Card className="gradient-border">
          <CardBody className="text-center py-8 space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Amount</p>
            <p className="text-5xl font-black text-white">
              ${amtNum.toFixed(2)}
              <span className="text-xl text-white/30 ml-2">USDC</span>
            </p>
            <p className="text-lg text-brand-400 font-semibold">{local.formatted}</p>
            {voucher?.memo && (
              <p className="text-sm text-white/50 italic pt-1">&ldquo;{voucher.memo}&rdquo;</p>
            )}
          </CardBody>
        </Card>

        {/* Status */}
        <Card><CardBody className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/50">Status</span>
            {claimState === "claimed"
              ? <Badge variant="green" dot>Claimed</Badge>
              : isExpired
              ? <Badge variant="red" dot>Expired</Badge>
              : <Badge variant="yellow" dot>Unclaimed — ready to claim</Badge>}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/50">Expires</span>
            <span className="text-sm text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40" />{expiresStr}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/50">Network fee</span>
            <span className="text-sm text-brand-400 font-semibold">~$0.01</span>
          </div>
        </CardBody></Card>

        {/* Claim action */}
        {claimState === "idle" && !isExpired && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300/80 leading-relaxed">
                Claiming will deposit the USDC into a Stellar testnet wallet.
                The wallet address is shown after you claim.
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={handleClaim}
              icon={<Gift className="w-5 h-5" />}>
              Claim ${amtNum.toFixed(2)} USDC
            </Button>
          </div>
        )}

        {claimState === "claiming" && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-sm text-brand-400">Setting up wallet and claiming funds…</p>
          </div>
        )}

        {/* Claimed result */}
        {claimState === "claimed" && claimResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            {/* TX hash */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <code className="flex-1 text-xs font-mono text-white/60 truncate">{claimResult.txHash}</code>
              <button onClick={() => copy(claimResult.txHash, "TX hash")}
                className="p-1.5 hover:text-brand-400 text-white/30 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              <a href={`https://stellar.expert/explorer/testnet/tx/${claimResult.txHash}`}
                target="_blank" rel="noopener noreferrer"
                className="p-1.5 hover:text-brand-400 text-white/30 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Wallet address */}
            <Card><CardBody className="space-y-2">
              <p className="text-xs text-white/40 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />Claimant wallet (testnet)
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <code className="flex-1 text-xs font-mono text-white/70 break-all">
                  {claimResult.claimantPublicKey}
                </code>
                <button onClick={() => copy(claimResult.claimantPublicKey, "Wallet address")}
                  className="shrink-0 p-1.5 hover:text-brand-400 text-white/30 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={`https://stellar.expert/explorer/testnet/account/${claimResult.claimantPublicKey}`}
                  target="_blank" rel="noopener noreferrer"
                  className="shrink-0 p-1.5 hover:text-brand-400 text-white/30 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </CardBody></Card>

            <Link href="/"><Button variant="secondary" className="w-full">Back to Homebound</Button></Link>
          </motion.div>
        )}

        {/* Already claimed from earlier load */}
        {claimState === "claimed" && !claimResult && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm text-green-300">This voucher was already claimed.</p>
          </div>
        )}

        {/* Expired */}
        {isExpired && claimState !== "claimed" && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Voucher expired</p>
              <p className="text-xs text-red-300/60 mt-1">Expired on {expiresStr}. The sender can reclaim the funds.</p>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
