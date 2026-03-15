import { useState, useEffect } from 'react';
import { Type } from '@google/genai';
import { AI_MODEL_NAME, getAi, safeJsonParse } from '../../utils/aiUtils';
import { mapSongWithPreservedIds, mergeAiSectionIntoCurrent } from '../../utils/songMergeUtils';
import type { Section } from '../../types';

type SaveVersionFn = (name: string, snapshot?: {
  song: Section[];
  structure: string[];
  title: string;
  titleOrigin: 'user' | 'ai';
  topic: string;
  mood: string;
}) => void;

type UseLanguageAdapterParams = {
  song: Section[];
  uiLanguage: string;
  saveVersion: SaveVersionFn;
  updateSongAndStructureWithHistory: (newSong: Section[], newStructure: string[]) => void;
  updateState: (recipe: (current: { song: Section[]; structure: string[] }) => { song: Section[]; structure: string[] }) => void;
};

export const useLanguageAdapter = ({
  song,
  uiLanguage,
  saveVersion,
  updateSongAndStructureWithHistory,
  updateState,
}: UseLanguageAdapterParams) => {
  const [songLanguage, setSongLanguage] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [sectionTargetLanguages, setSectionTargetLanguages] = useState<Record<string, string>>({});
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [isAdaptingLanguage, setIsAdaptingLanguage] = useState(false);

  const uiLang = uiLanguage === 'fr' ? 'French'
    : uiLanguage === 'es' ? 'Spanish'
    : uiLanguage === 'de' ? 'German'
    : uiLanguage === 'pt' ? 'Portuguese'
    : uiLanguage === 'ar' ? 'Arabic'
    : uiLanguage === 'zh' ? 'Chinese'
    : uiLanguage === 'ko' ? 'Korean'
    : 'English';

  // Auto-detect language when song is loaded and language is not yet known
  useEffect(() => {
    if (song.length > 0 && !songLanguage) {
      detectLanguage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.length]);

  const updateSong = (transform: (currentSong: Section[]) => Section[]) => {
    updateState(current => ({
      song: transform(current.song),
      structure: current.structure,
    }));
  };

  const detectLanguage = async () => {
    if (song.length === 0) return;
    setIsDetectingLanguage(true);
    try {
      const songText = song.map(s => s.lines.map(l => l.text).join('\n')).join('\n');
      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: `Detect the language of these lyrics. Return ONLY the name of the language in English (e.g., "English", "French", "Spanish").\n\nLyrics:\n${songText.substring(0, 1000)}`,
      });
      const detected = response.text?.trim() || 'English';
      setSongLanguage(detected);
    } catch (error) {
      console.error('Language detection error:', error);
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  const adaptSongLanguage = async (newLanguage: string) => {
    if (song.length === 0 || newLanguage === songLanguage) return;
    setIsAdaptingLanguage(true);
    saveVersion(`Before Translation to ${newLanguage}`);

    try {
      const prompt = `You are an expert lyricist specializing in creative song adaptation across languages.

Your task: Adapt the following song lyrics to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.

CRITICAL GUIDELINES:

1. EMOTIONAL IMPACT FIRST
   - Preserve the emotional journey and core message
   - Prioritize how the lyrics make people FEEL over word-for-word accuracy
   - Maintain the song's vibe, tone, and artistic intent

2. NATURAL LANGUAGE
   - Write as if the song was originally composed in ${newLanguage}
   - Use idioms, expressions, and cultural references native to ${newLanguage}
   - Avoid "translation-speak" - make it sound authentic and poetic
   - Respect ${newLanguage} grammar, syntax, and natural word order

3. POETIC STRUCTURE
   - Maintain rhyme scheme quality (e.g., if AABB, keep clean rhymes in ${newLanguage})
   - Match syllable counts when possible, but prioritize natural phrasing
   - Preserve rhythm and singability
   - Adapt imagery and metaphors to resonate in the target culture

4. CULTURAL ADAPTATION
   - Replace culture-specific references with equivalent concepts in ${newLanguage} culture
   - Adapt humor, wordplay, and double meanings creatively
   - Ensure themes and stories make sense to ${newLanguage} speakers

5. TECHNICAL REQUIREMENTS
   - Maintain the existing section structure (same section names)
   - Return the FULL updated song in the same JSON format as input
   - Update rhymingSyllables to reflect actual ${newLanguage} rhymes
   - Adjust syllable counts to match the adapted lyrics
   - Write the "concept" field for each line in ${uiLang}

Current Song Data:
${JSON.stringify(song)}

Return the fully adapted song that feels native to ${newLanguage} speakers while preserving the soul of the original.`;

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
                rhymeScheme: { type: Type.STRING },
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhymingSyllables: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING },
                    },
                    required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
                  },
                },
              },
              required: ['name', 'lines'],
            },
          },
        },
      });

      const newSongData = safeJsonParse<any[]>(response.text || '[]', []);
      if (newSongData.length > 0) {
        const updatedSong = mapSongWithPreservedIds(newSongData, song, newLanguage);
        updateSongAndStructureWithHistory(updatedSong, updatedSong.map(s => s.name));
        setSongLanguage(newLanguage);
      }
    } catch (error) {
      console.error('Language adaptation error:', error);
    } finally {
      setIsAdaptingLanguage(false);
    }
  };

  const adaptSectionLanguage = async (sectionId: string, newLanguage: string) => {
    const section = song.find(s => s.id === sectionId);
    if (!section) return;

    setIsAdaptingLanguage(true);
    saveVersion(`Before Section ${section.name} Translation to ${newLanguage}`);

    try {
      const prompt = `You are an expert lyricist specializing in creative song adaptation across languages.

Adapt the following song section to ${newLanguage} with CREATIVE ADAPTATION, not literal translation.
Keep section name unchanged. Update rhymingSyllables. Adjust syllable counts.
Write the "concept" field for each line in ${uiLang}.

Current Section Data:
${JSON.stringify(section)}`;

      const response = await getAi().models.generateContent({
        model: AI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              rhymeScheme: { type: Type.STRING },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    rhymingSyllables: { type: Type.STRING },
                    rhyme: { type: Type.STRING },
                    syllables: { type: Type.INTEGER },
                    concept: { type: Type.STRING },
                  },
                  required: ['text', 'rhymingSyllables', 'rhyme', 'syllables', 'concept'],
                },
              },
            },
            required: ['name', 'lines'],
          },
        },
      });

      const newSectionData = safeJsonParse<any>(response.text || '{}', {});
      if (newSectionData.name) {
        updateSong(currentSong =>
          currentSong.map(currentSection => {
            if (currentSection.id !== sectionId) return currentSection;
            return mergeAiSectionIntoCurrent(currentSection, newSectionData, newLanguage);
          })
        );
      }
    } catch (error) {
      console.error('Section language adaptation error:', error);
    } finally {
      setIsAdaptingLanguage(false);
    }
  };

  return {
    songLanguage,
    setSongLanguage,
    targetLanguage,
    setTargetLanguage,
    sectionTargetLanguages,
    setSectionTargetLanguages,
    isDetectingLanguage,
    isAdaptingLanguage,
    detectLanguage,
    adaptSongLanguage,
    adaptSectionLanguage,
  };
};
