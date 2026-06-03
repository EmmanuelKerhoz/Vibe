import React, { createContext, useContext, type ReactNode } from 'react';
import { useSectionVersionManager } from '../hooks/useSectionVersionManager';
import type { Section, SectionVersion } from '../types';

interface SectionVersionContextValue {
  sectionVersions: Record<string, SectionVersion[]>;
  getSectionVersions: (sectionId: string) => SectionVersion[];
  saveSectionVersion: (section: Section, name?: string) => void;
  autoSaveSectionVersion: (section: Section) => void;
  deleteSectionVersion: (sectionId: string, versionId: string) => void;
  clearSectionVersions: (sectionId: string) => void;
  getSectionVersionCount: (sectionId: string) => number;
}

const SectionVersionContext = createContext<SectionVersionContextValue | null>(null);

export function SectionVersionProvider({
  children,
  initialVersions
}: {
  children: ReactNode;
  initialVersions?: Record<string, SectionVersion[]> | undefined;
}) {
  const {
    sectionVersions,
    getSectionVersions,
    saveSectionVersion,
    autoSaveSectionVersion,
    deleteSectionVersion,
    clearSectionVersions,
    getSectionVersionCount,
  } = useSectionVersionManager({ initialVersions });

  return (
    <SectionVersionContext.Provider
      value={{
        sectionVersions,
        getSectionVersions,
        saveSectionVersion,
        autoSaveSectionVersion,
        deleteSectionVersion,
        clearSectionVersions,
        getSectionVersionCount,
      }}
    >
      {children}
    </SectionVersionContext.Provider>
  );
}

export function useSectionVersionContext(): SectionVersionContextValue {
  const ctx = useContext(SectionVersionContext);
  if (!ctx) throw new Error('useSectionVersionContext must be used inside <SectionVersionProvider>');
  return ctx;
}

export function useOptionalSectionVersionContext(): SectionVersionContextValue | null {
  return useContext(SectionVersionContext);
}
