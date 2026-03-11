import { useState, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { Type } from '@google/genai';
import type { Line, Section } from '../types';
import { AI_MODEL_NAME, getAi, safeJsonParse, handleApiError } from '../utils/aiUtils';
import { cleanSectionName, countSyllables } from '../utils/songUtils';
import { generateId } from '../utils/idUtils';

type UseSongComposerParams = {
  song: Section[];
  structure: string[];
  topic: string;
  mood: string;
  rhymeScheme: string;
  targetSyllables: number;
  title: string;
  genre: string;
  tempo: string;
  instrumentation: string;
  rhythm: string;
  narrative: string;
  setMusicalPrompt: (value: string) => void;
  setGenre: (value: string) => void;
  setTempo: (value: string) => void;
  setInstrumentation: (value: string) => void;
  setRhythm: (value: string) => void;
  setNarrative: (value: string) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
  updateSongWithHistory: (newSong: Section[]) => void;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  saveVersion: (name: string, snapshot?: {
    song: Section[];
    structure: string[];
    title: string;
    titleOrigin: 'user' | 'ai';
    topic: string;
    mood: string;
  }) => void;
  requestAutoTitleGeneration: () => void;
};

const computeSyllables = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((acc, word) => acc + countSyllables(word), 0);

const extractLyricsText = (sections: Section[], limit?: number): string =>
  (limit ? sections.slice(0, limit) : sections)
    .map(s => s.lines.map(l => l.text).join('\n'))
    .join('\n\n');

const SHORT_SECTION_LINE_COUNT = 4;
const LONG_SECTION_LINE_COUNT = 6;

const getDefaultLineCount = (name: string) =>
  name.toLowerCase().includes('verse') || name.toLowerCase().includes('bridge')
    ? LONG_SECTION_LINE_COUNT
    : SHORT_SECTION_LINE_COUNT;

const sectionNamesMatch = (left: string, right: string) => left.toLowerCase() === right.toLowerCase();

const createEmptySection = (name: string, defaultRhymeScheme: string): Section => ({
  id: generateId(),
  name,
  rhymeScheme: defaultRhymeScheme,
  lines: Array(getDefaultLineCount(name))
    .fill(null)
    .map(() => ({
      id: generateId(),
      text: '',
      rhymingSyllables: '',
      rhyme: '',
      syllables: 0,
      concept: 'New line',
    })),
});

const alignGeneratedSongToStructure = (generatedSong: Section[], structure: string[], defaultRhymeScheme: string): Section[] => {
  const remainingSections = [...generatedSong];

  return structure.map(sectionName => {
    const matchingIndex = remainingSections.findIndex(section => sectionNamesMatch(section.name, sectionName));
    let matchedSection: Section | undefined;

    if (matchingIndex === -1) {
      matchedSection = remainingSections.length > 0 ? remainingSections.shift() : undefined;
    } else {
      matchedSection = remainingSections.splice(matchingIndex, 1)[0];
    }

    return matchedSection
      ? { ...matchedSection, name: sectionName }
      : createEmptySection(sectionName, defaultRhymeScheme);
  });
};

const mapSongWithPreservedIds = (newSongData: any[], song: Section[]): Section[] => {
  return newSongData.map((section: any, sectionIndex: number) => {
    const existingSection = song[sectionIndex];

    return {
      ...existingSection,
      ...section,
      id: existingSection?.id || generateId(),
      name: cleanSectionName(section.name),
      lines: (section.lines || []).map((line: any, lineIndex: number) => ({
        ...line,
        id: existingSection?.lines?.[lineIndex]?.id || generateId(),
      })),
    };
  });
};

const mergeAiSectionIntoCurrent = (currentSection: Section, aiSection: any): Section => {
  const mergedName = cleanSectionName(aiSection?.name || currentSection.name);
  const mergedRhymeScheme = aiSection?.rhymeScheme || currentSection.rhymeScheme;
  const mergedLinesSource = Array.isArray(aiSection?.lines) ? aiSection.lines : currentSection.lines;

  return {
    ...currentSection,
    ...aiSection,
    id: currentSection.id,
    name: mergedName,
    rhymeScheme: mergedRhymeScheme,
    lines: mergedLinesSource.map((line: any, index: number) => ({
      ...(currentSection.lines[index] || {}),
      ...line,
      id: currentSection.lines[index]?.id || generateId(),
      text: line?.text ?? currentSection.lines[index]?.text ?? '',
      rhymingSyllables: line?.rhymingSyllables ?? currentSection.lines[index]?.rhymingSyllables ?? '',
      rhyme: line?.rhyme ?? currentSection.lines[index]?.rhyme ?? '',
      syllables: typeof line?.syllables === 'number'
        ? line.syllables
        : computeSyllables(line?.text ?? currentSection.lines[index]?.text ?? ''),
      concept: line?.concept ?? currentSection.lines[index]?.concept ?? 'New line',
    })),
  };
};

export const useSongComposer = ({
  song,
  structure,
  topic,
  mood,
  rhymeScheme,
  targetSyllables,
  title,
  genre,
  tempo,
  instrumentation,
  rhythm,
  narrative,
  setMusicalPrompt,
  setGenre,
  setTempo,
  setInstrumentation,
  setRhythm,
  setNarrative,
  updateState,
  updateSongWithHistory,
  updateSongAndStructureWithHistory,
  saveVersion,
  requestAutoTitleGeneration,
}: UseSongComposerParams) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMusicalPrompt, setIsGeneratingMusicalPrompt] = useState(false);
  const [isAnalyzingLyrics, setIsAnalyzingLyrics] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  // Per-section regeneration tracking — does NOT affect global isGenerating
  const [regeneratingSections, setRegeneratingSections] = useState<Set<string>>(new Set());

  const isRegeneratingSection = useCallback(
    (sectionId: string) => regeneratingSections.has(sectionId),
    [regeneratingSections],
  );

  const updateSong = (transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({
      song: transform(current.song),
      structure: current.structure,
    }));
  };

  const generateSong = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Write a song about "${topic}". 
