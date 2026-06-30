/** Truncate a Stellar public key for display: GABC…WXYZ — NO SDK dependency */
export function shortKey(publicKey: string, chars = 6): string {
  if (!publicKey || publicKey.length < chars + 4) return publicKey ?? "";
  return `${publicKey.slice(0, chars)}…${publicKey.slice(-4)}`;
}
