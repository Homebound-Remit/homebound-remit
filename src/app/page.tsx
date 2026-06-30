"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRight, Zap, Shield, Globe, DollarSign,
  GraduationCap, Home, Lightbulb, Users, TrendingDown,
} from "lucide-react";
import { DEMO_TRANSACTIONS } from "@/lib/demo/seeds";

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const STATS = [
  { value: "$650B+", label: "Remittances / year", icon: Globe },
  { value: "6%",     label: "Average fee (legacy)", icon: TrendingDown },
  { value: "$0.01",  label: "Homebound fee",  icon: Zap },
  { value: "~3s",    label: "Settlement time", icon: Shield },
];

const FEATURES = [
  {
    icon: Home,
    title: "Pay the actual bill",
    desc: "Rent, school fees, utilities — sent directly to the biller. No middlemen, no leakage.",
    color: "text-brand-400",
    bg: "bg-brand-500/10",
  },
  {
    icon: GraduationCap,
    title: "Purpose-bound money",
    desc: "Unlike cash remittances, bill payments are guaranteed to reach the intended purpose.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Walletless recipients",
    desc: "Send a claimable voucher link. Recipients don't need a wallet to receive funds.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Lightbulb,
    title: "Transparent fees",
    desc: "~$0.01 vs. 6% industry average. On a $200 transfer you save $11.99.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
];

const FLOW_STEPS = [
  { step: "01", title: "Fund in USDC", desc: "Load your Homebound wallet with USDC on Stellar testnet." },
  { step: "02", title: "Choose destination", desc: "Send cash to a wallet, or pick a registered biller." },
  { step: "03", title: "Confirm & send", desc: "Review the local-currency amount and $0.01 fee, then confirm." },
  { step: "04", title: "Instant receipt", desc: "Both you and the biller get a receipt. Settlement in ~3 seconds." },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-hero-mesh pointer-events-none" />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div variants={FADE_UP} custom={0}>
            <Badge variant="green" dot className="text-sm px-4 py-1.5">
              Built on Stellar · Testnet Demo
            </Badge>
          </motion.div>

          <motion.h1
            variants={FADE_UP}
            custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
          >
            Send money home.
            <br />
            <span className="text-brand-400">Pay the actual bill.</span>
          </motion.h1>

          <motion.p
            variants={FADE_UP}
            custom={2}
            className="max-w-2xl text-lg sm:text-xl text-white/60 leading-relaxed"
          >
            A diaspora worker in the US pays their mother&apos;s rent in Nairobi,
            the kids&apos; school fees in Manila, or a utility bill in Lagos —
            directly, in seconds, for{" "}
            <span className="text-white font-semibold">cents</span>.
            No cash that gets spent on the way.
          </motion.p>

          <motion.div
            variants={FADE_UP}
            custom={3}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link href="/send">
              <Button size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                Send Now
              </Button>
            </Link>
            <Link href="/wallet">
              <Button size="lg" variant="secondary">
                Get Demo Wallet
              </Button>
            </Link>
          </motion.div>

          {/* Live demo preview card */}
          <motion.div
            variants={FADE_UP}
            custom={4}
            className="w-full max-w-sm mt-4"
          >
            <Card glass className="text-left">
              <CardBody className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                    Recent Transfer
                  </span>
                  <Badge variant="green" dot>Confirmed</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-xl">
                    🏫
                  </div>
                  <div>
                    <p className="font-semibold text-white">Sunrise Academy</p>
                    <p className="text-sm text-white/50">School fees · STU-20241</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-bold text-white">$85.00</p>
                    <p className="text-xs text-white/40">KSh 10,997 🇰🇪</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-white/40">
                  <span>Fee: $0.01</span>
                  <span className="line-through text-red-400/60">Legacy: $5.10</span>
                  <span className="text-brand-400 font-semibold">Saved $5.09</span>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card hover className="text-center p-6">
                <Icon className="w-6 h-6 text-brand-400 mx-auto mb-3" />
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-sm text-white/50 mt-1">{label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Why Homebound wins</h2>
          <p className="text-white/50 mt-3">Purpose-bound remittances with social impact.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card hover className="h-full p-6">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="text-white/50 mt-3">Four steps to send money home the right way.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FLOW_STEPS.map(({ step, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-brand-500/30">{step}</span>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block flex-1 h-px bg-gradient-to-r from-brand-500/30 to-transparent" />
                )}
              </div>
              <h3 className="font-bold text-white">{title}</h3>
              <p className="text-sm text-white/50">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <Card className="gradient-border p-10 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to try the demo?</h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto">
            Get a testnet wallet, claim free USDC from the faucet, and send
            a bill payment in under a minute.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/wallet">
              <Button size="lg">
                Get Started
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link href="/biller">
              <Button size="lg" variant="secondary">
                View Billers
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
