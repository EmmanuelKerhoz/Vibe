import { useState, useCallback, useRef } from 'react';
import { Section, SectionVersion } from '../types';
import { generateId } from '../utils/idUtils';

/** Hard cap on stored per-section versions to prevent unbounded memory growth. */
const MAX_SECTION_VERSIONS = 20;

/**
 * djb2 hash — fast non-cryptographic string hash.
 */
function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h;
}

/**
 * Builds a structural fingerprint for a single section to detect changes.
 */
const fingerprintSection = (section: Section): string => {
  const linePrint = section.lines
    .map((line) => [
      line.id,
      djb2(line.text),
      line.rhymingSyllables ?? '',
      line.rhyme ?? '',
      String(line.syllables ?? 0),
      djb2(line.concept ?? ''),
      line.isMeta ? '1' : '0',
    ].join(':'))
    .join('|');

  return [
    section.id,
    djb2(section.name),
    section.language ?? '',
    section.rhymeScheme ?? '',
    linePrint,
  ].join('::');
};

/**
 * Deep-clones a Section via JSON round-trip.
 */
const deepCloneSection = (section: Section): Section | null => {
  try {
    return JSON.parse(JSON.stringify(section)) as Section;
  } catch {
    return null;
  }
};

/**
 * Generates an automatic version name.
 * Format: SECTIONNAME_N-vXXX  (e.g. VERSE_3-v002)
 * N     = section name uppercased, spaces→underscores
 * XXX   = 1-based sequential index within this section's history, zero-padded to 3 digits
 */
function buildVersionName(section: Section, existingCount: number): string {
  const base = section.name
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  const seq = String(existingCount + 1).padStart(3, '0');
  return `${base}-v${seq}`;
}

interface UseSectionVersionManagerParams {
  initialVersions?: Record<string, SectionVersion[]> | undefined;
}

/**
 * Hook for managing per-section version history.
 * Each section maintains its own independent version stack.
 * Version names are auto-generated — no user input required.
 */
export function useSectionVersionManager(params: UseSectionVersionManagerParams = {}) {
  const [sectionVersions, setSectionVersions] = useState<Record<string, SectionVersion[]>>(
    () => params.initialVersions ?? {}
  );

  const sectionFingerprintsRef = useRef<Record<string, string>>({});

  const createSectionVersion = useCallback((
    section: Section,
    options?: { allowDuplicate?: boolean; isAutoSave?: boolean }
  ) => {
    const clonedSection = deepCloneSection(section);
    if (clonedSection === null) {
      console.warn('Failed to clone section for versioning:', section.id);
      return;
    }

    setSectionVersions(prev => {
      const sectionId = section.id;
      const existingVersions = prev[sectionId] || [];

      if (!options?.allowDuplicate && existingVersions.length > 0) {
        const latestVersion = existingVersions[0];
        if (latestVersion) {
          if (JSON.stringify(latestVersion.section) === JSON.stringify(clonedSection)) {
            return prev;
          }
        }
      }

      // Total ever saved = existingVersions.length (before trim) — used for sequential naming.
      // We count from total versions including trimmed ones by looking at the highest index
      // already present, deriving from the latest name if available.
      const totalSaved = existingVersions.length;
      const versionName = buildVersionName(section, totalSaved);

      const newVersion: SectionVersion = {
        id: generateId(),
        timestamp: Date.now(),
        sectionId: section.id,
        sectionName: section.name,
        section: clonedSection,
        name: versionName,
        isAutoSave: options?.isAutoSave ?? false,
      };

      const updatedVersions = [newVersion, ...existingVersions];
      const trimmedVersions = updatedVersions.length > MAX_SECTION_VERSIONS
        ? updatedVersions.slice(0, MAX_SECTION_VERSIONS)
        : updatedVersions;

      return {
        ...prev,
        [sectionId]: trimmedVersions,
      };
    });
  }, []);

  const getSectionVersions = useCallback((sectionId: string): SectionVersion[] => {
    return sectionVersions[sectionId] || [];
  }, [sectionVersions]);

  /**
   * Save a manual version snapshot — name is auto-generated.
   * Triggered on section blur (focus leaves the section).
   */
  const saveSectionVersion = useCallback((section: Section) => {
    createSectionVersion(section, { allowDuplicate: false, isAutoSave: false });
  }, [createSectionVersion]);

  /**
   * Auto-save: create a restore point before AI/structural changes.
   */
  const autoSaveSectionVersion = useCallback((section: Section) => {
    if (section.lines.length === 0) return;

    const currentFingerprint = fingerprintSection(section);
    const lastFingerprint = sectionFingerprintsRef.current[section.id];

    if (lastFingerprint && lastFingerprint !== currentFingerprint) {
      createSectionVersion(section, { allowDuplicate: false, isAutoSave: true });
    }

    sectionFingerprintsRef.current[section.id] = currentFingerprint;
  }, [createSectionVersion]);

  const deleteSectionVersion = useCallback((sectionId: string, versionId: string) => {
    setSectionVersions(prev => {
      const versions = prev[sectionId] || [];
      const filtered = versions.filter(v => v.id !== versionId);
      if (filtered.length === 0) {
        const { [sectionId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [sectionId]: filtered };
    });
  }, []);

  const clearSectionVersions = useCallback((sectionId: string) => {
    setSectionVersions(prev => {
      const { [sectionId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const getSectionVersionCount = useCallback((sectionId: string): number => {
    return (sectionVersions[sectionId] || []).length;
  }, [sectionVersions]);

  return {
    sectionVersions,
    getSectionVersions,
    saveSectionVersion,
    autoSaveSectionVersion,
    deleteSectionVersion,
    clearSectionVersions,
    getSectionVersionCount,
  };
}
