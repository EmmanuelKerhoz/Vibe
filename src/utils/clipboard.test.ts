import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard;
  const originalExecCommand = document.execCommand;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: originalClipboard,
    });
    document.execCommand = originalExecCommand;
    vi.restoreAllMocks();
  });

  it('returns false for empty / non-string input without touching the clipboard', async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText },
    });
    expect(await copyToClipboard('')).toBe(false);
    // @ts-expect-error testing runtime guard against non-string input
    expect(await copyToClipboard(undefined)).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText },
    });
    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when navigator.clipboard is undefined', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec as unknown as typeof document.execCommand;
    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('falls back to execCommand when writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText },
    });
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec as unknown as typeof document.execCommand;
    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalled();
  });

  it('returns false when both clipboard API and execCommand fail', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    document.execCommand = vi.fn().mockReturnValue(false) as unknown as typeof document.execCommand;
    expect(await copyToClipboard('hello')).toBe(false);
  });

  it('never throws — even when execCommand throws', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    document.execCommand = vi.fn(() => { throw new Error('boom'); }) as unknown as typeof document.execCommand;
    await expect(copyToClipboard('hello')).resolves.toBe(false);
  });
});

// Regression: previous code did `navigator.clipboard?.writeText(x).then(...)`
// which throws TypeError when `clipboard` is undefined. The helper must
// resolve cleanly in that scenario.
describe('copyToClipboard (regression)', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    document.execCommand = vi.fn().mockReturnValue(true) as unknown as typeof document.execCommand;
  });

  it('does not throw when navigator.clipboard is undefined', async () => {
    await expect(copyToClipboard('payload')).resolves.toBe(true);
  });
});
