"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletStore } from "@/store/wallet";
import { cn } from "@/components/ui/cn";
import { shortKey } from "@/lib/utils/keys";
import { Wallet, Home, Send, LayoutDashboard, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "/",          label: "Home",      icon: Home },
  { href: "/send",      label: "Send",      icon: Send },
  { href: "/biller",    label: "Billers",   icon: Building2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { publicKey, usdcBalance, isConnected } = useWalletStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stellar-dark/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-lg">
            🏠
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Home<span className="text-brand-400">bound</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                pathname === href
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          {isConnected && publicKey ? (
            <Link
              href="/wallet"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stellar-card border border-stellar-border hover:border-brand-500/40 transition-all text-sm"
            >
              <Wallet className="w-4 h-4 text-brand-400" />
              <span className="text-white/80 font-mono text-xs">
                {shortKey(publicKey)}
              </span>
              <span className="hidden sm:block text-brand-400 font-semibold">
                ${parseFloat(usdcBalance).toFixed(2)}
              </span>
            </Link>
          ) : (
            <Link href="/wallet">
              <Button size="sm" icon={<Wallet className="w-4 h-4" />}>
                Connect Wallet
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
