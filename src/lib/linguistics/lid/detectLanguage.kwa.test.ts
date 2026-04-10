/**
 * detectLanguage.kwa.test.ts
 * LID coverage for KWA languages and Hausa.
 *
 * Coverage:
 *   - detectLanguage() returns short alias codes for ba/ew/mi/di/ha
 *   - resolveLang('auto', text) propagates through KWA texts
 *   - langFamilyMap routing: ba/ew/mi/di → ALGO-KWA
 */

import { describe, it, expect } from 'vitest';
import { detectLanguage, resolveLang } from './detectLanguage';
import { LANG_TO_FAMILY } from '../../../constants/langFamilyMap';

// ─── Stage 2: KWA word-pilot detection ───────────────────────────────────────

describe('detectLanguage — KWA & Hausa word pilots', () => {
  it('detects Baoulé (ba)', () => {
    // Baoulé pilot words expected to be in the LID word list
    const result = detectLanguage("n'gô wla kpli yako i ba klo su tie");
    expect(result).toBe('ba');
  });

  it('detects Ewe (ew)', () => {
    const result = detectLanguage('wo nye ame la kple woƒe xexlẽ ɖe eme');
    expect(result).toBe('ew');
  });

  it('detects Mina/Gen (mi)', () => {
    const result = detectLanguage('nyi amaa bɔ kɔ lɔ mo ye mi');
    expect(result).toBe('mi');
  });

  it('detects Dioula (di)', () => {
    const result = detectLanguage('bɛ tun mogo kama folo minnu bi ko');
    expect(result).toBe('di');
  });

  it('detects Hausa (ha)', () => {
    const result = detectLanguage('ni ina son ka kuma yana da kyau sosai');
    expect(result).toBe('ha');
  });
});

// ─── resolveLang auto-dispatch ────────────────────────────────────────────────

describe('resolveLang — KWA auto dispatch', () => {
  it('resolves Baoulé text to ba when lang=auto', () => {
    expect(resolveLang("n'gô wla kpli yako i ba klo su tie", 'auto')).toBe('ba');
  });

  it('passes through explicit ba code unchanged', () => {
    expect(resolveLang('any text', 'ba')).toBe('ba');
  });

  it('passes through explicit bci code unchanged', () => {
    expect(resolveLang('any text', 'bci')).toBe('bci');
  });
});

// ─── LANG_TO_FAMILY routing ───────────────────────────────────────────────────

describe('langFamilyMap — KWA codes route to ALGO-KWA', () => {
  const KWA_FAMILY = 'ALGO-KWA';

  it.each(['ba', 'ew', 'mi', 'di'])(
    'LANG_TO_FAMILY[%s] === ALGO-KWA',
    (code) => {
      expect(LANG_TO_FAMILY[code]).toBe(KWA_FAMILY);
    }
  );

  it.each(['bci', 'ee', 'gej', 'dyu'])(
    'LANG_TO_FAMILY[%s] === ALGO-KWA (canonical)',
    (code) => {
      expect(LANG_TO_FAMILY[code]).toBe(KWA_FAMILY);
    }
  );

  it('ha routes to correct family (not KWA)', () => {
    // Hausa is Afro-Asiatic/Chadic — confirm it is NOT mapped to ALGO-KWA
    expect(LANG_TO_FAMILY['ha']).not.toBe(KWA_FAMILY);
    expect(LANG_TO_FAMILY['ha']).toBeTruthy();
  });
});
