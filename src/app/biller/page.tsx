"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { convertToLocal } from "@/lib/fx/rates";
import {
  Building2, GraduationCap, Home, Lightbulb,
  Smartphone, RefreshCw, ExternalLink, DollarSign,
  TrendingUp, Users, Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface Biller {
  id: string;
  name: string;
  category: string;
  currency: string;
  country: string;
  active: boolean;
}

interface Payment {
  id: string;
  billerId: string;
  billerName: string;
  senderPublicKey: string;
  reference: string;
  amountUSDC: string;
  amountLocal: string;
  currency: string;
  txHash: string;
  createdAt: string;
  status: string;
}

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  school:  { icon: GraduationCap, color: "text-blue-400",   bg: "bg-blue-500/15" },
  utility: { icon: Lightbulb,     color: "text-yellow-400", bg: "bg-yellow-500/15" },
  rent:    { icon: Home,          color: "text-green-400",  bg: "bg-green-500/15" },
  telecom: { icon: Smartphone,    color: "text-purple-400", bg: "bg-purple-500/15" },
  other:   { icon: Building2,     color: "text-white/60",   bg: "bg-white/10" },
};

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function BillerPage() {
  const [billers, setBillers] = useState<Biller[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedBiller, setSelectedBiller] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(quiet = false) {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const [br, pr] = await Promise.all([
        fetch("/api/billers").then((r) => r.json()),
        fetch("/api/payments").then((r) => r.json()),
      ]);
      setBillers(br.billers ?? []);
      setPayments(pr.payments ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Auto-refresh every 10s
  useEffect(() => {
    const t = setInterval(() => load(true), 10_000);
    return () => clearInterval(t);
  }, []);

  const filteredPayments = selectedBiller
    ? payments.filter((p) => p.billerId === selectedBiller)
    : payments;

  const totalVolume = filteredPayments.reduce((s, p) => s + parseFloat(p.amountUSDC), 0);
  const uniqueSenders = new Set(filteredPayments.map((p) => p.senderPublicKey)).size;

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Biller Dashboard</h1>
              <p className="text-sm text-white/50">
                Real-time incoming payments from Homebound senders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="green" dot>Live</Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => load(true)}
              loading={refreshing}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Biller list sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold px-1">
              Registered Billers
            </p>
            <button
              onClick={() => setSelectedBiller(null)}
              className={`w-full flex items-center gap-2 p-3 rounded-xl border text-left transition-all text-sm font-medium ${
                !selectedBiller
                  ? "bg-brand-500/10 border-brand-500/50 text-brand-400"
                  : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              All Billers
              <span className="ml-auto text-xs">{payments.length}</span>
            </button>
            {billers.map((b) => {
              const meta = CATEGORY_META[b.category] ?? CATEGORY_META.other;
              const Icon = meta.icon;
              const count = payments.filter((p) => p.billerId === b.id).length;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBiller(b.id === selectedBiller ? null : b.id)}
                  className={`w-full flex items-center gap-2 p-3 rounded-xl border text-left transition-all text-sm ${
                    selectedBiller === b.id
                      ? "bg-brand-500/10 border-brand-500/50 text-brand-400"
                      : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${meta.color} shrink-0`} />
                  <span className="flex-1 truncate">{b.name}</span>
                  {count > 0 && (
                    <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>
                  )}
                </button>
              );
            })}

            <div className="pt-2">
              <Link href="/send">
                <Button variant="secondary" size="sm" className="w-full">
                  Make a Payment →
                </Button>
              </Link>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Volume", value: `$${totalVolume.toFixed(2)}`, icon: DollarSign, color: "text-brand-400" },
                { label: "Payments", value: filteredPayments.length.toString(), icon: TrendingUp, color: "text-blue-400" },
                { label: "Senders", value: uniqueSenders.toString(), icon: Users, color: "text-purple-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label}>
                  <CardBody className="p-4">
                    <Icon className={`w-5 h-5 ${color} mb-2`} />
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{label}</p>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Payments table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {selectedBiller
                      ? billers.find((b) => b.id === selectedBiller)?.name
                      : "All Payments"}
                  </h3>
                  {filteredPayments.length > 0 && (
                    <Badge variant="gray">{filteredPayments.length} records</Badge>
                  )}
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {filteredPayments.length === 0 ? (
                  <div className="py-16 text-center">
                    <DollarSign className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No payments yet.</p>
                    <p className="text-white/25 text-xs mt-1">
                      Send a test payment from the{" "}
                      <Link href="/send" className="text-brand-400 underline">Send page</Link>.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredPayments.map((p, i) => {
                      const biller = billers.find((b) => b.id === p.billerId);
                      const meta = CATEGORY_META[biller?.category ?? "other"] ?? CATEGORY_META.other;
                      const Icon = meta.icon;
                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                        >
                          {/* Biller icon */}
                          <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-white truncate">
                                {p.billerName}
                              </span>
                              <Badge variant="green" className="shrink-0">Confirmed</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-white/40 font-mono">
                                Ref: {p.reference}
                              </span>
                              <span className="text-xs text-white/25">·</span>
                              <span className="text-xs text-white/40">
                                {timeAgo(p.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right shrink-0">
                            <p className="font-bold text-white">${parseFloat(p.amountUSDC).toFixed(2)}</p>
                            <p className="text-xs text-white/40">{p.amountLocal}</p>
                          </div>

                          {/* TX link */}
                          {p.txHash && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => copy(p.txHash)}
                                className="p-1.5 hover:text-brand-400 text-white/25 transition-colors rounded-lg hover:bg-white/5"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`https://stellar.expert/explorer/testnet/tx/${p.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:text-brand-400 text-white/25 transition-colors rounded-lg hover:bg-white/5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Integration note */}
            <Card>
              <CardBody className="p-5">
                <p className="text-xs text-white/30 font-mono">
                  <span className="text-brand-400">// Soroban contract seam</span>
                  <br />
                  {`register_biller(name, category, walletAddress) → billerId`}
                  <br />
                  {`pay_bill(billerId, reference, amount) → emits ReceiptEvent`}
                  <br />
                  <span className="text-white/20">
                    {`// Replace mock API with sorobanClient.invokeContract(...) for mainnet`}
                  </span>
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
