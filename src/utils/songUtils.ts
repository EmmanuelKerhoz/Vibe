import type { Line, Section } from '../types';
import { getSectionFamily } from '../constants/sections';
import { isPureMetaLine, unwrapBracketToken } from './metaUtils';
import { countSyllables } from './syllableUtils';
import { detectRhymeSchemeLocally } from './rhymeSchemeUtils';

export const getSectionText = (section: Section): string =>
  section.lines.map(l => l.text).join('\n');

export const getSongText = (song: Section[]): string =>
  song.map(getSectionText).join('\n\n');

export const getSectionColor = (name: string) => {
  const family = getSectionFamily(name);
  if (family === 'pre-chorus') return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
  if (family === 'chorus') return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
  if (family === 'verse') return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500';
  if (family === 'contrast') return 'bg-violet-500/10 border-violet-500/20 text-violet-500';
  if (family === 'intro' || family === 'outro') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
  return 'bg-zinc-800/50 border-white/10 text-zinc-400';
};

export const getSectionTextColor = (name: string) => {
  const family = getSectionFamily(name);
  if (family === 'pre-chorus') return 'text-orange-500';
  if (family === 'chorus') return 'text-amber-500';
  if (family === 'verse') return 'text-cyan-400';
  if (family === 'contrast') return 'text-violet-500';
  if (family === 'intro' || family === 'outro') return 'text-emerald-500';
  return 'text-zinc-600 dark:text-zinc-400';
};

export const getSectionColorHex = (name: string): string => {
  const family = getSectionFamily(name);
  if (family === 'pre-chorus') return '#f97316';
  if (family === 'chorus') return '#f59e0b';
  if (family === 'verse') return '#06b6d4';
  if (family === 'contrast') return '#a78bfa';
  if (family === 'intro' || family === 'outro') return '#10b981';
  return '#71717a';
};

export const getSectionDotColor = (name: string) => {
  const family = getSectionFamily(name);
  if (family === 'pre-chorus') return 'bg-orange-500';
  if (family === 'chorus') return 'bg-amber-500';
  if (family === 'verse') return 'bg-cyan-500';
  if (family === 'contrast') return 'bg-violet-500';
  if (family === 'intro' || family === 'outro') return 'bg-emerald-500';
  return 'bg-zinc-500';
};

function getRawSchemeLetter(
  sectionOrScheme: Section | string | undefined,
  lineIndex: number,
  rhymeScheme?: string,
): string | null {
  let scheme: string | undefined;
  if (typeof sectionOrScheme === 'object' && sectionOrScheme !== null) {
    scheme = rhymeScheme;
  } else {
    scheme = sectionOrScheme;
  }
  if (!scheme || typeof scheme !== 'string') return null;
  if (scheme.toUpperCase() === 'FREE') return null;
  const upper = scheme.toUpperCase();
  if (upper.length === 0) return null;
  return upper[lineIndex % upper.length] ?? null;
}

export function getSchemeLetterForLine(section: Section, lineIndex: number, rhymeScheme: string): string | null;
export function getSchemeLetterForLine(scheme: string | undefined, lineIndex: number): string | null;
export function getSchemeLetterForLine(
  sectionOrScheme: Section | string | undefined,
  lineIndex: number,
  rhymeScheme?: string,
): string | null {
  const letter = getRawSchemeLetter(sectionOrScheme, lineIndex, rhymeScheme);
  return letter === 'X' ? null : letter;
}

export function getSchemaLabelForLine(section: Section, lineIndex: number, rhymeScheme: string): string | null;
export function getSchemaLabelForLine(scheme: string | undefined, lineIndex: number): string | null;
export function getSchemaLabelForLine(
  sectionOrScheme: Section | string | undefined,
  lineIndex: number,
  rhymeScheme?: string,
): string | null {
  return getRawSchemeLetter(sectionOrScheme, lineIndex, rhymeScheme);
}

export const getRhymeColor = (rhyme: string | null | undefined): string => {
  if (!rhyme || typeof rhyme !== 'string') return 'bg-white/5 text-zinc-500 border-white/10';
  const r = rhyme.toUpperCase();
  if (r === 'A') return 'bg-blue-500/15 text-blue-500 border-blue-500/20';
  if (r === 'B') return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20';
  if (r === 'C') return 'bg-amber-500/15 text-amber-500 border-amber-500/20';
  if (r === 'D') return 'bg-purple-500/15 text-purple-500 border-purple-500/20';
  if (r === 'E') return 'bg-pink-500/15 text-pink-500 border-pink-500/20';
  if (r === 'F') return 'bg-cyan-500/15 text-cyan-500 border-cyan-500/20';
  if (r === 'G') return 'bg-rose-500/15 text-rose-500 border-rose-500/20';
  if (r === 'H') return 'bg-indigo-500/15 text-indigo-500 border-indigo-500/20';
  return 'bg-white/5 text-zinc-500 border-white/10';
};

