import { useCallback, useEffect, useRef } from 'react';
import { cleanSectionName } from '../utils/songUtils';
import { BRACKET_TOKEN_REGEX, isPureMetaLine, isSectionHeader, isEmptyBracketLine, unwrapBracketToken } from '../utils/metaUtils';
import { generateId } from '../utils/idUtils';
import { countSyllables } from '../utils/syllableUtils';
import { languageNameToCode } from '../constants/langFamilyMap';
import { useSongContext } from '../contexts/SongContext';
import type { EditMode } from '../types';

interface UseMarkupEditorParams {
  editMode: EditMode;
  markupText: string;
  markupTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setEditMode: (v: EditMode) => void;
  setMarkupText: (v: string) => void;
  updateSongAndStructureWithHistory: (song: import('../types').Section[], structure: string[]) => void;
}

/** Returns true if a line text is an artifact that should be excluded from processing. */
const isArtifact = (text: string): boolean => {
  const trimmedText = text.trim();
  return trimmedText === '' || isEmptyBracketLine(trimmedText);
};

/**
 * Splits a raw text line into individual bracketed tokens + plain text.
 * e.g. "[Intro][Deep dry kicks]" → ["[Intro]", "[Deep dry kicks]"]
 * e.g. "[Verse 1]" → ["[Verse 1]"]
 * e.g. "Some lyric text" → ["Some lyric text"]
 */
const tokenizeLine = (rawLine: string): string[] => {
  const trimmed = rawLine.trim();
  const tokenPattern = BRACKET_TOKEN_REGEX;
  tokenPattern.lastIndex = 0;
  const tokens: string[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(trimmed)) !== null) {
    if (match.index > lastIdx) {
      const plain = trimmed.slice(lastIdx, match.index).trim();
      if (plain) tokens.push(plain);
    }
    tokens.push(match[0]);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < trimmed.length) {
    const trailing = trimmed.slice(lastIdx).trim();
    if (trailing) tokens.push(trailing);
  }
  return tokens.length > 0 ? tokens : (trimmed ? [trimmed] : []);
};