Mood: ${mood}
Default Rhyme Scheme: ${rhymeScheme}
Target Syllables per line: ${targetSyllables}
Structure: ${structure.join(', ')}

IMPORTANT: You MUST follow the provided structure EXACTLY. Generate exactly the sections listed in the Structure field, in that specific order.

Line counts for sections:
- Intro: 4 lines
- Verse: 6 lines
- Chorus: 4 lines
- Bridge: 6 lines
- Outro: 4 lines

For each section, provide a rhyme scheme (e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE).
For each line, provide the lyric text, the rhyming syllables (e.g., 'ain', 'ight'), the rhyme identifier (e.g., A, B), the exact syllable count, and a short core concept.`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING, description: "The rhyme scheme for this section, e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE" },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhymingSyllables: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING }
                    },
                    required: ["text", "rhymingSyllables", "rhyme", "syllables", "concept"]
                  }
                }
              },
              required: ["name", "lines", "rhymeScheme"]
            }
          }
        }
      });

      const data = safeJsonParse(response.text || '[]', []);
      const songWithIds = data.map((section: any) => ({
        ...section,
        name: cleanSectionName(section.name),
        id: generateId(),
        rhymeScheme: section.rhymeScheme || rhymeScheme,
        lines: section.lines.map((line: any) => ({
          ...line,
          id: generateId()
        }))
      }));
      const orderedSong = alignGeneratedSongToStructure(songWithIds, structure, rhymeScheme);
      updateSongAndStructureWithHistory(orderedSong, structure);
      requestAutoTitleGeneration();
      setSelectedLineId(null);
    } catch (error: any) {
      handleApiError(error, "Failed to generate song. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateSection = async (sectionId: string) => {
    const sectionToRegenerate = song.find(s => s.id === sectionId);
    if (!sectionToRegenerate) return;

    // Mark only this section as regenerating — global isGenerating stays false
    setRegeneratingSections(prev => new Set(prev).add(sectionId));
    try {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      const prevSection = sectionIndex > 0 ? song[sectionIndex - 1] : null;
      const nextSection = sectionIndex < song.length - 1 ? song[sectionIndex + 1] : null;

      let lineCountPrompt = '';
      const lowerName = sectionToRegenerate.name.toLowerCase();
      if (lowerName.includes('intro')) lineCountPrompt = 'The section should have exactly 4 lines.';
      else if (lowerName.includes('verse')) lineCountPrompt = 'The section should have exactly 6 lines.';
      else if (lowerName.includes('chorus')) lineCountPrompt = 'The section should have exactly 4 lines.';
      else if (lowerName.includes('bridge')) lineCountPrompt = 'The section should have exactly 6 lines.';
      else if (lowerName.includes('outro')) lineCountPrompt = 'The section should have exactly 4 lines.';

      const songStructure = song.map(s => s.name).join(' → ');

      const formatSectionLyrics = (sec: Section) =>
        sec.lines.map(l => l.text).filter(Boolean).join('\n');

      const prevContext = prevSection
        ? `\nPrevious section context (${prevSection.name}):\n${formatSectionLyrics(prevSection)}`
        : '';
      const nextContext = nextSection
        ? `\nNext section context (${nextSection.name}):\n${formatSectionLyrics(nextSection)}`
        : '';

      const creativeDirectives = [
        ...(sectionToRegenerate.preInstructions || []),
        ...(sectionToRegenerate.postInstructions || []),
      ];
      const directivesPrompt = creativeDirectives.length > 0
        ? `\nCreative directives:\n${creativeDirectives.map(d => `- ${d}`).join('\n')}`
        : '';

      const prompt = `Rewrite the following section of a song titled "${title}" about "${topic}".