export const getRhymeTextColor = (rhyme: string | null | undefined): string | null => {
  if (!rhyme || typeof rhyme !== 'string') return null;
  const r = rhyme.toUpperCase();
  if (r === 'A') return '#3b82f6';
  if (r === 'B') return '#10b981';
  if (r === 'C') return '#f59e0b';
  if (r === 'D') return '#a855f7';
  if (r === 'E') return '#ec4899';
  if (r === 'F') return '#06b6d4';
  if (r === 'G') return '#f43f5e';
  if (r === 'H') return '#6366f1';
  return null;
};

export { DEFAULT_STRUCTURE, MUSICAL_INSTRUCTIONS } from '../constants/editor';

export const cleanSectionName = (name: string) => {
  if (!name) return '';
  return (unwrapBracketToken(name) ?? name).replace(/[\[\]\uff3b\uff3d\u3010\u3011\u300c\u300d\u300e\u300f\u3014\u3015\u2329\u232a\u300a\u300b*]/g, '').trim();
};

/**
 * Compute syllable count for a lyric line.
 * Passes the full line text (not word-by-word) so that countSyllables can:
 *  - strip parenthesised content correctly (regex on full line)
 *  - apply language-specific digraph/nasal rules across word boundaries
 */
const computeLineSyllables = (text: string, langCode?: string): number =>
  countSyllables(text, langCode);

export const normalizeLoadedLine = (line: Record<string, unknown>, langCode?: string): Line => {
  const text = typeof line['text'] === 'string' ? line['text'] : '';
  const isMeta = typeof line['isMeta'] === 'boolean' ? line['isMeta'] : isPureMetaLine(text.trim());
  const rawSyllables = typeof line['syllables'] === 'number'
    ? line['syllables']
    : typeof line['syllables'] === 'string'
      ? Number(line['syllables'])
      : NaN;
  const canUseStoredSyllables = Number.isFinite(rawSyllables)
    && (rawSyllables > 0 || isMeta || text.trim().length === 0);
  const syllables = canUseStoredSyllables
    ? rawSyllables
    : (!isMeta && text.trim().length > 0 ? computeLineSyllables(text, langCode) : 0);

  return {
    id: typeof line['id'] === 'string' ? line['id'] : '',
    text,
    rhymingSyllables: typeof line['rhymingSyllables'] === 'string' ? line['rhymingSyllables'] : '',
    rhyme: typeof line['rhyme'] === 'string' ? line['rhyme'] : '',
    syllables,
    concept: typeof line['concept'] === 'string' ? line['concept'] : 'New line',
    isMeta,
    isManual: typeof line['isManual'] === 'boolean' ? line['isManual'] : false,
  };
};

export const normalizeLoadedSection = (section: Record<string, unknown>): Section => {
  const langCode = typeof section['language'] === 'string' ? section['language'] : undefined;
  const lines = Array.isArray(section['lines'])
    ? (section['lines'] as Record<string, unknown>[]).map(l => normalizeLoadedLine(l, langCode))
    : [];
  const storedScheme = typeof section['rhymeScheme'] === 'string' ? section['rhymeScheme'].trim() : '';
  const lyricTexts = lines.filter(line => !line.isMeta && line.text.trim().length > 0).map(line => line.text);
  const detectedScheme = (storedScheme.length === 0 || storedScheme.toUpperCase() === 'FREE')
    ? detectRhymeSchemeLocally(lyricTexts, langCode) ?? undefined
    : undefined;

  const resolvedScheme = detectedScheme ?? (storedScheme || undefined);
  const resolvedTargetSyllables = typeof section['targetSyllables'] === 'number' ? section['targetSyllables'] : undefined;

  return {
    id: typeof section['id'] === 'string' ? section['id'] : '',
    name: cleanSectionName(typeof section['name'] === 'string' ? section['name'] : ''),
    mood: typeof section['mood'] === 'string' ? section['mood'] : '',
    preInstructions: Array.isArray(section['preInstructions']) ? (section['preInstructions'] as string[]) : [],
    postInstructions: Array.isArray(section['postInstructions']) ? (section['postInstructions'] as string[]) : [],
    lines,
    // Conditional spreads: exactOptionalPropertyTypes forbids passing `undefined` to optional props.
    ...(resolvedScheme !== undefined && { rhymeScheme: resolvedScheme }),
    ...(resolvedTargetSyllables !== undefined && { targetSyllables: resolvedTargetSyllables }),
    ...(langCode !== undefined && { language: langCode }),
  };
};
