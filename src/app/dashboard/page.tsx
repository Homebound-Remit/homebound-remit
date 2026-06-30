"use client";
import React from "react";
import { motion } from "framer-motion";
import { useWalletStore } from "@/store/wallet";
import { useTxStore, Transaction } from "@/store/tx";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DEMO_TRANSACTIONS } from "@/lib/demo/seeds";
import { HOMEBOUND_FEE_USD, LEGACY_FEE_PCT } from "@/lib/fx/rates";
import {
  LayoutDashboard, Send, Building2, Link2, Users,
  TrendingDown, DollarSign, ExternalLink, Copy, Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const TX_ICONS: Record<string, React.ElementType> = {
  bill_pay: Building2,
  cash: Users,
  voucher: Link2,
};

const TX_COLORS: Record<string, string> = {
  bill_pay: "text-blue-400 bg-blue-500/15",
  cash: "text-green-400 bg-green-500/15",
  voucher: "text-purple-400 bg-purple-500/15",
};

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const { isConnected, publicKey, usdcBalance } = useWalletStore();
  const { history } = useTxStore();

  // Merge real tx history with demo seeds for display richness
  const allTx: (Transaction | typeof DEMO_TRANSACTIONS[0])[] = [
    ...history,
    ...(history.length < 2 ? DEMO_TRANSACTIONS : []),
  ];

  const totalSent = allTx.reduce((s, t) => {
    const amt = parseFloat((t as Transaction).amountUSDC ?? (t as typeof DEMO_TRANSACTIONS[0]).amount ?? "0");
    return s + (isNaN(amt) ? 0 : amt);
  }, 0);

  const totalFeesLegacy = (totalSent * LEGACY_FEE_PCT) / 100;
  const totalFeesHomebound = allTx.length * HOMEBOUND_FEE_USD;
  const totalSaved = totalFeesLegacy - totalFeesHomebound;

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sender Dashboard</h1>
              <p className="text-sm text-white/50">Your transfer history and savings</p>
            </div>
          </div>
          <Link href="/send">
            <Button icon={<Send className="w-4 h-4" />}>Send Money</Button>
          </Link>
        </div>

        {/* Wallet not connected */}
        {!isConnected && (
          <Card className="mb-6">
            <CardBody className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-yellow-400" />
                <p className="text-sm text-white/70">
                  Connect a wallet to see your real transaction history.
                  Showing demo data below.
                </p>
              </div>
              <Link href="/wallet">
                <Button size="sm" variant="secondary">Connect</Button>
              </Link>
            </CardBody>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Sent", value: `$${totalSent.toFixed(2)}`,
              sub: "USDC", icon: DollarSign, color: "text-brand-400", bg: "bg-brand-500/15",
            },
            {
              label: "Transfers", value: allTx.length.toString(),
              sub: "confirmed", icon: Send, color: "text-blue-400", bg: "bg-blue-500/15",
            },
            {
              label: "Fees Paid", value: `$${totalFeesHomebound.toFixed(2)}`,
              sub: "Homebound fees", icon: TrendingDown, color: "text-green-400", bg: "bg-green-500/15",
            },
            {
              label: "Saved vs. 6%", value: `$${totalSaved.toFixed(2)}`,
              sub: "vs. traditional", icon: TrendingDown, color: "text-yellow-400", bg: "bg-yellow-500/15",
            },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card hover className="h-full">
                <CardBody className="p-5">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{label}</p>
                  <p className="text-xs text-white/25">{sub}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Savings bar */}
        {totalSent > 0 && (
          <Card className="mb-6">
            <CardBody className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white/70">Fee comparison on ${ totalSent.toFixed(2) } sent</p>
                <Badge variant="green">
                  {((totalSaved / totalFeesLegacy) * 100).toFixed(0)}% savings
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-28 shrink-0">Traditional (6%)</span>
                  <div className="flex-1 h-2.5 rounded-full bg-red-500/20">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                  <span className="text-sm font-bold text-red-400 w-16 text-right">${totalFeesLegacy.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-28 shrink-0">Homebound (~$0.01)</span>
                  <div className="flex-1 h-2.5 rounded-full bg-brand-500/20">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((totalFeesHomebound / totalFeesLegacy) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-brand-400 w-16 text-right">${totalFeesHomebound.toFixed(2)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Transaction history */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Transaction History</h3>
              {allTx.length > 0 && (
                <Badge variant="gray">{allTx.length} transfers</Badge>
              )}
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {allTx.length === 0 ? (
              <div className="py-16 text-center">
                <Send className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No transactions yet.</p>
                <Link href="/send" className="text-brand-400 text-sm underline mt-1 block">
                  Make your first transfer →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {allTx.map((t, i) => {
                  const type = (t as Transaction).type ?? ((t as typeof DEMO_TRANSACTIONS[0]).type);
                  const Icon = TX_ICONS[type] ?? Send;
                  const colorCls = TX_COLORS[type] ?? "text-white/60 bg-white/10";
                  const [iconColor, iconBg] = colorCls.split(" ");
                  const amount = (t as Transaction).amountUSDC ?? (t as typeof DEMO_TRANSACTIONS[0]).amount ?? "0";
                  const createdAt = t.createdAt;
                  const txHash = (t as Transaction).txHash;
                  const billerName = (t as Transaction).billerName ?? (t as typeof DEMO_TRANSACTIONS[0]).billerName;
                  const recipientName = (t as Transaction).recipientName ?? (t as typeof DEMO_TRANSACTIONS[0]).recipient;
                  const ref = (t as Transaction).reference ?? (t as typeof DEMO_TRANSACTIONS[0]).reference;
                  const fee = (t as Transaction).fee ?? (t as typeof DEMO_TRANSACTIONS[0]).fee ?? "0.01";

                  return (
                    <motion.div
                      key={(t as Transaction).id ?? (t as typeof DEMO_TRANSACTIONS[0]).id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white">
                          {type === "bill_pay" ? billerName :
                           type === "voucher" ? "Voucher" :
                           recipientName ?? "Cash Transfer"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {ref && (
                            <span className="text-xs font-mono text-white/40">Ref: {ref}</span>
                          )}
                          <span className="text-xs text-white/30">{timeAgo(createdAt)}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-white">${parseFloat(amount).toFixed(2)}</p>
                        <p className="text-xs text-brand-400">Fee: ${parseFloat(fee).toFixed(2)}</p>
                      </div>

                      <Badge variant="green" className="shrink-0">Confirmed</Badge>

                      {txHash && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => copy(txHash)}
                            className="p-1.5 hover:text-brand-400 text-white/25 transition-colors rounded-lg hover:bg-white/5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                            target="_blank" rel="noopener noreferrer"
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
      </motion.div>
    </div>
  );
}