Mood: ${mood}
Target Syllables per line: ${targetSyllables}
Section Name: ${sectionToRegenerate.name}
Rhyme Scheme: ${sectionToRegenerate.rhymeScheme || rhymeScheme}
${lineCountPrompt}
Song structure: ${songStructure}
${prevContext}${nextContext}${directivesPrompt}

Current Section:
${JSON.stringify([sectionToRegenerate], null, 2)}

Provide a new creative version of this section that fits seamlessly with the surrounding sections.
Return the updated section in the exact same JSON structure (as an array with one section).`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING, description: 'The rhyme scheme for this section' },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhymingSyllables: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING }
                    },
                    required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept']
                  }
                }
              },
              required: ['name', 'lines', 'rhymeScheme']
            }
          }
        }
      });

      const data = safeJsonParse(response.text || '[]', []);
      if (data.length > 0) {
        updateSong(currentSong =>
          currentSong.map(section => {
            if (section.id !== sectionId) return section;
            return mergeAiSectionIntoCurrent(section, data[0]);
          })
        );
      }
    } catch (error: any) {
      handleApiError(error, 'Failed to regenerate section. Please try again.');
    } finally {
      setRegeneratingSections(prev => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }
  };

  const quantizeSyllables = async (sectionId?: string) => {
    if (song.length === 0) return;
    setIsGenerating(true);
    try {
      let prompt = '';
      if (sectionId) {
        const sectionToQuantize = song.find(s => s.id === sectionId);
        if (!sectionToQuantize) return;
        const syllables = sectionToQuantize.targetSyllables ?? targetSyllables;
        prompt = `Rewrite the following section of a song so that EVERY line has EXACTLY ${syllables} syllables. Maintain the original meaning, rhyme scheme, and section structure.

Current Section:
${JSON.stringify([sectionToQuantize], null, 2)}

Return the updated section in the exact same JSON structure (as an array with one section).`;
      } else {
        prompt = `Rewrite the following song so that EVERY line has EXACTLY the number of syllables specified by its section's targetSyllables (or ${targetSyllables} if not specified). Maintain the original meaning, rhyme scheme (respecting section-level schemes if specified), and section structure.

Current Song:
${JSON.stringify(song, null, 2)}

