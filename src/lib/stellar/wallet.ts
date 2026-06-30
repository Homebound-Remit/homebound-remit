/**
 * Keypair utilities — server-side only.
 * Uses tweetnacl directly to avoid the base32.js `new Buffer()` crash
 * that occurs inside Next.js RSC when Keypair.fromSecret() is called.
 */
import * as nacl from "tweetnacl";

export interface WalletInfo {
  publicKey: string;
  secretKey: string;
}

// Base32/StrKey encoding helpers (pure implementation, no base32.js)
// Stellar StrKey format: version_byte + payload + checksum, base32-encoded
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ED25519_SECRET_VERSION = 18 << 3; // 0x90
const ED25519_PUBLIC_VERSION = 6 << 3;  // 0x30

function crc16xmodem(buf: Uint8Array): number {
  let crc = 0x0000;
  for (const b of buf) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return crc & 0xffff;
}

function encodeStrKey(versionByte: number, payload: Uint8Array): string {
  const data    = new Uint8Array(payload.length + 3);
  data[0]       = versionByte;
  data.set(payload, 1);
  const crc     = crc16xmodem(data.subarray(0, payload.length + 1));
  data[payload.length + 1] = crc & 0xff;
  data[payload.length + 2] = (crc >> 8) & 0xff;

  // Base32 encode
  let bits = 0, val = 0, out = "";
  for (const byte of data.subarray(0, payload.length + 3)) {
    val  = (val << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out  += BASE32_CHARS[(val >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_CHARS[(val << (5 - bits)) & 31];
  return out;
}

function decodeStrKey(input: string, expectedVersion: number): Uint8Array {
  // base32 decode
  const str  = input.toUpperCase().replace(/=+$/, "");
  let bits   = 0, val = 0;
  const buf: number[] = [];
  for (const char of str) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx < 0) throw new Error(`Invalid base32 char: ${char}`);
    val  = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) { buf.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  const data    = new Uint8Array(buf);
  const payload = data.subarray(1, data.length - 2);
  if (data[0] !== expectedVersion) throw new Error("Wrong StrKey version");
  const crc     = crc16xmodem(data.subarray(0, data.length - 2));
  const lo      = data[data.length - 2];
  const hi      = data[data.length - 1];
  if ((crc & 0xff) !== lo || ((crc >> 8) & 0xff) !== hi) throw new Error("StrKey checksum failed");
  return payload;
}

export function generateKeypair(): WalletInfo {
  const kp        = nacl.sign.keyPair();
  const secretSeed = kp.secretKey.subarray(0, 32);
  return {
    publicKey: encodeStrKey(ED25519_PUBLIC_VERSION, kp.publicKey),
    secretKey: encodeStrKey(ED25519_SECRET_VERSION, secretSeed),
  };
}

export function fromSecret(secret: string): WalletInfo {
  const seed = decodeStrKey(secret.trim(), ED25519_SECRET_VERSION);
  const kp   = nacl.sign.keyPair.fromSeed(seed);
  return {
    publicKey: encodeStrKey(ED25519_PUBLIC_VERSION, kp.publicKey),
    secretKey: secret.trim(),
  };
}

/** Derive just the public key from a secret — lightweight */
export function publicKeyFromSecret(secret: string): string {
  return fromSecret(secret).publicKey;
}
