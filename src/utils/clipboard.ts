// ---------------------------------------------------------------------------
// clipboard.ts
// ---------------------------------------------------------------------------
// Defensive wrapper around the Clipboard API. Centralises the guards we
// need across the app:
//
//   • `navigator.clipboard` is undefined in non-secure contexts (HTTP,
//     sandboxed iframes, some legacy browsers). Calling `.writeText` on it
//     throws `TypeError: Cannot read properties of undefined`. Worse,
//     `navigator.clipboard?.writeText(x).then(…)` *also* throws because
//     the optional-chained call returns `undefined` and `undefined.then`
//     is a TypeError.
//   • Even when `clipboard.writeText` exists, it can reject (permission
//     denied, document not focused, …). Those rejections must not surface
//     as unhandled-promise warnings.
//
// `copyToClipboard()` returns a `Promise<boolean>`: `true` if the value
// was copied, `false` if the clipboard is unavailable or the write failed.
// Callers can use the boolean to decide whether to show a "Copied!" badge.
// ---------------------------------------------------------------------------

/**
 * Attempt to copy `text` to the system clipboard. Always resolves; never
 * rejects. Resolves to `true` on success, `false` otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof text !== 'string' || text.length === 0) return false;

  // Modern API path — only available in secure contexts.
  const clip =
    typeof navigator !== 'undefined' && navigator.clipboard
      ? navigator.clipboard
      : null;
  if (clip && typeof clip.writeText === 'function') {
    try {
      await clip.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path below.
    }
  }

  // Legacy fallback: hidden textarea + execCommand('copy'). Still works in
  // non-secure contexts and in older browsers. Best-effort — silently
  // returns false if anything throws or the command is unsupported.
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return false;
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      // execCommand is deprecated but still the only fallback in non-secure
      // contexts. It is intentionally guarded by a try/catch.
      ok = document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
    return ok;
  } catch {
    return false;
  }
}
