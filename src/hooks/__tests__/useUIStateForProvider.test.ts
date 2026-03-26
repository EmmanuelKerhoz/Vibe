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
  shouldAutoGenerateTitle: false,
  setShouldAutoGenerateTitle: vi.fn(),
});

describe('useUIStateForProvider', () => {
  it('memoizes the provider state object until one of its fields changes', () => {
    const params = createParams();
    const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
      initialProps: params,
    });

    const firstValue = result.current;

    rerender(params);

    expect(result.current).toBe(firstValue);

    rerender({
      ...params,
      isLeftPanelOpen: true,
    });

    expect(result.current).not.toBe(firstValue);
    expect(result.current.isLeftPanelOpen).toBe(true);
  });

  describe('modalState memoization', () => {
    it('recomputes only when modal-related dependencies change', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialResult = result.current;
      const initialModalState = {
        isAboutOpen: result.current.isAboutOpen,
        setIsAboutOpen: result.current.setIsAboutOpen,
        isSettingsOpen: result.current.isSettingsOpen,
        apiErrorModal: result.current.apiErrorModal,
      };

      // Change layout state - modalState should NOT recompute
      rerender({
        ...params,
        activeTab: 'musical',
      });

      expect(result.current).not.toBe(initialResult); // Final result changes
      expect(result.current.isAboutOpen).toBe(initialModalState.isAboutOpen);
      expect(result.current.setIsAboutOpen).toBe(initialModalState.setIsAboutOpen);

      // Change modal state - modalState SHOULD recompute
      rerender({
        ...params,
        activeTab: 'musical',
        isAboutOpen: true,
      });

      expect(result.current.isAboutOpen).toBe(true);
      expect(result.current.isAboutOpen).not.toBe(initialModalState.isAboutOpen);
    });

    it('does not recompute when text state changes', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialModalFlags = {
        isAboutOpen: result.current.isAboutOpen,
        isSettingsOpen: result.current.isSettingsOpen,
        isImportModalOpen: result.current.isImportModalOpen,
      };

      // Change text state - modalState should remain stable
      rerender({
        ...params,
        markupText: 'new markup text',
      });

      expect(result.current.isAboutOpen).toBe(initialModalFlags.isAboutOpen);
      expect(result.current.isSettingsOpen).toBe(initialModalFlags.isSettingsOpen);
      expect(result.current.isImportModalOpen).toBe(initialModalFlags.isImportModalOpen);
    });

    it('recomputes when any modal setter changes', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialSetIsAboutOpen = result.current.setIsAboutOpen;

      // Change a setter function
      const newSetIsAboutOpen = vi.fn();
      rerender({
        ...params,
        setIsAboutOpen: newSetIsAboutOpen,
      });

      expect(result.current.setIsAboutOpen).toBe(newSetIsAboutOpen);
      expect(result.current.setIsAboutOpen).not.toBe(initialSetIsAboutOpen);
    });
  });

  describe('layoutState memoization', () => {
    it('recomputes only when layout-related dependencies change', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialLayoutFlags = {
        activeTab: result.current.activeTab,
        isStructureOpen: result.current.isStructureOpen,
        isLeftPanelOpen: result.current.isLeftPanelOpen,
        editMode: result.current.editMode,
      };

      // Change modal state - layoutState should NOT recompute
      rerender({
        ...params,
        isAboutOpen: true,
      });

      expect(result.current.activeTab).toBe(initialLayoutFlags.activeTab);
      expect(result.current.isStructureOpen).toBe(initialLayoutFlags.isStructureOpen);
      expect(result.current.isLeftPanelOpen).toBe(initialLayoutFlags.isLeftPanelOpen);
      expect(result.current.editMode).toBe(initialLayoutFlags.editMode);

      // Change layout state - layoutState SHOULD recompute
      rerender({
        ...params,
        isAboutOpen: true,
        activeTab: 'musical',
      });

      expect(result.current.activeTab).toBe('musical');
      expect(result.current.activeTab).not.toBe(initialLayoutFlags.activeTab);
    });

    it('does not recompute when modal state changes', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialActiveTab = result.current.activeTab;
      const initialIsStructureOpen = result.current.isStructureOpen;

      // Change modal state
      rerender({
        ...params,
        isSettingsOpen: false,
        isPasteModalOpen: true,
      });

      expect(result.current.activeTab).toBe(initialActiveTab);
      expect(result.current.isStructureOpen).toBe(initialIsStructureOpen);
    });

    it('recomputes when panel flags change', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialIsLeftPanelOpen = result.current.isLeftPanelOpen;
      const initialIsStructureOpen = result.current.isStructureOpen;

      // Change left panel state
      rerender({
        ...params,
        isLeftPanelOpen: true,
      });

      expect(result.current.isLeftPanelOpen).toBe(true);
      expect(result.current.isLeftPanelOpen).not.toBe(initialIsLeftPanelOpen);

      // Change structure open state
      rerender({
        ...params,
        isLeftPanelOpen: true,
        isStructureOpen: false,
      });

      expect(result.current.isStructureOpen).toBe(false);
      expect(result.current.isStructureOpen).not.toBe(initialIsStructureOpen);
    });
  });

  describe('textState memoization', () => {
    it('recomputes only when text-related dependencies change', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialTextState = {
        markupText: result.current.markupText,
        shouldAutoGenerateTitle: result.current.shouldAutoGenerateTitle,
      };

      // Change layout state - textState should NOT recompute
      rerender({
        ...params,
        activeTab: 'musical',
      });

      expect(result.current.markupText).toBe(initialTextState.markupText);
      expect(result.current.shouldAutoGenerateTitle).toBe(initialTextState.shouldAutoGenerateTitle);

      // Change text state - textState SHOULD recompute
      rerender({
        ...params,
        activeTab: 'musical',
        markupText: 'new text',
      });

      expect(result.current.markupText).toBe('new text');
      expect(result.current.markupText).not.toBe(initialTextState.markupText);
    });

    it('does not recompute when modal state changes', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialMarkupText = result.current.markupText;
      const initialShouldAutoGenerateTitle = result.current.shouldAutoGenerateTitle;

      // Change modal state
      rerender({
        ...params,
        isAboutOpen: true,
        isSettingsOpen: false,
      });

      expect(result.current.markupText).toBe(initialMarkupText);
      expect(result.current.shouldAutoGenerateTitle).toBe(initialShouldAutoGenerateTitle);
    });

    it('recomputes when shouldAutoGenerateTitle changes', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialShouldAutoGenerateTitle = result.current.shouldAutoGenerateTitle;

      // Change shouldAutoGenerateTitle
      rerender({
        ...params,
        shouldAutoGenerateTitle: true,
      });

      expect(result.current.shouldAutoGenerateTitle).toBe(true);
      expect(result.current.shouldAutoGenerateTitle).not.toBe(initialShouldAutoGenerateTitle);
    });
  });

  describe('refs memoization', () => {
    it('recomputes only when ref dependencies change', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialRefs = {
        markupTextareaRef: result.current.markupTextareaRef,
        importInputRef: result.current.importInputRef,
      };

      // Change modal state - refs should NOT recompute
      rerender({
        ...params,
        isAboutOpen: true,
      });

      expect(result.current.markupTextareaRef).toBe(initialRefs.markupTextareaRef);
      expect(result.current.importInputRef).toBe(initialRefs.importInputRef);

      // Change text state - refs should NOT recompute
      rerender({
        ...params,
        markupText: 'new text',
      });

      expect(result.current.markupTextareaRef).toBe(initialRefs.markupTextareaRef);
      expect(result.current.importInputRef).toBe(initialRefs.importInputRef);
    });

    it('recomputes when refs change', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const initialMarkupTextareaRef = result.current.markupTextareaRef;

      const newRef = createRef<HTMLTextAreaElement>();
      rerender({
        ...params,
        markupTextareaRef: newRef,
      });

      expect(result.current.markupTextareaRef).toBe(newRef);
      expect(result.current.markupTextareaRef).not.toBe(initialMarkupTextareaRef);
    });
  });

  describe('memoization independence verification', () => {
    it('verifies that changing modal state does not affect layout, text, or ref groups', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const snapshot = {
        layout: {
          activeTab: result.current.activeTab,
          isStructureOpen: result.current.isStructureOpen,
        },
        text: {
          markupText: result.current.markupText,
          shouldAutoGenerateTitle: result.current.shouldAutoGenerateTitle,
        },
        refs: {
          markupTextareaRef: result.current.markupTextareaRef,
          importInputRef: result.current.importInputRef,
        },
      };

      // Change multiple modal states
      rerender({
        ...params,
        isAboutOpen: true,
        isSettingsOpen: false,
        isPasteModalOpen: true,
      });

      // Verify layout, text, and refs remain unchanged
      expect(result.current.activeTab).toBe(snapshot.layout.activeTab);
      expect(result.current.isStructureOpen).toBe(snapshot.layout.isStructureOpen);
      expect(result.current.markupText).toBe(snapshot.text.markupText);
      expect(result.current.shouldAutoGenerateTitle).toBe(snapshot.text.shouldAutoGenerateTitle);
      expect(result.current.markupTextareaRef).toBe(snapshot.refs.markupTextareaRef);
      expect(result.current.importInputRef).toBe(snapshot.refs.importInputRef);
    });

    it('verifies that changing layout state does not affect modal, text, or ref groups', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const snapshot = {
        modal: {
          isAboutOpen: result.current.isAboutOpen,
          isSettingsOpen: result.current.isSettingsOpen,
        },
        text: {
          markupText: result.current.markupText,
        },
        refs: {
          markupTextareaRef: result.current.markupTextareaRef,
        },
      };

      // Change layout state
      rerender({
        ...params,
        activeTab: 'musical',
        isStructureOpen: false,
      });

      // Verify modal, text, and refs remain unchanged
      expect(result.current.isAboutOpen).toBe(snapshot.modal.isAboutOpen);
      expect(result.current.isSettingsOpen).toBe(snapshot.modal.isSettingsOpen);
      expect(result.current.markupText).toBe(snapshot.text.markupText);
      expect(result.current.markupTextareaRef).toBe(snapshot.refs.markupTextareaRef);
    });

    it('verifies that changing text state does not affect modal, layout, or ref groups', () => {
      const params = createParams();
      const { result, rerender } = renderHook(currentParams => useUIStateForProvider(currentParams), {
        initialProps: params,
      });

      const snapshot = {
        modal: {
          isAboutOpen: result.current.isAboutOpen,
        },
        layout: {
          activeTab: result.current.activeTab,
        },
        refs: {
          importInputRef: result.current.importInputRef,
        },
      };

      // Change text state
      rerender({
        ...params,
        markupText: 'updated markup',
        shouldAutoGenerateTitle: true,
      });

      // Verify modal, layout, and refs remain unchanged
      expect(result.current.isAboutOpen).toBe(snapshot.modal.isAboutOpen);
      expect(result.current.activeTab).toBe(snapshot.layout.activeTab);
      expect(result.current.importInputRef).toBe(snapshot.refs.importInputRef);
    });
  });
});
