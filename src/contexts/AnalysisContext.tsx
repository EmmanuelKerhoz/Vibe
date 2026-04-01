import React, { createContext, useContext, useRef, type ReactNode } from 'react';
import type { RefObject } from 'react';
import type { Section } from '../types';
import { useSongAnalysis } from '../hooks/useSongAnalysis';
import { useModalDispatch } from './ModalContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AnalysisContextValue = ReturnType<typeof useSongAnalysis>;

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

// ── Provider props ────────────────────────────────────────────────────────────

interface AnalysisProviderProps {
  children: ReactNode;
  uiLanguage: string;
  isGeneratingRef: RefObject<boolean>;
  hasApiKey: boolean;
  saveVersion: (name: string, snapshot?: {
    song: Section[];
    structure: string[];
    title: string;
    titleOrigin: 'user' | 'ai';
    topic: string;
    mood: string;
  }) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  clearLineSelection: () => void;
  requestAutoTitleGeneration: () => void;
}

/**
 * AnalysisProvider
 * Owns useSongAnalysis. Bridges setIsPasteModalOpen / setIsAnalysisModalOpen
 * through ModalContext dispatch (stable refs — preserves fix #399).
 * Must be mounted inside <ModalProvider>.
 */
export function AnalysisProvider({
  children,
  uiLanguage,
  isGeneratingRef,
  hasApiKey,
  saveVersion,
  updateState,
  updateSongAndStructureWithHistory,
  clearLineSelection,
  requestAutoTitleGeneration,
}: AnalysisProviderProps) {
  const { openModal, closeModal } = useModalDispatch();

  // Stable callback refs so useSongAnalysis dependency arrays stay stable
  // even if openModal/closeModal identity changes (it shouldn't, but defensive).
  const openPasteRef = useRef(() => openModal('paste'));
  openPasteRef.current = () => openModal('paste');
  const closePasteRef = useRef(() => closeModal('paste'));
  closePasteRef.current = () => closeModal('paste');
  const openAnalysisRef = useRef(() => openModal('analysis'));
  openAnalysisRef.current = () => openModal('analysis');

  const setIsPasteModalOpen = useRef((v: boolean) => {
    if (v) openPasteRef.current();
    else closePasteRef.current();
  }).current;

  const setIsAnalysisModalOpen = useRef((v: boolean) => {
    if (v) openAnalysisRef.current();
  }).current;

  const value = useSongAnalysis({
    uiLanguage,
    isGeneratingRef,
    hasApiKey,
    saveVersion,
    updateState,
    updateSongAndStructureWithHistory,
    clearLineSelection,
    requestAutoTitleGeneration,
    setIsPasteModalOpen,
    setIsAnalysisModalOpen,
  });

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

export function useAnalysisContext(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysisContext must be used inside <AnalysisProvider>');
  return ctx;
}