Return the updated song in the exact same JSON structure.`;
      }

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING, description: 'The rhyme scheme for this section' },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhymingSyllables: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING }
                    },
                    required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept']
                  }
                }
              },
              required: ['name', 'lines', 'rhymeScheme']
            }
          }
        }
      });

      const data = safeJsonParse(response.text || '[]', []);

      if (sectionId) {
        if (data.length > 0) {
          updateSong(currentSong =>
            currentSong.map(section => {
              if (section.id !== sectionId) return section;
              return mergeAiSectionIntoCurrent(section, data[0]);
            })
          );
        }
      } else {
        const updatedSong = mapSongWithPreservedIds(data, song);
        updateSongWithHistory(updatedSong);
      }
    } catch (error: any) {
      handleApiError(error, 'Failed to quantize syllables. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSuggestions = async (lineId: string) => {
    setIsSuggesting(true);
    setSuggestions([]);

    let currentLine: Line | null = null;
    let previousLine: Line | null = null;
    let nextLine: Line | null = null;
    let sectionName = '';

    for (let s = 0; s < song.length; s++) {
      const section = song[s];
      for (let l = 0; l < section.lines.length; l++) {
        if (section.lines[l].id === lineId) {
          currentLine = section.lines[l];
          sectionName = section.name;
          if (l > 0) previousLine = section.lines[l - 1];
          if (l < section.lines.length - 1) nextLine = section.lines[l + 1];
          break;
        }
      }
      if (currentLine) break;
    }

    if (!currentLine) {
      setIsSuggesting(false);
      return;
    }

    try {
      const prompt = `Generate 3 creative alternative versions for a lyric line.
Context:
- Topic: ${topic}
- Mood: ${mood}
- Rhyme Scheme: ${song.find(s => s.lines.some(l => l.id === lineId))?.rhymeScheme || rhymeScheme}
- Target Syllables: ${targetSyllables}
- Section: ${sectionName}
- Previous Line: "${previousLine?.text || ''}" (Rhyme: ${previousLine?.rhyme || ''})
- Current Line to replace: "${currentLine.text}" (Rhyme: ${currentLine.rhyme}, Concept: ${currentLine.concept})
- Next Line: "${nextLine?.text || ''}" (Rhyme: ${nextLine?.rhyme || ''})