export function useMarkupEditor(params: UseMarkupEditorParams) {
  const { song, songLanguage } = useSongContext();
  const lastHydratedMarkupRef = useRef('');
  const previousSongRef = useRef(song);
  const {
    editMode, markupText, markupTextareaRef,
    setEditMode, setMarkupText, updateSongAndStructureWithHistory,
  } = params;
  const normalizedSongLanguage = (languageNameToCode(songLanguage) ?? songLanguage).trim().toLowerCase();
  const markupDirection: 'ltr' | 'rtl' = ['ar', 'he', 'fa', 'ur'].includes(normalizedSongLanguage) ? 'rtl' : 'ltr';

  const scrollToSection = useCallback((section: import('../types').Section) => {
    if (editMode !== 'section') {
      if (!markupTextareaRef.current) return;
      let searchStr = `**[${section.name}]**`;
      let index = markupText.indexOf(searchStr);
      if (index === -1) { searchStr = `[${section.name}]`; index = markupText.indexOf(searchStr); }
      if (index !== -1) {
        const ta = markupTextareaRef.current;
        ta.focus();
        ta.setSelectionRange(index, index + searchStr.length);
        const lineHeight = parseInt(window.getComputedStyle(ta).lineHeight, 10) || 20;
        ta.scrollTop = (markupText.substring(0, index).split('\n').length - 2) * lineHeight;
      }
    } else {
      const el = document.getElementById(`section-${section.id}`);
      if (el) {
        const container = el.closest('.overflow-y-auto');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          container.scrollTo({
            top: container.scrollTop + elRect.top - containerRect.top - 20,
            behavior: 'smooth',
          });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  }, [editMode, markupText, markupTextareaRef]);

  /** Serialize structured song sections into markup text. */
  const serializeSongToMarkup = useCallback(() => {
    const fmt = (i: string) => { const tr = i.trim(); return unwrapBracketToken(tr) ? tr : `[${tr}]`; };
    return song.map(sec => {
      const pre = (sec.preInstructions || []).map(fmt).join('\n');
      const post = (sec.postInstructions || []).map(fmt).join('\n');
      const lyricText = sec.lines
        .filter(l => {
          if (isArtifact(l.text)) return false;
          const trimmedText = l.text.trim();
          const inner = unwrapBracketToken(trimmedText);
          if (inner && isSectionHeader(inner)) return false;
          return true;
        })
        .map(l => l.text)
        .join('\n');
      return `[${sec.name}]\n${pre ? pre + '\n' : ''}${lyricText}${post ? '\n' + post : ''}`;
    }).join('\n\n');
  }, [song]);

  /** Parse markup text back into structured song sections. */
  const parseMarkupToSections = useCallback(() => {
    const rawBlocks = markupText.split(/\n\s*\n/);
    const usedSectionIds = new Set<string>();
    const usedLineIds = new Set<string>();

    return rawBlocks.map((block, blockIndex) => {
      const expandedLines = block
        .trim()
        .split('\n')
        .flatMap(tokenizeLine)
        .filter(tok => tok.trim().length > 0);

      if (expandedLines.length === 0) return null;

      let name = 'Verse';
      let remainingLines = expandedLines;
      const firstToken = (expandedLines[0] ?? '').trim();
      const firstTokenInner = unwrapBracketToken(firstToken);

      if (firstTokenInner && isSectionHeader(firstTokenInner)) {
        name = cleanSectionName(firstTokenInner);
        remainingLines = expandedLines.slice(1);
      }

      const preInstructions: string[] = [];
      const postInstructions: string[] = [];
      const lyricLines: string[] = [];
      let foundLyrics = false;

      remainingLines.forEach(tok => {
        if (isArtifact(tok)) return;
        const trimmed = tok.trim();
        if (unwrapBracketToken(trimmed)) {
          if (isPureMetaLine(trimmed)) {
            foundLyrics = true;
            lyricLines.push(trimmed);
          } else {
            if (foundLyrics) postInstructions.push(trimmed);
            else preInstructions.push(trimmed);
          }
        } else {
          foundLyrics = true;
          lyricLines.push(tok);
        }
      });

      const existingSection = (song[blockIndex] && song[blockIndex]!.name === name)
        ? song[blockIndex]!
        : song.find(s => s.name === name && !usedSectionIds.has(s.id));
      let sectionId = existingSection?.id || generateId();
      if (usedSectionIds.has(sectionId)) sectionId = generateId();
      usedSectionIds.add(sectionId);

      return {
        id: sectionId,
        name,
        rhymeScheme: existingSection?.rhymeScheme ?? 'AABB',
        targetSyllables: existingSection?.targetSyllables ?? 8,
        mood: existingSection?.mood ?? '',
        preInstructions: preInstructions.length > 0 ? preInstructions : (existingSection?.preInstructions || []),
        postInstructions: postInstructions.length > 0 ? postInstructions : (existingSection?.postInstructions || []),
        lines: lyricLines.map((text, lIdx) => {
          const isMeta = isPureMetaLine(text.trim());
          const existingLine = existingSection?.lines.find(l => l.text === text && !usedLineIds.has(l.id))
            || (existingSection?.lines[lIdx] && !usedLineIds.has(existingSection.lines[lIdx]!.id)
              ? existingSection.lines[lIdx]
              : null);
          let lineId = existingLine?.id || generateId();
          if (usedLineIds.has(lineId)) lineId = generateId();
          usedLineIds.add(lineId);
          return {
            id: lineId,
            text,
            rhymingSyllables: existingLine?.rhymingSyllables || '',
            rhyme: existingLine?.rhyme || '',
            syllables: isMeta
              ? 0
              : text.split(/\s+/).reduce((acc, word) => acc + (word ? countSyllables(word) : 0), 0),
            concept: existingLine?.concept || (isMeta ? 'Meta' : 'New line'),
            isManual: true,
            isMeta,
          };
        }),
      };
    }).filter((s): s is NonNullable<typeof s> => s !== null);
  }, [song, markupText]);

  useEffect(() => {
    const songChanged = previousSongRef.current !== song;
    previousSongRef.current = song;

    if (editMode !== 'text' && editMode !== 'markdown') return;

    const serializedSong = serializeSongToMarkup();
    if (!serializedSong.trim()) return;

    if (songChanged) {
      lastHydratedMarkupRef.current = serializedSong;
      if (markupText !== serializedSong) setMarkupText(serializedSong);
      return;
    }

    if (markupText.trim() !== '') {
      lastHydratedMarkupRef.current = serializedSong;
      return;
    }

    if (lastHydratedMarkupRef.current === serializedSong) return;

    lastHydratedMarkupRef.current = serializedSong;
    setMarkupText(serializedSong);
  }, [editMode, markupText, serializeSongToMarkup, setMarkupText, song]);

  const switchEditMode = useCallback((target: EditMode) => {
    if (target === editMode) return;

    // Switching away from section mode → serialize song to text
    if (editMode === 'section' && (target === 'text' || target === 'markdown')) {
      setMarkupText(serializeSongToMarkup());
      setEditMode(target);
      return;
    }

    // Switching to section mode from text or markdown → parse text to structured
    if (target === 'section' && (editMode === 'text' || editMode === 'markdown')) {
      const newSections = parseMarkupToSections();
      if (newSections.length > 0) updateSongAndStructureWithHistory(newSections, newSections.map(s => s.name));
      setEditMode('section');
      return;
    }

    // Switching between text ↔ markdown: no data conversion needed, same text buffer
    setEditMode(target);
  }, [editMode, serializeSongToMarkup, parseMarkupToSections, setEditMode, setMarkupText, updateSongAndStructureWithHistory]);

  // Keep legacy handleMarkupToggle as a convenience (toggles between markdown and section)
  const handleMarkupToggle = useCallback(() => {
    switchEditMode(editMode === 'markdown' ? 'section' : 'markdown');
  }, [editMode, switchEditMode]);

  return { scrollToSection, handleMarkupToggle, switchEditMode, markupDirection };
}
