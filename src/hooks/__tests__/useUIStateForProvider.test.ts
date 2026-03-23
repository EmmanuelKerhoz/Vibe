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
  setIsMarkupMode: vi.fn(),
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
  activeTab: 'lyrics',
  setActiveTab: vi.fn(),
  isStructureOpen: true,
  setIsStructureOpen: vi.fn(),
  isLeftPanelOpen: false,
  setIsLeftPanelOpen: vi.fn(),
  isMarkupMode: false,
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
});