Provide exactly 3 alternative lines that fit the context, mood, and rhyme scheme. Return them as a JSON array of strings.`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const data = safeJsonParse(response.text || '[]', []);
      setSuggestions(data);
    } catch (error) {
      handleApiError(error, 'Failed to generate suggestions.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const updateLineText = (sectionId: string, lineId: string, newText: string) => {
    updateSong(currentSong =>
      currentSong.map(section => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          lines: section.lines.map(line => {
            if (line.id !== lineId) return line;
            return {
              ...line,
              text: newText,
              syllables: computeSyllables(newText),
              isManual: true,
            };
          }),
        };
      })
    );
  };

  const handleLineKeyDown = (e: KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => {
    const target = e.currentTarget;
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    const value = target.value;

    if (e.key === 'Delete' && selectionStart === value.length && selectionEnd === value.length) {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;
      const section = song[sectionIndex];
      const lineIndex = section.lines.findIndex(l => l.id === lineId);
      if (lineIndex === -1 || lineIndex === section.lines.length - 1) return;
      e.preventDefault();
      const nextLine = section.lines[lineIndex + 1];
      const mergedText = value + nextLine.text;
      updateSong(currentSong =>
        currentSong.map(s => {
          if (s.id !== sectionId) return s;
          const newLines = [...s.lines];
          newLines[lineIndex] = { ...newLines[lineIndex], text: mergedText, syllables: computeSyllables(mergedText), isManual: true };
          newLines.splice(lineIndex + 1, 1);
          return { ...s, lines: newLines };
        })
      );
      setTimeout(() => {
        const currentInput = document.querySelector(`input[data-line-id="${lineId}"]`) as HTMLInputElement;
        if (currentInput) { currentInput.focus(); currentInput.setSelectionRange(value.length, value.length); }
      }, 0);
    } else if (e.key === 'Backspace' && selectionStart === 0 && selectionEnd === 0) {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;
      const section = song[sectionIndex];
      const lineIndex = section.lines.findIndex(l => l.id === lineId);
      if (lineIndex <= 0) return;
      e.preventDefault();
      const prevLine = section.lines[lineIndex - 1];
      const mergedText = prevLine.text + value;
      const prevLineId = prevLine.id;
      updateSong(currentSong =>
        currentSong.map(s => {
          if (s.id !== sectionId) return s;
          const newLines = [...s.lines];
          newLines[lineIndex - 1] = { ...newLines[lineIndex - 1], text: mergedText, syllables: computeSyllables(mergedText), isManual: true };
          newLines.splice(lineIndex, 1);
          return { ...s, lines: newLines };
        })
      );
      setSelectedLineId(prevLineId);
      setTimeout(() => {
        const prevInput = document.querySelector(`input[data-line-id="${prevLineId}"]`) as HTMLInputElement;
        if (prevInput) { prevInput.focus(); prevInput.setSelectionRange(prevLine.text.length, prevLine.text.length); }
      }, 0);
    } else if (e.key === 'Enter') {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;
      const section = song[sectionIndex];
      const lineIndex = section.lines.findIndex(l => l.id === lineId);
      if (lineIndex === -1) return;
      e.preventDefault();
      const textBefore = value.substring(0, selectionStart || 0);
      const textAfter = value.substring(selectionEnd || 0);
      const newLineId = generateId();
      updateSong(currentSong =>
        currentSong.map(s => {
          if (s.id !== sectionId) return s;
          const newLines = [...s.lines];
          newLines[lineIndex] = { ...newLines[lineIndex], text: textBefore, syllables: computeSyllables(textBefore), isManual: true };
          newLines.splice(lineIndex + 1, 0, { id: newLineId, text: textAfter, rhymingSyllables: '', rhyme: '', syllables: computeSyllables(textAfter), concept: 'New line', isManual: true });
          return { ...s, lines: newLines };
        })
      );
      setSelectedLineId(newLineId);
      setTimeout(() => {
        const nextInput = document.querySelector(`input[data-line-id="${newLineId}"]`) as HTMLInputElement;
        if (nextInput) { nextInput.focus(); nextInput.setSelectionRange(0, 0); }
      }, 0);
    } else if (e.key === 'ArrowUp') {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;
      const section = song[sectionIndex];
      const lineIndex = section.lines.findIndex(l => l.id === lineId);
      let targetLineId = '';
      if (lineIndex > 0) { targetLineId = section.lines[lineIndex - 1].id; }
      else if (sectionIndex > 0) { const prevSection = song[sectionIndex - 1]; if (prevSection.lines.length > 0) targetLineId = prevSection.lines[prevSection.lines.length - 1].id; }
      if (targetLineId) {
        e.preventDefault();
        setSelectedLineId(targetLineId);
        setTimeout(() => {
          const input = document.querySelector(`input[data-line-id="${targetLineId}"]`) as HTMLInputElement;
          if (input) { input.focus(); const pos = Math.min(selectionStart || 0, input.value.length); input.setSelectionRange(pos, pos); }
        }, 0);
      }
    } else if (e.key === 'ArrowDown') {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;
      const section = song[sectionIndex];
      const lineIndex = section.lines.findIndex(l => l.id === lineId);
      let targetLineId = '';
      if (lineIndex < section.lines.length - 1) { targetLineId = section.lines[lineIndex + 1].id; }
      else if (sectionIndex < song.length - 1) { const nextSection = song[sectionIndex + 1]; if (nextSection.lines.length > 0) targetLineId = nextSection.lines[0].id; }
      if (targetLineId) {
        e.preventDefault();
        setSelectedLineId(targetLineId);
        setTimeout(() => {
          const input = document.querySelector(`input[data-line-id="${targetLineId}"]`) as HTMLInputElement;
          if (input) { input.focus(); const pos = Math.min(selectionStart || 0, input.value.length); input.setSelectionRange(pos, pos); }
        }, 0);
      }
    }
  };

  const applySuggestion = (newText: string) => {
    if (!selectedLineId) return;
    updateSong(currentSong =>
      currentSong.map(section => ({
        ...section,
        lines: section.lines.map(line => {
          if (line.id === selectedLineId) {
            return { ...line, text: newText, syllables: computeSyllables(newText), isManual: true };
          }
          return line;
        })
      }))
    );
  };

  const generateMusicalPrompt = async () => {
    if (!title && !topic) return;
    setIsGeneratingMusicalPrompt(true);
    try {
      const lyricsSnippet = extractLyricsText(song, 3);
      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: `Generate a detailed musical production prompt for an AI music generator (like Suno or Udio).
        Song Title: ${title}
        Topic/Theme: ${topic}
        Mood: ${mood}
        Genre: ${genre}
        Tempo: ${tempo} BPM
        Rhythm & Groove: ${rhythm}
        Instrumentation: ${instrumentation}
        Narrative / Vibe: ${narrative}
        Lyrics:
        ${lyricsSnippet}
        
        Produce a single, concise, highly descriptive prompt (max 200 words) optimized for AI music generators. Capture production style, sonic atmosphere, vocal texture, emotional arc, and arrangement. Do NOT include headers or bullet points -- output only the prompt text.`,
      });
      setMusicalPrompt(response.text || '');
    } catch (error) {
      handleApiError(error, 'Error generating musical prompt.');
    } finally {
      setIsGeneratingMusicalPrompt(false);
    }
  };

  const analyzeLyricsForMusic = async () => {
    if (song.length === 0 && !topic && !mood) return;
    setIsAnalyzingLyrics(true);
    try {
      const lyricsText = extractLyricsText(song);
      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: `Analyze these song lyrics and metadata to suggest detailed musical production parameters for an AI music generator.

