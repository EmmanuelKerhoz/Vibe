import React, { useRef, useEffect } from 'react';
import type { Line } from '../../types';
import { useRefs } from '../../contexts/RefsContext';
import { useTranslation } from '../../i18n';
import { splitRhymingSuffix } from '../../utils/rhymeDetection';

interface LyricTextAreaProps {
  line: Line;
  sectionId: string;
  isGenerating: boolean;
  isSelected: boolean;
  rhymePeerTexts: string[];
  schemeLabel: string | null;
  rhymeColor: string;
  lineLanguage?: string;
  sectionTargetLanguage?: string;
  onUpdate: (sectionId: string, lineId: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => void;
  onClick: () => void;
  onBlur?: () => void;
}

export const LyricTextArea = React.memo(function LyricTextArea({
  line,
  sectionId,
  isGenerating,
  isSelected,
  rhymePeerTexts,
  schemeLabel,
  rhymeColor,
  lineLanguage,
  sectionTargetLanguage,
  onUpdate,
  onKeyDown,
  onClick,
  onBlur,
}: LyricTextAreaProps) {
  const { t } = useTranslation();
  const { registerRef } = useRefs();
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isSelected && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  useEffect(() => {
    registerRef(line.id, inputRef.current);
    return () => registerRef(line.id, null);
  }, [line.id, registerRef]);

  useEffect(() => () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onUpdate(sectionId, line.id, e.target.value);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
    onKeyDown(e, sectionId, line.id);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!onBlur) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (related) {
      if (related.dataset.lineId) return;
      if (related.closest('[data-suggestions-panel]')) return;
    }
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(onBlur, 80);
  };

  const rhymeTextColor = schemeLabel ? rhymeColor : null;

  const renderStyledOverlay = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\([^)]*\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        return <span key={i} className="text-amber-400">{part}</span>;
      }
      const isLastPart = i === parts.length - 1;
      if (isLastPart && rhymeTextColor) {
        const langHint = lineLanguage || sectionTargetLanguage;
        const split = splitRhymingSuffix(part, rhymePeerTexts, langHint);
        if (split) {
          return (
            <span key={i}>
              <span className="text-[var(--text-primary)]">{split.before}</span>
              <span style={{ color: rhymeTextColor, fontWeight: 600 }}>{split.rhyme}</span>
            </span>
          );
        }
      }
      return <span key={i} className="text-[var(--text-primary)]">{part}</span>;
    });
  };

  return (
    <div className="relative flex-1 min-w-0" onClick={onClick}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center text-sm font-mono overflow-hidden whitespace-pre"
        style={{ font: 'inherit', letterSpacing: 'inherit' }}
      >
        {renderStyledOverlay(line.text)}
      </div>
      <input
        ref={inputRef}
        data-line-id={line.id}
        type="text"
        value={line.text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={isGenerating}
        placeholder={t.editor?.linePlaceholder ?? 'Write a lyric line\u2026'}
        className="w-full bg-transparent text-sm font-mono text-transparent caret-[color:var(--text-primary)] outline-none border-none focus:ring-0 placeholder:text-[var(--text-secondary)] disabled:cursor-not-allowed relative z-10"
        style={{ font: 'inherit', letterSpacing: 'inherit' }}
        spellCheck
        autoComplete="off"
      />
    </div>
  );
});
