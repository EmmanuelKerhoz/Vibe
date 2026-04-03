/**
 * useUiPreferences
 *
 * Owns: uiScale, defaultEditMode, showTranslationFeatures — all persisted
 * via safeStorage — plus the fontSize side-effect on <html>.
 * Extracted from useSessionState (Phase-2 domain-hook split).
 */
import { useState, useEffect, useCallback } from 'react';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

const UI_SCALE_KEY = 'vibe_ui_scale';
const DEFAULT_EDIT_MODE_KEY = 'vibe_default_edit_mode';
const SHOW_TRANSLATION_KEY = 'vibe_show_translation';

export function useUiPreferences() {
  // ── UI Scale ──────────────────────────────────────────────────────────────
  const [uiScale, setUiScaleRaw] = useState<'small' | 'medium' | 'large'>(() => {
    const stored = safeGetItem(UI_SCALE_KEY);
    if (stored === 'small' || stored === 'medium') return stored as 'small' | 'medium';
    return 'large';
  });

  const setUiScale = useCallback((v: 'small' | 'medium' | 'large') => {
    setUiScaleRaw(v);
    safeSetItem(UI_SCALE_KEY, v);
  }, []);

  // ── Default Edit Mode ─────────────────────────────────────────────────────
  const [defaultEditMode, setDefaultEditModeRaw] = useState<'text' | 'section' | 'markdown' | 'phonetic'>(() => {
    const stored = safeGetItem(DEFAULT_EDIT_MODE_KEY);
    if (stored === 'section' || stored === 'text' || stored === 'phonetic') return stored;
    return 'markdown';
  });

  const setDefaultEditMode = useCallback((v: 'text' | 'section' | 'markdown' | 'phonetic') => {
    setDefaultEditModeRaw(v);
    safeSetItem(DEFAULT_EDIT_MODE_KEY, v);
  }, []);

  // ── Show Translation Features ─────────────────────────────────────────────
  const [showTranslationFeatures, setShowTranslationFeaturesRaw] = useState<boolean>(() => {
    const stored = safeGetItem(SHOW_TRANSLATION_KEY);
    return stored !== 'false';
  });

  const setShowTranslationFeatures = useCallback((v: boolean) => {
    setShowTranslationFeaturesRaw(v);
    safeSetItem(SHOW_TRANSLATION_KEY, String(v));
  }, []);

  // ── Font size on <html> ───────────────────────────────────────────────────
  useEffect(() => {
    const sizes: Record<string, string> = { small: '12px', medium: '14px', large: '16px' };
    document.documentElement.style.fontSize = sizes[uiScale] ?? '16px';
  }, [uiScale]);

  return {
    uiScale, setUiScale,
    defaultEditMode, setDefaultEditMode,
    showTranslationFeatures, setShowTranslationFeatures,
  };
}
