/**
 * Retry wrapper with exponential backoff for Horizon API calls.
 * Handles network 5xx, rate limits (429), and Stellar-specific transient errors.
 */

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms — doubled each attempt (default: 500) */
  baseDelayMs?: number;
  /** HTTP statuses that trigger a retry (default: [429, 502, 503, 504]) */
  retryableStatuses?: number[];
  /** Strings in the response body that indicate a retryable error */
  retryablePatterns?: string[];
}

const DEFAULT_RETRYABLE_STATUSES = [429, 502, 503, 504];
const DEFAULT_RETRYABLE_PATTERNS = ["tryAgainLater", "timeout", "internal_error"];

/**
 * Execute `fn` with automatic retries on transient failures.
 * Non-retryable errors are thrown immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 500,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    retryablePatterns = DEFAULT_RETRYABLE_PATTERNS,
  } = opts;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      // Only retry if we have attempts remaining
      if (attempt >= maxRetries) break;

      const isRetryable = classifyError(err, retryableStatuses, retryablePatterns);
      if (!isRetryable) throw err;

      // Exponential backoff: 500ms, 1000ms, 2000ms …
      const delay = baseDelayMs * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

function classifyError(
  err: unknown,
  retryableStatuses: number[],
  retryablePatterns: string[],
): boolean {
  if (err instanceof TypeError && err.message.includes("fetch")) return true;

  const msg = err instanceof Error ? err.message : String(err);
  if (retryablePatterns.some((p) => msg.toLowerCase().includes(p.toLowerCase()))) return true;

  // Check for HTTP status in wrapped fetch errors
  if ((err as any)?.status && retryableStatuses.includes((err as any).status)) return true;
  if ((err as any)?.httpStatus && retryableStatuses.includes((err as any).httpStatus)) return true;

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
