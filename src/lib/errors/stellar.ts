/**
 * Centralized Stellar error classes.
 * Each error carries a machine-readable `code` and a suggested HTTP status
 * so API routes can translate Stellar failures into clean JSON responses.
 */

export class StellarError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus = 500) {
    super(message);
    this.name = "StellarError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class HorizonTimeoutError extends StellarError {
  constructor(publicKey?: string) {
    super(
      "HORIZON_TIMEOUT",
      `Horizon request timed out${publicKey ? ` for ${publicKey.slice(0, 12)}…` : ""}`,
      504,
    );
  }
}

export class AccountNotFoundError extends StellarError {
  constructor(publicKey: string) {
    super(
      "ACCOUNT_NOT_FOUND",
      `Account ${publicKey.slice(0, 12)}… not found on Stellar`,
      404,
    );
  }
}

export class SequenceError extends StellarError {
  constructor(message = "Transaction sequence number mismatch — retry after loading the latest sequence") {
    super("SEQUENCE_ERROR", message, 409);
  }
}

export class RateLimitError extends StellarError {
  constructor(retryAfterMs?: number) {
    super(
      "RATE_LIMITED",
      `Horizon rate limit exceeded${retryAfterMs ? ` — retry after ${retryAfterMs}ms` : ""}`,
      429,
    );
  }
}

export class TrustlineError extends StellarError {
  constructor(message = "USDC trustline operation failed") {
    super("TRUSTLINE_ERROR", message, 500);
  }
}

export class SubmissionError extends StellarError {
  constructor(txHash: string, detail?: string) {
    super(
      "SUBMISSION_FAILED",
      `Transaction ${txHash.slice(0, 12)}… failed to submit${detail ? `: ${detail}` : ""}`,
      502,
    );
  }
}

/** Map a Horizon HTTP status to the appropriate StellarError subclass */
export function classifyHorizonError(status: number, body: string): StellarError {
  if (status === 429) return new RateLimitError();
  if (status === 404) return new StellarError("HORIZON_NOT_FOUND", "Resource not found on Horizon", 404);
  if (status >= 500)  return new HorizonTimeoutError();
  if (body.includes("op_already_exists")) return new StellarError("OP_ALREADY_EXISTS", "Operation already applied", 409);
  if (body.includes("tx_bad_seq"))        return new SequenceError();
  if (body.includes("tx_failed"))         return new StellarError("TX_FAILED", `Transaction failed: ${body.slice(0, 200)}`, 502);
  return new StellarError("HORIZON_ERROR", `Horizon error (${status}): ${body.slice(0, 200)}`, status);
}
