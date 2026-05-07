import { describe, expect, it } from 'vitest';
import {
  LANGUAGE_GROUPS,
  buildGroupedLanguageOptions,
} from '../useCustomLanguageSelector';
import {
  SUPPORTED_ADAPTATION_LANGUAGES,
  getLanguageDisplay,
} from '../../i18n';

describe('LANGUAGE_GROUPS ↔ SUPPORTED_ADAPTATION_LANGUAGES integrity', () => {
  const adaptationCodes = new Set(
    SUPPORTED_ADAPTATION_LANGUAGES.map(l => l.code.toUpperCase()),
  );
  const groupedCodes = new Set(
    LANGUAGE_GROUPS.flatMap(g => g.codes.map(c => c.toUpperCase())),
  );

  it('contains no phantom codes (every grouped code exists in the adaptation list)', () => {
    const phantoms = [...groupedCodes].filter(c => !adaptationCodes.has(c));
    expect(phantoms).toEqual([]);
  });

  it('has no orphan adaptation languages (every adaptation code is grouped)', () => {
    // Orphan codes silently fall into the catch-all "Other" group, which
    // breaks the family/flag relationship users expect in the dropdown.
    const orphans = [...adaptationCodes].filter(c => !groupedCodes.has(c));
    expect(orphans).toEqual([]);
  });

  it('exposes Dutch and Polish with the correct flags via display lookups', () => {
    expect(getLanguageDisplay('NL')).toMatchObject({ label: 'Dutch', sign: '🇳🇱' });
    expect(getLanguageDisplay('Dutch')).toMatchObject({ label: 'Dutch', sign: '🇳🇱' });
    expect(getLanguageDisplay('PL')).toMatchObject({ label: 'Polish', sign: '🇵🇱' });
    expect(getLanguageDisplay('Polish')).toMatchObject({ label: 'Polish', sign: '🇵🇱' });
  });

  it('surfaces Dutch under Germanic and Polish under Slavic in the grouped picker options', () => {
    const opts = buildGroupedLanguageOptions();
    const findGroupOf = (langId: string): string | undefined => {
      let currentGroup: string | undefined;
      for (const opt of opts) {
        if (typeof opt.value === 'string' && opt.value.startsWith('__group__')) {
          currentGroup = opt.value.replace('__group__', '');
          continue;
        }
        if (opt.value === langId) return currentGroup;
      }
      return undefined;
    };
    // Options are now keyed by langId — the canonical opaque identifier.
    expect(findGroupOf('adapt:NL')).toBe('Germanic');
    expect(findGroupOf('adapt:PL')).toBe('Slavic');
  });
});
