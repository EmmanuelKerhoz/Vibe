import React, { createContext, useContext, type ReactNode } from 'react';
import { useVersionManager } from '../hooks/useVersionManager';
import { useAppStateContext } from './AppStateContext';
import type { SongVersion } from '../types';
import type { VersionSnapshot } from '../utils/songDefaults';

interface VersionContextValue {
  versions: SongVersion[];
  saveVersion: (name: string, snapshot?: VersionSnapshot) => void;
  rollbackToVersion: (version: SongVersion) => void;
  handleRequestVersionName: (callback: (name: string) => void) => void;
}

const VersionContext = createContext<VersionContextValue | null>(null);

export function VersionProvider({ children }: { children: ReactNode }) {
  const { appState } = useAppStateContext();
  const { setIsVersionsModalOpen, setPromptModal, updateSongAndStructureWithHistory } = appState;

  const { versions, saveVersion, rollbackToVersion, handleRequestVersionName } = useVersionManager({
    updateSongAndStructureWithHistory,
    setIsVersionsModalOpen,
    setPromptModal,
  });

  return (
    <VersionContext.Provider value={{ versions, saveVersion, rollbackToVersion, handleRequestVersionName }}>
      {children}
    </VersionContext.Provider>
  );
}

export function useVersionContext(): VersionContextValue {
  const ctx = useContext(VersionContext);
  if (!ctx) throw new Error('useVersionContext must be used inside <VersionProvider>');
  return ctx;
}
