import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown } from '../../ui/icons';
import { useSongHistoryContext } from '../../../contexts/SongHistoryContext';
import { useTranslation } from '../../../i18n';
import type { Section } from '../../../types';

interface Match {
  sectionIndex: number;
  lineIndex: number;
  matchStart: number;
  matchEnd: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function computeMatches(song: Section[], query: string, caseSensitive: boolean): Match[] {
  if (!query) return [];
  const matches: Match[] = [];
  const flags = caseSensitive ? 'g' : 'gi';
  let re: RegExp;
  try {
    re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
  } catch {
    return [];
  }
  song.forEach((section, sectionIndex) => {
    section.lines.forEach((line, lineIndex) => {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line.text)) !== null) {
        matches.push({ sectionIndex, lineIndex, matchStart: m.index, matchEnd: m.index + m[0].length });
        if (m[0].length === 0) re.lastIndex++;
      }
    });
  });
  return matches;
}

export function SearchReplaceModal({ isOpen, onClose }: Props) {
  const { song, updateState } = useSongHistoryContext();
  const { t } = useTranslation();
  const sr = t.searchReplace;

  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [replacedMessage, setReplacedMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const matches = computeMatches(song, query, caseSensitive);
  const totalMatches = matches.length;
  const safeIndex = totalMatches > 0 ? Math.min(currentMatchIndex, totalMatches - 1) : 0;

  // Reset match index when query or caseSensitive changes
  useEffect(() => {
    setCurrentMatchIndex(0);
    setReplacedMessage(null);
  }, [query, caseSensitive]);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const goNext = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex(i => (i + 1) % totalMatches);
  }, [totalMatches]);

  const goPrev = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex(i => (i - 1 + totalMatches) % totalMatches);
  }, [totalMatches]);

  const doReplace = useCallback(() => {
    if (totalMatches === 0) return;
    const match = matches[safeIndex];
    if (!match) return;

    updateState(current => ({
      song: current.song.map((section, si) => {
        if (si !== match.sectionIndex) return section;
        return {
          ...section,
          lines: section.lines.map((line, li) => {
            if (li !== match.lineIndex) return line;
            const newText = line.text.slice(0, match.matchStart) + replaceText + line.text.slice(match.matchEnd);
            return { ...line, text: newText };
          }),
        };
      }),
      structure: current.structure,
    }));

    setReplacedMessage(sr.replacedCount.replace('{count}', '1'));
    // Move to next match after replace
    setCurrentMatchIndex(i => totalMatches > 1 ? i % (totalMatches - 1) : 0);
  }, [matches, safeIndex, replaceText, totalMatches, updateState, sr.replacedCount]);

  const doReplaceAll = useCallback(() => {
    if (totalMatches === 0) return;
    const count = totalMatches;
    const flags = caseSensitive ? 'g' : 'gi';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let re: RegExp;
    try {
      re = new RegExp(escapedQuery, flags);
    } catch {
      return;
    }

    updateState(current => ({
      song: current.song.map(section => ({
        ...section,
        lines: section.lines.map(line => ({
          ...line,
          text: line.text.replace(re, replaceText),
        })),
      })),
      structure: current.structure,
    }));

    setReplacedMessage(sr.replacedCount.replace('{count}', String(count)));
    setCurrentMatchIndex(0);
  }, [query, caseSensitive, replaceText, totalMatches, updateState, sr.replacedCount]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        goPrev();
      } else {
        goNext();
      }
    }
  }, [onClose, goNext, goPrev]);

  if (!isOpen) return null;

  const matchLabel = totalMatches === 0
    ? sr.matchCountNone
    : sr.matchCount
        .replace('{current}', String(safeIndex + 1))
        .replace('{total}', String(totalMatches));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Gradient border wrapper */}
      <div
        className="lcars-gradient-outline relative w-full sm:max-w-lg h-auto rounded-none sm:rounded-[24px_8px_24px_8px] animate-in zoom-in-95 duration-300"
        style={{
          padding: '2px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          isolation: 'isolate',
        }}
      >
        {/* Modal panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={sr.title}
          className="relative w-full flex flex-col dialog-surface rounded-none sm:rounded-[22px_6px_22px_6px] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                <Search className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">
                {sr.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={sr.close}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-app)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Search row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={sr.searchPlaceholder}
                  className="w-full h-9 rounded-[12px_4px_12px_4px] border border-[var(--border-color)] bg-[var(--bg-app)] px-3 pr-16 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
                  spellCheck={false}
                />
                {/* Match count badge */}
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-secondary)] tabular-nums whitespace-nowrap pointer-events-none">
                  {query ? matchLabel : ''}
                </span>
              </div>
              {/* Case sensitive toggle */}
              <button
                type="button"
                onClick={() => setCaseSensitive(v => !v)}
                aria-label={sr.caseSensitive}
                title={sr.caseSensitive}
                className={`h-9 px-2.5 rounded-[12px_4px_12px_4px] border text-[11px] font-bold tracking-wider transition-all ${
                  caseSensitive
                    ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/15 text-[var(--accent-color)]'
                    : 'border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--accent-color)]/50'
                }`}
              >
                Aa
              </button>
              {/* Prev / Next */}
              <button
                type="button"
                onClick={goPrev}
                disabled={totalMatches === 0}
                aria-label={sr.previous}
                title={sr.previous}
                className="h-9 w-9 flex items-center justify-center rounded-[12px_4px_12px_4px] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={totalMatches === 0}
                aria-label={sr.next}
                title={sr.next}
                className="h-9 w-9 flex items-center justify-center rounded-[12px_4px_12px_4px] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Replace row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={replaceText}
                  onChange={e => setReplaceText(e.target.value)}
                  placeholder={sr.replacePlaceholder}
                  className="w-full h-9 rounded-[12px_4px_12px_4px] border border-[var(--border-color)] bg-[var(--bg-app)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)] transition-colors"
                  spellCheck={false}
                />
              </div>
              {/* Replace / Replace All */}
              <button
                type="button"
                onClick={doReplace}
                disabled={totalMatches === 0 || !query}
                aria-label={sr.replace}
                title={sr.replace}
                className="h-9 px-3 flex items-center gap-1.5 rounded-[12px_4px_12px_4px] border border-[var(--border-color)] text-[11px] font-bold tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-color)]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {sr.replace}
              </button>
              <button
                type="button"
                onClick={doReplaceAll}
                disabled={totalMatches === 0 || !query}
                aria-label={sr.replaceAll}
                title={sr.replaceAll}
                className="h-9 px-3 flex items-center gap-1.5 rounded-[12px_4px_12px_4px] border border-[var(--accent-color)]/40 bg-[var(--accent-color)]/10 text-[11px] font-bold tracking-wider text-[var(--accent-color)] hover:bg-[var(--accent-color)]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {sr.replaceAll}
              </button>
            </div>

            {/* Replace feedback message */}
            {replacedMessage && (
              <p className="text-xs text-[var(--accent-color)] animate-in fade-in duration-300">
                {replacedMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
