/**
 * detectLanguage.creole.test.ts
 * LID coverage for Creole / Pidgin languages.
 *
 * Coverage:
 *   - detectLanguage() returns 'nou' / 'pcm' / 'cfg' for creole texts
 *   - resolveLang('auto', text) propagates correctly
 *   - LANG_TO_FAMILY routing: nou/pcm/cfg → ALGO-CRE
 */

import { describe, it, expect } from 'vitest';
import { detectLanguage, resolveLang } from './detectLanguage';
import { LANG_TO_FAMILY } from '../../../constants/langFamilyMap';

// ─── Stage 2: Creole word-pilot detection ────────────────────────────────────

describe('detectLanguage — Creole word pilots', () => {
  it('detects Nouchi (nou)', () => {
    const result = detectLanguage('gnaman yako warra tchamba blaka sawa gbê dé');
    expect(result).toBe('nou');
  });

  it('detects Nigerian Pidgin (pcm)', () => {
    const result = detectLanguage('abeg wahala wetin dey naija palava oga waka');
    expect(result).toBe('pcm');
  });

  it('detects Camfranglais (cfg)', () => {
    const result = detectLanguage('mboa sawa kanda makossa feymania tchamba mbamba ngola');
    expect(result).toBe('cfg');
  });

  it('does not falsely detect nou from pure French text', () => {
    const result = detectLanguage('je suis dans la rue avec mes amis toujours');
    expect(result).toBe('fr');
  });

  it('does not falsely detect pcm from pure English text', () => {
    const result = detectLanguage('the quick brown fox jumps over the lazy dog');
    expect(result).toBe('en');
  });
});

// ─── resolveLang auto-dispatch ────────────────────────────────────────────────

describe('resolveLang — Creole auto dispatch', () => {
  it('resolves Nouchi text to nou when lang=auto', () => {
    expect(resolveLang('gnaman yako warra tchamba blaka sawa gbê dé', 'auto')).toBe('nou');
  });

  it('passes through explicit nou code unchanged', () => {
    expect(resolveLang('any text', 'nou')).toBe('nou');
  });

  it('passes through explicit pcm code unchanged', () => {
    expect(resolveLang('any text', 'pcm')).toBe('pcm');
  });

  it('passes through explicit cfg code unchanged', () => {
    expect(resolveLang('any text', 'cfg')).toBe('cfg');
  });
});

// ─── LANG_TO_FAMILY routing ───────────────────────────────────────────────────

describe('langFamilyMap — Creole codes route to ALGO-CRE', () => {
  const CRE_FAMILY = 'ALGO-CRE';

  it.each(['nou', 'pcm', 'cfg'])(
    'LANG_TO_FAMILY[%s] === ALGO-CRE',
    (code) => {
      expect(LANG_TO_FAMILY[code]).toBe(CRE_FAMILY);
    }
  );
});
