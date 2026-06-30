/**
 * FX Rate Mark
 * ─────────────
 * Provides local-currency display amounts with a transparent mark (spread).
 * Real integration: replace BASE_RATES with a SEP-38 oracle call.
 *
 * The mark is Homebound's revenue: 0.5–0.8 % vs the 6 % industry average.
 */
import { HOMEBOUND_FEE_USD, LEGACY_FEE_PCT } from "@/lib/constants";

export { HOMEBOUND_FEE_USD, LEGACY_FEE_PCT };

export interface FXRate {
  currency: string;
  symbol:   string;
  flag:     string;
  ratePerUSD: number;
  mark:     number; // fraction, e.g. 0.005 = 0.5 %
}

const BASE_RATES: Record<string, FXRate> = {
  KES: { currency: "KES", symbol: "KSh",  flag: "🇰🇪", ratePerUSD: 129.50, mark: 0.005 },
  PHP: { currency: "PHP", symbol: "₱",    flag: "🇵🇭", ratePerUSD:  58.20, mark: 0.005 },
  NGN: { currency: "NGN", symbol: "₦",    flag: "🇳🇬", ratePerUSD: 1550.0, mark: 0.008 },
  GHS: { currency: "GHS", symbol: "GH₵",  flag: "🇬🇭", ratePerUSD:  15.80, mark: 0.005 },
  INR: { currency: "INR", symbol: "₹",    flag: "🇮🇳", ratePerUSD:  83.50, mark: 0.004 },
  MXN: { currency: "MXN", symbol: "MX$",  flag: "🇲🇽", ratePerUSD:  17.80, mark: 0.004 },
  USD: { currency: "USD", symbol: "$",    flag: "🇺🇸", ratePerUSD:   1.0,  mark: 0     },
};

export const getRate    = (c: string): FXRate  => BASE_RATES[c.toUpperCase()] ?? BASE_RATES.USD;
export const getAllRates = ():  FXRate[] => Object.values(BASE_RATES);

export interface FXConversion {
  localAmount:   number;
  effectiveRate: number;
  markAmount:    number;
  markPct:       number;
  formatted:     string;
}

export function convertToLocal(usdcAmount: number, currency: string): FXConversion {
  const rate          = getRate(currency);
  const effectiveRate = rate.ratePerUSD * (1 - rate.mark);
  const localAmount   = usdcAmount * effectiveRate;
  const markAmount    = usdcAmount * rate.ratePerUSD * rate.mark;

  return {
    localAmount,
    effectiveRate,
    markAmount,
    markPct:   rate.mark * 100,
    formatted: `${rate.symbol}${localAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${rate.flag}`,
  };
}
