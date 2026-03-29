/**
 * useUIStateForProvider — test suite (flat-memo contract)
 *
 * Aligns with the PR-2 implementation: a single flat useMemo whose
 * dependency array lists every field individually. There are no internal
 * sub-groups (modalState / layoutState / textState / refs) — those were
 * an implementation detail of the previous version and no longer exist.
 *
 * Contract under test:
 *   1. Same object reference when no dependency changes.
 *   2. New object reference when any dependency changes.
 *   3. Values are correctly propagated to the returned bag.
 *   4. useState setters (referentially stable by React guarantee) do not
 *      cause invalidation on their own.
 *   5. Individual field independence — changing field X does not alter
 *      the value of unrelated field Y (verified by value, not by
 *      sub-object identity, since there are no sub-objects).
 */
import { createRef } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UIStateBag } from '../../contexts/ModalContext';
import { useUIStateForProvider } from '../useUIStateForProvider';

const createParams = (): UIStateBag => ({
  setIsAboutOpen: vi.fn(),
  setIsSettingsOpen: vi.fn(),
  setApiErrorModal: vi.fn(),
  setIsImportModalOpen: vi.fn(),
  setIsExportModalOpen: vi.fn(),
  setIsSectionDropdownOpen: vi.fn(),
  setIsSimilarityModalOpen: vi.fn(),
  setIsSaveToLibraryModalOpen: vi.fn(),
  setIsVersionsModalOpen: vi.fn(),
  setIsResetModalOpen: vi.fn(),
  setIsKeyboardShortcutsModalOpen: vi.fn(),
  setConfirmModal: vi.fn(),
  setPromptModal: vi.fn(),
  setIsPasteModalOpen: vi.fn(),
  setIsAnalysisModalOpen: vi.fn(),
  setIsSearchReplaceOpen: vi.fn(),
  setEditMode: vi.fn(),
  isAboutOpen: false,
  isSettingsOpen: true,
  apiErrorModal: { open: false, message: '' },
  isImportModalOpen: false,
  isExportModalOpen: true,
  isSectionDropdownOpen: false,
  isSimilarityModalOpen: true,
  isSaveToLibraryModalOpen: false,
  isVersionsModalOpen: true,
  isResetModalOpen: false,
  isKeyboardShortcutsModalOpen: false,
  confirmModal: null,
  promptModal: null,
  isPasteModalOpen: false,
  isAnalysisModalOpen: false,
  isSearchReplaceOpen: false,
  activeTab: 'lyrics',
  setActiveTab: vi.fn(),
  isStructureOpen: true,
  setIsStructureOpen: vi.fn(),
  isLeftPanelOpen: false,
  setIsLeftPanelOpen: vi.fn(),
  editMode: 'section' as const,
  markupText: 'markup',
  setMarkupText: vi.fn(),
  markupTextareaRef: createRef<HTMLTextAreaElement>(),
  importInputRef: createRef<HTMLInputElement>(),
});

