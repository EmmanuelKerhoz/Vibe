import { useState, useCallback, useRef, useEffect } from 'react';
import { Section, SectionVersion } from '../types';
import { generateId } from '../utils/idUtils';

/** Hard cap on stored per-section versions to prevent unbounded memory growth. */
const MAX_SECTION_VERSIONS = 20;

/**
 * djb2 hash — fast non-cryptographic string hash.
 * Consistent with useVersionManager implementation.
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
 * Returns null if the payload contains non-serialisable values.
 */
const deepCloneSection = (section: Section): Section | null => {
  try {
    return JSON.parse(JSON.stringify(section)) as Section;
  } catch {
    return null;
  }
};

interface UseSectionVersionManagerParams {
  initialVersions?: Record<string, SectionVersion[]> | undefined;
}

/**
 * Hook for managing per-section version history.
 * Each section maintains its own independent version stack.
 */
export function useSectionVersionManager(params: UseSectionVersionManagerParams = {}) {
  // Map: sectionId -> array of versions for that section
  const [sectionVersions, setSectionVersions] = useState<Record<string, SectionVersion[]>>(
    () => params.initialVersions ?? {}
  );

  // Track the last fingerprint for each section to detect changes
  const sectionFingerprintsRef = useRef<Record<string, string>>({});

  /**
   * Create a new version snapshot for a section.
   */
  const createSectionVersion = useCallback((
    section: Section,
    name: string,
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

      // Check for duplicate if not explicitly allowed
      if (!options?.allowDuplicate && existingVersions.length > 0) {
        const latestVersion = existingVersions[0];
        if (latestVersion) {
          const normalizedLatest = JSON.stringify(latestVersion.section);
          const normalizedNew = JSON.stringify(clonedSection);
          if (normalizedLatest === normalizedNew) {
            return prev; // Skip duplicate
          }
        }
      }

      const newVersion: SectionVersion = {
        id: generateId(),
        timestamp: Date.now(),
        sectionId: section.id,
        sectionName: section.name,
        section: clonedSection,
        name,
        isAutoSave: options?.isAutoSave ?? false,
      };

      const updatedVersions = [newVersion, ...existingVersions];
      // Trim to MAX_SECTION_VERSIONS
      const trimmedVersions = updatedVersions.length > MAX_SECTION_VERSIONS
        ? updatedVersions.slice(0, MAX_SECTION_VERSIONS)
        : updatedVersions;

      return {
        ...prev,
        [sectionId]: trimmedVersions,
      };
    });
  }, []);

  /**
   * Get all versions for a specific section.
   */
  const getSectionVersions = useCallback((sectionId: string): SectionVersion[] => {
    return sectionVersions[sectionId] || [];
  }, [sectionVersions]);

  /**
   * Save a manual version snapshot for a section.
   */
  const saveSectionVersion = useCallback((section: Section, name?: string) => {
    const versionName = name || `${section.name} - ${new Date().toLocaleTimeString()}`;
    createSectionVersion(section, versionName, { allowDuplicate: true, isAutoSave: false });
  }, [createSectionVersion]);

  /**
   * Auto-save: create a restore point before section changes.
   * Call this before making structural changes to a section.
   */
  const autoSaveSectionVersion = useCallback((section: Section) => {
    // Only auto-save if section has content
    if (section.lines.length === 0) return;

    const currentFingerprint = fingerprintSection(section);
    const lastFingerprint = sectionFingerprintsRef.current[section.id];

    // Create auto-save if fingerprint changed
    if (lastFingerprint && lastFingerprint !== currentFingerprint) {
      createSectionVersion(section, 'Auto Save', { allowDuplicate: false, isAutoSave: true });
    }

    sectionFingerprintsRef.current[section.id] = currentFingerprint;
  }, [createSectionVersion]);

  /**
   * Delete a specific version.
   */
  const deleteSectionVersion = useCallback((sectionId: string, versionId: string) => {
    setSectionVersions(prev => {
      const versions = prev[sectionId] || [];
      const filtered = versions.filter(v => v.id !== versionId);
      if (filtered.length === 0) {
        const { [sectionId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [sectionId]: filtered,
      };
    });
  }, []);

  /**
   * Clear all versions for a specific section.
   */
  const clearSectionVersions = useCallback((sectionId: string) => {
    setSectionVersions(prev => {
      const { [sectionId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Get count of versions for a section.
   */
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
