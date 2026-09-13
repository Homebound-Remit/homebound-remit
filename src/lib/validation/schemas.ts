/**
 * Zod validation schemas for all API route inputs.
 * Shared between route handlers to guarantee consistent validation.
 */
import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

const stellarPublicKey = z
  .string()
  .min(56, "Stellar public key must be 56 characters")
  .max(64)
  .regex(/^G[A-Z0-9]+$/, "Must be a valid Stellar public key (starts with G)");

const stellarSecretKey = z
  .string()
  .min(56, "Stellar secret key must be 56 characters")
  .max(64)
  .regex(/^S[A-Z0-9]+$/, "Must be a valid Stellar secret key (starts with S)");

const positiveAmount = z
  .string()
  .refine((v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n > 0;
  }, "Amount must be a positive number");

// ─── Route schemas ───────────────────────────────────────────────────────────

export const FaucetSchema = z.object({
  publicKey: stellarPublicKey,
  secret:    stellarSecretKey,
});

export const SendBillSchema = z.object({
  senderSecret:    stellarSecretKey,
  senderPublicKey: stellarPublicKey.optional(),
  billerId:        z.string().min(1, "Biller ID is required"),
  reference:       z.string().min(1, "Reference is required").max(64),
  amount:          positiveAmount,
});

export const SendCashSchema = z.object({
  senderSecret:       stellarSecretKey,
  recipientPublicKey: stellarPublicKey,
  amount:             positiveAmount,
  memo:               z.string().max(28).optional(),
});

export const SendVoucherSchema = z.object({
  senderSecret:    stellarSecretKey,
  senderPublicKey: stellarPublicKey.optional(),
  amount:          positiveAmount,
  memo:            z.string().max(28).optional(),
});

export const BillerRegisterSchema = z.object({
  name:           z.string().min(1, "Name is required").max(100),
  category:       z.enum(["rent", "school", "utility", "telecom", "other"]),
  walletAddress:  stellarPublicKey,
  country:        z.string().min(2).max(60),
  currency:       z.string().min(3).max(5),
  logoUrl:        z.string().url().optional(),
});

export const KeygenPostSchema = z.object({
  secret: stellarSecretKey,
});

// ─── Inferred types for use in route handlers ────────────────────────────────

export type FaucetInput        = z.infer<typeof FaucetSchema>;
export type SendBillInput      = z.infer<typeof SendBillSchema>;
export type SendCashInput      = z.infer<typeof SendCashSchema>;
export type SendVoucherInput   = z.infer<typeof SendVoucherSchema>;
export type BillerRegisterInput = z.infer<typeof BillerRegisterSchema>;
export type KeygenPostInput    = z.infer<typeof KeygenPostSchema>;

/** Parse body against a Zod schema; returns { data } or { error: NextResponse } */
export async function parseBody<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: Response }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const msg = result.error.errors.map((e) => e.message).join("; ");
      return {
        data: null,
        error: new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      };
    }
    return { data: result.data, error: null };
  } catch {
    return {
      data: null,
      error: new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
}
