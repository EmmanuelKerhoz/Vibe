/**
 * Privacy helpers: hashing & redaction. Used to persist suspicious spans
 * without keeping raw lyrics in client-side storage.
 */

const textEncoder = new TextEncoder();

const toHex = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const b = bytes[i] ?? 0;
    out += b.toString(16).padStart(2, '0');
  }
  return out;
};

/**
 * Synchronous FNV-1a 64-bit hash (returned as 16-char hex). Used as a
 * deterministic fallback in non-secure-context environments and as a
 * cheap fingerprint in unit tests.
 */
export const fnv1a64Hex = (input: string): string => {
  // Use BigInt to avoid 53-bit precision loss.
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < input.length; i += 1) {
    h ^= BigInt(input.charCodeAt(i));
    h = (h * prime) & mask;
  }
  return h.toString(16).padStart(16, '0');
};

/**
 * SHA-256 hex digest of `input`. Falls back to `fnv1a64Hex` when the
 * SubtleCrypto API is unavailable (e.g. test runners without a secure
 * context); the fallback is clearly distinguishable by length (16 vs 64).
 */
export const sha256Hex = async (input: string): Promise<string> => {
  const subtle: SubtleCrypto | undefined =
    (typeof globalThis !== 'undefined' &&
      (globalThis as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle) ||
    undefined;
  if (!subtle) return fnv1a64Hex(input);
  const buf = await subtle.digest('SHA-256', textEncoder.encode(input));
  return toHex(buf);
};

/**
 * Truncate text for UI display in a safe, non-misleading way: collapses
 * whitespace, then trims to `maxChars` and appends an ellipsis if cut.
 */
export const redactExcerpt = (text: string, maxChars: number): string => {
  if (maxChars <= 0) return '';
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, Math.max(0, maxChars - 1))}…`;
};