Song Title: ${title || '(untitled)'}
Topic/Theme: ${topic || '(not specified)'}
Mood: ${mood || '(not specified)'}
Lyrics:
${lyricsText || '(no lyrics yet)'}

Based on this, provide JSON with exactly these keys:
{
  "genre": "(string) specific genre/style (e.g. Cinematic Pop, Dark Trap, Indie Folk)",
  "tempo": "(string) BPM as a number string (e.g. 95)",
  "instrumentation": "(string) key instruments and sounds (e.g. Warm piano, ambient pads, sparse percussion, distant strings)",
  "rhythm": "(string) rhythmic character (e.g. Slow half-time groove with sparse hi-hats)",
  "narrative": "(string) sonic story arc and vibe (e.g. Starts intimate and raw, builds to an anthemic climax)"
}
Return only valid JSON, no markdown, no explanations.`,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = safeJsonParse<{ genre?: string; tempo?: string; instrumentation?: string; rhythm?: string; narrative?: string }>(response.text || '{}', {});
      if (parsed.genre) setGenre(parsed.genre);
      if (parsed.tempo) setTempo(parsed.tempo);
      if (parsed.instrumentation) setInstrumentation(parsed.instrumentation);
      if (parsed.rhythm) setRhythm(parsed.rhythm);
      if (parsed.narrative) setNarrative(parsed.narrative);
    } catch (error) {
      handleApiError(error, 'Error analyzing lyrics for music suggestions.');
    } finally {
      setIsAnalyzingLyrics(false);
    }
  };

  const handleLineClick = (lineId: string) => {
    if (selectedLineId === lineId) return;
    setSelectedLineId(lineId);
    generateSuggestions(lineId);
  };

  const handleInstructionChange = (sectionId: string, type: 'pre' | 'post', index: number, value: string) => {
    updateSong(currentSong =>
      currentSong.map(section => {
        if (section.id !== sectionId) return section;
        const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
        const instructions = [...(section[key] || [])];
        instructions[index] = value;
        return { ...section, [key]: instructions };
      })
    );
  };

  const addInstruction = (sectionId: string, type: 'pre' | 'post') => {
    updateSong(currentSong =>
      currentSong.map(section => {
        if (section.id !== sectionId) return section;
        const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
        return { ...section, [key]: [...(section[key] || []), ''] };
      })
    );
  };

  const removeInstruction = (sectionId: string, type: 'pre' | 'post', index: number) => {
    updateSong(currentSong =>
      currentSong.map(section => {
        if (section.id !== sectionId) return section;
        const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
        const instructions = [...(section[key] || [])];
        instructions.splice(index, 1);
        return { ...section, [key]: instructions };
      })
    );
  };

  const clearSelection = () => {
    setSelectedLineId(null);
    setSuggestions([]);
  };

  return {
    isGenerating,
    isRegeneratingSection,
    isGeneratingMusicalPrompt,
    isAnalyzingLyrics,
    selectedLineId,
    setSelectedLineId,
    suggestions,
    isSuggesting,
    generateSong,
    regenerateSection,
    quantizeSyllables,
    generateSuggestions,
    updateLineText,
    handleLineKeyDown,
    applySuggestion,
    generateMusicalPrompt,
    analyzeLyricsForMusic,
    handleLineClick,
    handleInstructionChange,
    addInstruction,
    removeInstruction,
    clearSelection,
  };
};
