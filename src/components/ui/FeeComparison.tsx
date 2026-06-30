"use client";
import React from "react";
import { HOMEBOUND_FEE_USD, LEGACY_FEE_PCT } from "@/lib/fx/rates";
import { cn } from "./cn";

interface FeeComparisonProps {
  amountUSD: number;
  className?: string;
}

export function FeeComparison({ amountUSD, className }: FeeComparisonProps) {
  const legacyFee = (amountUSD * LEGACY_FEE_PCT) / 100;
  const homeboundFee = HOMEBOUND_FEE_USD;
  const savings = legacyFee - homeboundFee;

  return (
    <div
      className={cn(
        "rounded-xl border border-brand-500/20 bg-brand-500/5 p-4",
        className
      )}
    >
      <p className="text-xs text-white/50 mb-3 uppercase tracking-wider font-semibold">
        Fee Comparison
      </p>
      <div className="grid grid-cols-2 gap-4">
        {/* Legacy */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/40">Traditional (6%)</span>
          <span className="text-base font-bold text-red-400">
            ${legacyFee.toFixed(2)}
          </span>
          <div className="h-1.5 rounded-full bg-red-500/30 overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
        {/* Homebound */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/40">Homebound (~$0.01)</span>
          <span className="text-base font-bold text-brand-400">
            ${homeboundFee.toFixed(2)}
          </span>
          <div className="h-1.5 rounded-full bg-brand-500/30 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${(homeboundFee / legacyFee) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-brand-400">
        You save{" "}
        <span className="text-white">${savings.toFixed(2)}</span> on this transfer
      </p>
    </div>
  );
}