describe('useUIStateForProvider — flat-memo contract', () => {

  // ── 1. Stability ──────────────────────────────────────────────────────────

  it('returns the same reference when no dependency changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const first = result.current;
    rerender(params);
    expect(result.current).toBe(first);
  });

  // ── 2. Invalidation on value change ───────────────────────────────────────

  it('returns a new reference when a boolean state field changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const first = result.current;
    rerender({ ...params, isLeftPanelOpen: true });
    expect(result.current).not.toBe(first);
    expect(result.current.isLeftPanelOpen).toBe(true);
  });

  it('returns a new reference when activeTab changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const first = result.current;
    rerender({ ...params, activeTab: 'musical' });
    expect(result.current).not.toBe(first);
    expect(result.current.activeTab).toBe('musical');
  });

  it('returns a new reference when markupText changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const first = result.current;
    rerender({ ...params, markupText: 'updated text' });
    expect(result.current).not.toBe(first);
    expect(result.current.markupText).toBe('updated text');
  });

  it('returns a new reference when a modal flag changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const first = result.current;
    rerender({ ...params, isAboutOpen: true });
    expect(result.current).not.toBe(first);
    expect(result.current.isAboutOpen).toBe(true);
  });

  it('returns a new reference when a ref changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const first = result.current;
    const newRef = createRef<HTMLTextAreaElement>();
    rerender({ ...params, markupTextareaRef: newRef });
    expect(result.current).not.toBe(first);
    expect(result.current.markupTextareaRef).toBe(newRef);
  });

  it('returns a new reference when a setter function changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const first = result.current;
    const newSetter = vi.fn();
    rerender({ ...params, setIsAboutOpen: newSetter });
    expect(result.current).not.toBe(first);
    expect(result.current.setIsAboutOpen).toBe(newSetter);
  });

  // ── 3. Value propagation ──────────────────────────────────────────────────

  it('propagates all initial values correctly', () => {
    const params = createParams();
    const { result } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    expect(result.current.isAboutOpen).toBe(false);
    expect(result.current.isSettingsOpen).toBe(true);
    expect(result.current.activeTab).toBe('lyrics');
    expect(result.current.editMode).toBe('section');
    expect(result.current.markupText).toBe('markup');
    expect(result.current.isLeftPanelOpen).toBe(false);
    expect(result.current.isStructureOpen).toBe(true);
  });

  // ── 4. Setter stability — stable setters should not cause invalidation ─────

  it('does not invalidate when the same setter reference is passed again', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const first = result.current;
    // Re-pass identical param object — all setters are the same vi.fn() references
    rerender({ ...params });
    expect(result.current).toBe(first);
  });

  // ── 5. Field independence (value-level, flat memo) ────────────────────────

  it('does not alter modal fields when only layout fields change', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const snap = {
      isAboutOpen: result.current.isAboutOpen,
      isSettingsOpen: result.current.isSettingsOpen,
      isImportModalOpen: result.current.isImportModalOpen,
    };
    rerender({ ...params, activeTab: 'musical', isStructureOpen: false });
    expect(result.current.isAboutOpen).toBe(snap.isAboutOpen);
    expect(result.current.isSettingsOpen).toBe(snap.isSettingsOpen);
    expect(result.current.isImportModalOpen).toBe(snap.isImportModalOpen);
  });

  it('does not alter layout fields when only modal flags change', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const snap = {
      activeTab: result.current.activeTab,
      isStructureOpen: result.current.isStructureOpen,
      isLeftPanelOpen: result.current.isLeftPanelOpen,
      editMode: result.current.editMode,
    };
    rerender({ ...params, isAboutOpen: true, isSettingsOpen: false, isPasteModalOpen: true });
    expect(result.current.activeTab).toBe(snap.activeTab);
    expect(result.current.isStructureOpen).toBe(snap.isStructureOpen);
    expect(result.current.isLeftPanelOpen).toBe(snap.isLeftPanelOpen);
    expect(result.current.editMode).toBe(snap.editMode);
  });

  it('does not alter modal or layout fields when only markupText changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const snap = {
      isAboutOpen: result.current.isAboutOpen,
      activeTab: result.current.activeTab,
      importInputRef: result.current.importInputRef,
    };
    rerender({ ...params, markupText: 'changed' });
    expect(result.current.isAboutOpen).toBe(snap.isAboutOpen);
    expect(result.current.activeTab).toBe(snap.activeTab);
    expect(result.current.importInputRef).toBe(snap.importInputRef);
  });

  it('does not alter text or modal fields when only refs change', () => {
    const params = createParams();
    const { result, rerender } = renderHook(
      (p: UIStateBag) => useUIStateForProvider(p),
      { initialProps: params },
    );
    const snap = {
      markupText: result.current.markupText,
      isAboutOpen: result.current.isAboutOpen,
    };
    const newRef = createRef<HTMLTextAreaElement>();
    rerender({ ...params, markupTextareaRef: newRef });
    expect(result.current.markupText).toBe(snap.markupText);
    expect(result.current.isAboutOpen).toBe(snap.isAboutOpen);
    expect(result.current.markupTextareaRef).toBe(newRef);
  });
});
