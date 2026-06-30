import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-white/30 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <span>
            <strong className="text-white/60">Homebound</strong> — built on{" "}
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300"
            >
              Stellar
            </a>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/send" className="hover:text-white/60 transition-colors">Send</Link>
          <Link href="/claim" className="hover:text-white/60 transition-colors">Claim</Link>
          <Link href="/biller" className="hover:text-white/60 transition-colors">Billers</Link>
          <Link href="/dashboard" className="hover:text-white/60 transition-colors">Dashboard</Link>
        </div>
        <p>Testnet only · Not financial advice</p>
      </div>
    </footer>
  );
}
