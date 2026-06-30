"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Gift } from "lucide-react";

export default function ClaimIndexPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
      <div className="text-6xl mb-4">🎟️</div>
      <h1 className="text-3xl font-bold">Claim a Voucher</h1>
      <p className="text-white/50">
        If someone sent you a Homebound voucher, use the link they shared — it
        looks like{" "}
        <code className="text-brand-400 text-xs bg-white/5 px-2 py-1 rounded">
          /claim/v_…
        </code>
      </p>
      <Link href="/send">
        <Button size="lg" icon={<Gift className="w-5 h-5" />} className="mt-4">
          Send a Voucher
        </Button>
      </Link>
    </div>
  );
}
