import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Sparkles, Check, X, Loader2, RefreshCw, Music, AlignLeft, Hash, Lightbulb, ClipboardPaste, Undo2, Redo2, Ruler, BarChart2, Trash2, GripVertical, Download, Upload, Sun, Moon, Plus, ChevronDown, PanelRight, PanelLeft, ChevronRight, Waves, Mic, Volume2, VolumeX, Wand2, History, Bot, User, FileText, Layout, BookOpen, Activity, CheckCircle2, Target, Languages, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FluentProvider, webLightTheme, webDarkTheme, Input as FluentInput, Select as FluentSelect, Label as FluentLabel, Button as FluentButton, Tooltip as FluentTooltip } from '@fluentui/react-components';

import { Line, Section, SongVersion } from './types';
import { Label } from './components/ui/Label';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Button } from './components/ui/Button';
import { Tooltip } from './components/ui/Tooltip';
import { MenuItem } from './components/ui/MenuItem';
import { IconButton } from './components/ui/IconButton';

import { LyricInput } from './components/editor/LyricInput';
import { MarkupInput } from './components/editor/MarkupInput';
import { InstructionEditor } from './components/editor/InstructionEditor';
import { getAi, safeJsonParse, handleApiError } from './utils/aiUtils';
import { getSectionColor, getSectionTextColor, getSectionDotColor, getRhymeColor, MUSICAL_INSTRUCTIONS, DEFAULT_STRUCTURE, cleanSectionName, countSyllables } from './utils/songUtils';
import { useAudioFeedback } from './hooks/useAudioFeedback';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const [title, setTitle] = useState('Untitled Song');
  const [topic, setTopic] = useState('A neon city in the rain');
  const [mood, setMood] = useState('Cyberpunk, nostalgic, bittersweet, reflective');
  const [rhymeScheme, setRhymeScheme] = useState('AABB');
  const [targetSyllables, setTargetSyllables] = useState(10);
  const [structure, setStructure] = useState<string[]>(DEFAULT_STRUCTURE);
  const [newSectionName, setNewSectionName] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggableSectionIndex, setDraggableSectionIndex] = useState<number | null>(null);
  const [draggedLineInfo, setDraggedLineInfo] = useState<{sectionId: string, lineId: string} | null>(null);
  const [dragOverLineInfo, setDragOverLineInfo] = useState<{sectionId: string, lineId: string} | null>(null);
  const [audioFeedback, setAudioFeedback] = useState(true);
  
  const [song, setSong] = useState<Section[]>([]);
  const [past, setPast] = useState<{song: Section[], structure: string[]}[]>([]);
  const [future, setFuture] = useState<{song: Section[], structure: string[]}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'musical'>('lyrics');
  const [genre, setGenre] = useState('');
  const [tempo, setTempo] = useState('120');
  const [instrumentation, setInstrumentation] = useState('');
  const [musicalPrompt, setMusicalPrompt] = useState('');
  const [isGeneratingMusicalPrompt, setIsGeneratingMusicalPrompt] = useState(false);
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const sectionDropdownRef = useRef<HTMLDivElement>(null);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [markupText, setMarkupText] = useState('');
  const markupTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
        try {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } catch (e) {
          console.error("Error checking API key:", e);
        }
      }
    };
    checkApiKey();
  }, []);

  // One-time cleanup of section names on mount to fix any polluted state
  useEffect(() => {
    if (song.length > 0) {
      const needsCleanup = song.some(s => s.name !== cleanSectionName(s.name)) || 
                          structure.some(s => s !== cleanSectionName(s));
      if (needsCleanup) {
        const cleanedSong = song.map(s => ({ ...s, name: cleanSectionName(s.name) }));
        const cleanedStructure = structure.map(s => cleanSectionName(s));
        setSong(cleanedSong);
        setStructure(cleanedStructure);
      }
    }
  }, []); // Only run once on mount

  const handleOpenSelectKey = async () => {
    if (typeof (window as any).aistudio?.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const loadSavedSession = () => {
    const savedSession = localStorage.getItem('lyricist_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.song) {
          const cleanedSong = parsed.song.map((s: any) => ({ ...s, name: cleanSectionName(s.name) }));
          setSong(cleanedSong);
          // Always derive structure from the loaded song to ensure they match
          if (cleanedSong.length > 0) {
            setStructure(cleanedSong.map((s: any) => s.name));
          } else if (parsed.structure) {
            setStructure(parsed.structure.map((s: any) => cleanSectionName(s)));
          }
        }
        if (parsed.title) setTitle(parsed.title);
        if (parsed.topic) setTopic(parsed.topic);
        if (parsed.mood) setMood(parsed.mood);
        if (parsed.rhymeScheme) setRhymeScheme(parsed.rhymeScheme);
        if (parsed.targetSyllables) setTargetSyllables(parsed.targetSyllables);
        if (parsed.genre) setGenre(parsed.genre);
        if (parsed.tempo) setTempo(parsed.tempo);
        if (parsed.instrumentation) setInstrumentation(parsed.instrumentation);
        if (parsed.musicalPrompt) setMusicalPrompt(parsed.musicalPrompt);
        
        setPast([]);
        setFuture([]);
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  };

  // Check for saved session on mount and load it
  useEffect(() => {
    const savedSession = localStorage.getItem('lyricist_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.song && parsed.song.length > 0) {
          setHasSavedSession(true);
          loadSavedSession();
        }
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  }, []);

  // Save session to local storage whenever it changes
  useEffect(() => {
    if (song.length > 0) {
      const sessionData = {
        song,
        structure,
        title,
        topic,
        mood,
        rhymeScheme,
        targetSyllables,
        genre,
        tempo,
        instrumentation,
        musicalPrompt
      };
      localStorage.setItem('lyricist_session', JSON.stringify(sessionData));
      setHasSavedSession(true);
    } else if (song.length === 0 && past.length === 0) {
      // Only clear if we actually reset the song (not just undoing to empty)
      // Actually, let's keep it so they can always recover the last non-empty state
    }
  }, [song, structure, title, topic, mood, rhymeScheme, targetSyllables, genre, tempo, instrumentation, musicalPrompt]);

  const { playAudioFeedback } = useAudioFeedback(audioFeedback);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const saveHistory = () => {
    setPast(prev => [...prev, { song, structure }]);
    setFuture([]);
  };

  const updateSongWithHistory = (newSong: Section[]) => {
    const cleanedSong = newSong.map(s => ({ ...s, name: cleanSectionName(s.name) }));
    setPast(prev => [...prev, { song, structure }]);
    setFuture([]);
    setSong(cleanedSong);
  };

  const updateStructureWithHistory = (newStructure: string[]) => {
    const cleanedStructure = newStructure.map(s => cleanSectionName(s));
    setPast(prev => [...prev, { song, structure }]);
    setFuture([]);
    setStructure(cleanedStructure);
  };

  const updateSongAndStructureWithHistory = (newSong: Section[], newStructure: string[]) => {
    const cleanedSong = newSong.map(s => ({ ...s, name: cleanSectionName(s.name) }));
    const cleanedStructure = newStructure.map(s => cleanSectionName(s));
    setPast(prev => [...prev, { song, structure }]);
    setFuture([]);
    setSong(cleanedSong);
    setStructure(cleanedStructure);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));
    setFuture(prev => [{ song, structure }, ...prev]);
    setSong(previous.song);
    setStructure(previous.structure);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, { song, structure }]);
    setSong(next.song);
    setStructure(next.structure);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, song]);
  
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<any>(null);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [appliedAnalysisItems, setAppliedAnalysisItems] = useState<Set<string>>(new Set());
  const [selectedAnalysisItems, setSelectedAnalysisItems] = useState<Set<string>>(new Set());
  const [isApplyingAnalysis, setIsApplyingAnalysis] = useState<string | null>(null);
  const [versions, setVersions] = useState<SongVersion[]>([]);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAnalyzingTheme, setIsAnalyzingTheme] = useState(false);
  const [songLanguage, setSongLanguage] = useState<string>('English');
  const [targetLanguage, setTargetLanguage] = useState<string>('English');
  const [sectionTargetLanguages, setSectionTargetLanguages] = useState<Record<string, string>>({});
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [isAdaptingLanguage, setIsAdaptingLanguage] = useState(false);
  const lastAnalyzedSongRef = useRef<string>('');

  useEffect(() => {
    if (song.length === 0) return;
    
    const currentSongStr = JSON.stringify(song);
    if (currentSongStr === lastAnalyzedSongRef.current) return;

    const timer = setTimeout(async () => {
      setIsAnalyzingTheme(true);
      try {
        const prompt = `Analyze the following song lyrics. \nCurrent Topic: "${topic}"\nCurrent Mood: "${mood}"\n\nIf the lyrics have significantly deviated from the current topic or mood, provide an updated topic and mood. If they still fit, return the current ones.\nReturn JSON with "topic" and "mood" strings.\n\nLyrics:\n${song.map(s => s.name + '\n' + s.lines.map(l => l.text).join('\n')).join('\n\n')}\n`;
        const response = await getAi().models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                mood: { type: Type.STRING }
              }
            }
          }
        });
        const data = safeJsonParse(response.text || '{}', {}) as any;
        if (data.topic && data.topic !== topic) setTopic(data.topic);
        if (data.mood && data.mood !== mood) setMood(data.mood);
        lastAnalyzedSongRef.current = currentSongStr;
      } catch (e) {
        handleApiError(e, "Background analysis failed.");
      } finally {
        setIsAnalyzingTheme(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [song, topic, mood]);

  const resetSong = () => {
    updateSongAndStructureWithHistory([], DEFAULT_STRUCTURE);
    setSelectedLineId(null);
    setSuggestions([]);
    setIsResetModalOpen(false);
  };

  const saveVersion = (name: string) => {
    const newVersion: SongVersion = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      song: JSON.parse(JSON.stringify(song)),
      topic,
      mood,
      name: name || `Version ${versions.length + 1}`
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  const rollbackToVersion = (version: SongVersion) => {
    updateSongAndStructureWithHistory(version.song, version.song.map(s => s.name));
    setTopic(version.topic);
    setMood(version.mood);
    setIsVersionsModalOpen(false);
  };

  const toggleAnalysisItemSelection = (itemText: string) => {
    setSelectedAnalysisItems(prev => {
      const next = new Set(prev);
      if (next.has(itemText)) {
        next.delete(itemText);
      } else {
        next.add(itemText);
      }
      return next;
    });
  };

  const applySelectedAnalysisItems = async () => {
    if (selectedAnalysisItems.size === 0 || isApplyingAnalysis) return;
    
    const itemsToApply = Array.from(selectedAnalysisItems);
    setIsApplyingAnalysis('batch');
    
    // Save current state as a version before analysis modification
    saveVersion('Before Analysis Batch Improvements');

    try {
      const prompt = `Modify the following song lyrics based on these improvement suggestions:\n      ${itemsToApply.map((item, i) => `${i + 1}. ${item}`).join('\n')}
      
      IMPORTANT:
      1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).
      2. Only update the lyrics as suggested.
      3. Return the FULL updated song in the same JSON format as the input.
      4. Do not change the section names unless specifically requested by the improvements.

      Current Song Data:
      ${JSON.stringify(song)}`;

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
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
                      concept: { type: Type.STRING }
                    },
                    required: ["text", "rhymingSyllables", "rhyme", "syllables", "concept"]
                  }
                }
              },
              required: ["name", "lines"]
            }
          }
        }
      });

      const newSongData = safeJsonParse(response.text || '[]', []);
      if (newSongData.length > 0) {
        const updatedSong: Section[] = newSongData.map((s: any, idx: number) => {
          const existingSection = (song[idx] || {}) as any;
          return {
            ...existingSection,
            ...s,
            id: existingSection.id || crypto.randomUUID(),
            lines: s.lines.map((l: any, lIdx: number) => ({
              ...l,
              id: (existingSection.lines && existingSection.lines[lIdx]?.id) || crypto.randomUUID()
            }))
          };
        });
        
        updateSongAndStructureWithHistory(updatedSong, updatedSong.map(s => s.name));
        setAppliedAnalysisItems(prev => {
          const next = new Set(prev);
          itemsToApply.forEach(item => next.add(item));
          return next;
        });
        setSelectedAnalysisItems(new Set());
      }
    } catch (error) {
      console.error('Apply batch analysis error:', error);
    } finally {
      setIsApplyingAnalysis(null);
    }
  };

  const applyAnalysisItem = async (itemText: string) => {
    if (isApplyingAnalysis) return;
    setIsApplyingAnalysis(itemText);
    
    // Save current state as a version before first analysis modification if not already done
    if (appliedAnalysisItems.size === 0) {
      saveVersion('Before Analysis Improvements');
    }

    try {
      const songText = song.map(s => `[${s.name}]\n${s.lines.map(l => l.text).join('\n')}`).join('\n\n');
      
      const prompt = `Modify the following song lyrics based on this specific improvement suggestion: "${itemText}".
      
      IMPORTANT:
      1. Maintain the existing section structure (Intro, Verse, Chorus, etc.).
      2. Only update the lyrics as suggested.
      3. Return the FULL updated song in the same JSON format as the input.
      4. Do not change the section names unless specifically requested by the improvement.

      Current Song Data:
      ${JSON.stringify(song)}`;

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
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
                      concept: { type: Type.STRING }
                    },
                    required: ["text", "rhymingSyllables", "rhyme", "syllables", "concept"]
                  }
                }
              },
              required: ["name", "lines"]
            }
          }
        }
      });

      const newSongData = safeJsonParse(response.text || '[]', []);
      if (newSongData.length > 0) {
        // Ensure IDs are preserved or regenerated
        const updatedSong: Section[] = newSongData.map((s: any, idx: number) => {
          const existingSection = (song[idx] || {}) as any;
          return {
            ...existingSection,
            ...s,
            id: existingSection.id || crypto.randomUUID(),
            lines: s.lines.map((l: any, lIdx: number) => ({
              ...l,
              id: (existingSection.lines && existingSection.lines[lIdx]?.id) || crypto.randomUUID()
            }))
          };
        });
        
        updateSongAndStructureWithHistory(updatedSong, updatedSong.map(s => s.name));
        setAppliedAnalysisItems(prev => new Set(prev).add(itemText));
      }
    } catch (error) {
      console.error('Apply analysis error:', error);
    } finally {
      setIsApplyingAnalysis(null);
    }
  };

  const analyzeCurrentSong = async () => {
    if (song.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisSteps(['Gathering song data...']);
    setIsAnalysisModalOpen(true);
    setAnalysisReport(null);
    setAppliedAnalysisItems(new Set());

    try {
      setAnalysisSteps(prev => [...prev, 'Analyzing structure and flow...']);
      const songText = song.map(s => `[${s.name}]\n${s.lines.map(l => l.text).join('\n')}`).join('\n\n');
      
      const prompt = `Thoroughly analyze the following song lyrics. 
      Provide a detailed report including:
      1. Overall Theme & Narrative: What is the song truly about?
      2. Emotional Arc: How do the emotions shift throughout the song?
      3. Technical Analysis: Rhyme schemes, syllable consistency, and rhythmic flow.
      4. Strengths: What works well in the current version?
      5. Actionable Improvements: Specific suggestions to improve the lyrics, structure, or impact.
      6. Musical Suggestions: Ideas for instrumentation or vocal delivery based on the lyrics.

      Song Lyrics:
      ${songText}`;

      setAnalysisSteps(prev => [...prev, 'Consulting AI Lyricist...']);
      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              emotionalArc: { type: Type.STRING },
              technicalAnalysis: { type: Type.ARRAY, items: { type: Type.STRING } },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              musicalSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING }
            },
            required: ["theme", "emotionalArc", "technicalAnalysis", "strengths", "improvements", "musicalSuggestions", "summary"]
          }
        }
      });

      setAnalysisSteps(prev => [...prev, 'Finalizing report...']);
      const data = safeJsonParse(response.text || '{}', {}) as any;
      setAnalysisReport(data);
      setAnalysisSteps(prev => [...prev, 'Analysis complete!']);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisSteps(prev => [...prev, 'Error during analysis. Please try again.']);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectLanguage = async () => {
    if (song.length === 0) return;
    setIsDetectingLanguage(true);
    try {
      const songText = song.map(s => s.lines.map(l => l.text).join('\n')).join('\n');
      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Detect the language of these lyrics. Return ONLY the name of the language (e.g., "English", "French", "Spanish").\n\nLyrics:\n${songText.substring(0, 1000)}`,
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
      const prompt = `Translate and adapt the following song lyrics to ${newLanguage}. 
      Maintain the rhyme scheme, syllable counts, and core concepts as much as possible while ensuring the lyrics sound natural in ${newLanguage}.
      
      IMPORTANT:
      1. Maintain the existing section structure.
      2. Return the FULL updated song in the same JSON format as the input.

      Current Song Data:
      ${JSON.stringify(song)}`;

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
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
                      concept: { type: Type.STRING }
                    },
                    required: ["text", "rhymingSyllables", "rhyme", "syllables", "concept"]
                  }
                }
              },
              required: ["name", "lines"]
            }
          }
        }
      });

      const newSongData = safeJsonParse(response.text || '[]', []);
      if (newSongData.length > 0) {
        const updatedSong: Section[] = newSongData.map((s: any, idx: number) => {
          const existingSection = (song[idx] || {}) as any;
          return {
            ...existingSection,
            ...s,
            id: existingSection.id || crypto.randomUUID(),
            language: newLanguage,
            lines: s.lines.map((l: any, lIdx: number) => ({
              ...l,
              id: (existingSection.lines && existingSection.lines[lIdx]?.id) || crypto.randomUUID()
            }))
          };
        });
        
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
    const sectionIndex = song.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;
    
    const section = song[sectionIndex];
    setIsAdaptingLanguage(true);
    saveVersion(`Before Section ${section.name} Translation to ${newLanguage}`);

    try {
      const prompt = `Translate and adapt the following song section lyrics to ${newLanguage}. 
      Maintain the rhyme scheme, syllable counts, and core concepts as much as possible while ensuring the lyrics sound natural in ${newLanguage}.
      
      IMPORTANT:
      1. Return ONLY the updated section in the same JSON format as the input.

      Current Section Data:
      ${JSON.stringify(section)}`;

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
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
                    concept: { type: Type.STRING }
                  },
                  required: ["text", "rhymingSyllables", "rhyme", "syllables", "concept"]
                }
              }
            },
            required: ["name", "lines"]
          }
        }
      });

      const newSectionData = safeJsonParse(response.text || '{}', {}) as any;
      if (newSectionData.name) {
        const newSong = [...song];
        newSong[sectionIndex] = {
          ...section,
          ...newSectionData,
          language: newLanguage,
          lines: newSectionData.lines.map((l: any, lIdx: number) => ({
            ...l,
            id: section.lines[lIdx]?.id || crypto.randomUUID()
          }))
        };
        updateSongWithHistory(newSong);
      }
    } catch (error) {
      console.error('Section language adaptation error:', error);
    } finally {
      setIsAdaptingLanguage(false);
    }
  };
  const analyzePastedLyrics = async () => {
    if (!pastedText.trim()) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze the following lyrics and structure them into sections.
IMPORTANT: You MUST ONLY use the following section names (you can append numbers like "Verse 1", "Chorus 2"):
- Intro
- Verse
- Pre-Chorus
- Chorus
- Bridge
- Outro

CRITICAL INSTRUCTIONS:
1. ONLY analyze the lyrics provided below.
2. DO NOT generate new lyrics.
3. DO NOT continue the song.
4. Stop immediately when you reach the end of the provided lyrics.
5. Keep concepts very short (1-3 words).

Do NOT use any other section names (like "Meta", "Instruction", "Instrumental", etc.). If a block of text is an instruction or meta-text, either ignore it or include it in the nearest valid section.

Extract the overall topic/theme and mood/vibe.
For each section, identify the rhyme scheme (e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE).
For each line, provide the exact lyric text, the rhyming syllables (the actual syllables that rhyme, e.g., "ain", "ight"), the rhyme identifier (e.g., A, B), the exact syllable count, and a short core concept.

Lyrics:
${pastedText}`;

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              mood: { type: Type.STRING },
              sections: {
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
            },
            required: ["topic", "mood", "sections"]
          }
        }
      });

      const data = safeJsonParse(response.text || '{}', {}) as any;
      if (data.topic) setTopic(data.topic);
      if (data.mood) setMood(data.mood);
      
      const sections = data.sections || [];
      if (sections.length === 0) {
        throw new Error("No sections could be extracted. Please check the lyrics format.");
      }
      const songWithIds = sections.map((section: any) => ({
        ...section,
        name: cleanSectionName(section.name),
        id: crypto.randomUUID(),
        rhymeScheme: section.rhymeScheme || rhymeScheme,
        lines: section.lines.map((line: any) => ({
          ...line,
          id: crypto.randomUUID(),
          isManual: true
        }))
      }));
      const newStructure = sections.map((s: any) => cleanSectionName(s.name));
      updateSongAndStructureWithHistory(songWithIds, newStructure);
      setSelectedLineId(null);
      setIsPasteModalOpen(false);
      setPastedText('');
    } catch (error: any) {
      handleApiError(error, "Failed to analyze lyrics. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeStructureItem = (index: number) => {
    const newStructure = structure.filter((_, i) => i !== index);
    
    // Also remove from song if it exists
    if (song.length > index) {
      const newSong = song.filter((_, i) => i !== index);
      updateSongAndStructureWithHistory(newSong, newStructure);
    } else {
      updateStructureWithHistory(newStructure);
    }
  };

  const addStructureItem = (name?: string) => {
    const itemToAdd = cleanSectionName(name || newSectionName.trim());
    if (!itemToAdd) return;
    
    // Prevent duplicates for Intro, Bridge, Outro
    if (['Intro', 'Bridge', 'Outro'].includes(itemToAdd)) {
      if (structure.some(s => s.toLowerCase() === itemToAdd.toLowerCase())) {
        return;
      }
    }

    let finalName = itemToAdd;
    if (['Verse', 'Pre-Chorus', 'Chorus'].includes(itemToAdd)) {
       const count = structure.filter(s => s.startsWith(itemToAdd)).length;
       if (itemToAdd === 'Verse' || count > 0) {
         finalName = `${itemToAdd} ${count + 1}`;
       }
    }

    let insertIndex = structure.length;
    
    if (itemToAdd === 'Intro') {
      insertIndex = 0;
    } else if (itemToAdd === 'Pre-Chorus') {
      // Try to insert before the next Chorus
      const nextChorusIndex = structure.findIndex(s => s.startsWith('Chorus'));
      if (nextChorusIndex !== -1) {
        insertIndex = nextChorusIndex;
      }
    } else if (itemToAdd === 'Chorus') {
      // Try to insert after the last Pre-Chorus or Verse
      const lastPreChorusIndex = [...structure].reverse().findIndex(s => s.startsWith('Pre-Chorus'));
      const lastVerseIndex = [...structure].reverse().findIndex(s => s.startsWith('Verse'));
      if (lastPreChorusIndex !== -1) {
        insertIndex = structure.length - 1 - lastPreChorusIndex + 1;
      } else if (lastVerseIndex !== -1) {
        insertIndex = structure.length - 1 - lastVerseIndex + 1;
      }
    }

    // Never insert after Outro unless it's the only option
    const outroIndex = structure.findIndex(s => s.toLowerCase().includes('outro'));
    if (outroIndex !== -1 && insertIndex > outroIndex) {
      insertIndex = outroIndex;
    }

    let newStructure = [...structure];
    let newSong = [...song];

    const newSection: Section = {
      id: crypto.randomUUID(),
      name: finalName,
      lines: Array(4).fill(null).map(() => ({
        id: crypto.randomUUID(),
        text: '',
        rhymingSyllables: '',
        rhyme: '',
        syllables: 0,
        concept: 'New line'
      }))
    };

    newStructure.splice(insertIndex, 0, finalName);
    if (song.length > 0) {
      newSong.splice(insertIndex, 0, newSection);
    }

    updateSongAndStructureWithHistory(newSong, newStructure);

    if (!name) setNewSectionName('');
  };

  const normalizeStructure = () => {
    const intros = structure.filter(s => s.toLowerCase().includes('intro'));
    const verses = structure.filter(s => s.toLowerCase().includes('verse'));
    const preChoruses = structure.filter(s => s.toLowerCase().includes('pre-chorus') || s.toLowerCase().includes('prechorus'));
    const choruses = structure.filter(s => s.toLowerCase().includes('chorus') && !s.toLowerCase().includes('pre'));
    const bridges = structure.filter(s => s.toLowerCase().includes('bridge'));
    const outros = structure.filter(s => s.toLowerCase().includes('outro'));
    
    const others = structure.filter(s => {
      const l = s.toLowerCase();
      return !l.includes('intro') && !l.includes('verse') && !l.includes('pre-chorus') && !l.includes('prechorus') && !l.includes('chorus') && !l.includes('bridge') && !l.includes('outro');
    });

    const newStructure: string[] = [];
    newStructure.push(...intros);
    
    // If there is at least one pre-chorus, ensure every chorus has one before it
    const hasPreChorus = preChoruses.length > 0;
    let preChorusCount = 0;

    const maxVPC = Math.max(verses.length, choruses.length);
    for (let i = 0; i < maxVPC; i++) {
      if (i < verses.length) newStructure.push(verses[i]);
      
      if (i < choruses.length) {
        if (hasPreChorus) {
          preChorusCount++;
          newStructure.push(`Pre-Chorus ${preChorusCount}`);
        }
        newStructure.push(choruses[i]);
      }
    }
    
    newStructure.push(...bridges);
    newStructure.push(...others);
    newStructure.push(...outros);

    let newSong: Section[] = [];
    if (song.length > 0) {
      const songCopy = [...song];
      newStructure.forEach(structName => {
        const index = songCopy.findIndex(s => s.name === structName);
        if (index !== -1) {
          newSong.push(songCopy[index]);
          songCopy.splice(index, 1);
        } else {
          // If a new pre-chorus was added during normalization, create an empty section for it
          newSong.push({
            id: crypto.randomUUID(),
            name: structName,
            lines: Array(4).fill(null).map(() => ({
              id: crypto.randomUUID(),
              text: '',
              rhymingSyllables: '',
              rhyme: '',
              syllables: 0,
              concept: 'New line'
            }))
          });
        }
      });
      newSong.push(...songCopy);
    } else {
      newSong = song;
    }

    updateSongAndStructureWithHistory(newSong, newStructure);
  };

  const handleDrop = (dropIndex: number) => {
    setDragOverIndex(null);
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;
    
    const draggedItemName = structure[draggedItemIndex];
    const targetItemName = structure[dropIndex];

    // 0. Prevent moving Intro or Outro
    if (draggedItemName.toLowerCase() === 'intro' || draggedItemName.toLowerCase() === 'outro') return;
    
    // Prevent dropping onto Intro position (index 0) if Intro exists
    if (dropIndex === 0 && structure[0].toLowerCase() === 'intro') return;
    
    // Prevent dropping onto Outro position (last index) if Outro exists
    if (dropIndex === structure.length - 1 && structure[structure.length - 1].toLowerCase() === 'outro') return;

    // 1. Prevent moving anything after Outro
    const outroIndex = structure.findIndex(s => s.toLowerCase().includes('outro'));
    if (outroIndex !== -1) {
      if (dropIndex > outroIndex && draggedItemIndex !== outroIndex) return;
      if (draggedItemIndex === outroIndex && dropIndex !== structure.length - 1) return;
    }

    // 2. Prevent moving numbered sections out of order
    const getBaseAndNumber = (name: string) => {
      const match = name.match(/^(.*?)\s+(\d+)$/);
      if (match) return { base: match[1], num: parseInt(match[2]) };
      return { base: name, num: null };
    };

    const draggedInfo = getBaseAndNumber(draggedItemName);
    const tempStructure = [...structure];
    tempStructure.splice(draggedItemIndex, 1);
    tempStructure.splice(dropIndex, 0, draggedItemName);

    if (draggedInfo.num !== null) {
      const sameBaseSections = tempStructure
        .map((name, index) => ({ name, index, ...getBaseAndNumber(name) }))
        .filter(item => item.base === draggedInfo.base && item.num !== null);

      for (let i = 0; i < sameBaseSections.length - 1; i++) {
        if (sameBaseSections[i].num! > sameBaseSections[i+1].num!) {
          return; // Invalid move
        }
      }
    }

    const newStructure = [...structure];
    const [draggedItem] = newStructure.splice(draggedItemIndex, 1);
    newStructure.splice(dropIndex, 0, draggedItem);

    const newSong = [...song];
    if (newSong.length > 0) {
      const [draggedSection] = newSong.splice(draggedItemIndex, 1);
      newSong.splice(dropIndex, 0, draggedSection);
    }
    
    updateSongAndStructureWithHistory(newSong, newStructure);
    setDraggedItemIndex(null);
  };

  const handleLineDragStart = (sectionId: string, lineId: string) => {
    setDraggedLineInfo({ sectionId, lineId });
    playAudioFeedback('drag');
  };

  const handleLineDrop = (targetSectionId: string, targetLineId: string) => {
    setDragOverLineInfo(null);
    if (!draggedLineInfo) return;
    if (draggedLineInfo.sectionId === targetSectionId && draggedLineInfo.lineId === targetLineId) {
      setDraggedLineInfo(null);
      return;
    }

    const newSong = [...song];
    const sourceSectionIndex = newSong.findIndex(s => s.id === draggedLineInfo.sectionId);
    const targetSectionIndex = newSong.findIndex(s => s.id === targetSectionId);

    if (sourceSectionIndex === -1 || targetSectionIndex === -1) return;

    const sourceSection = { ...newSong[sourceSectionIndex], lines: [...newSong[sourceSectionIndex].lines] };
    const targetSection = sourceSectionIndex === targetSectionIndex ? sourceSection : { ...newSong[targetSectionIndex], lines: [...newSong[targetSectionIndex].lines] };

    const sourceLineIndex = sourceSection.lines.findIndex(l => l.id === draggedLineInfo.lineId);
    const targetLineIndex = targetSection.lines.findIndex(l => l.id === targetLineId);

    if (sourceLineIndex === -1 || targetLineIndex === -1) return;

    const [draggedLine] = sourceSection.lines.splice(sourceLineIndex, 1);
    targetSection.lines.splice(targetLineIndex, 0, draggedLine);

    newSong[sourceSectionIndex] = sourceSection;
    if (sourceSectionIndex !== targetSectionIndex) {
      newSong[targetSectionIndex] = targetSection;
    }

    updateSongWithHistory(newSong);
    setDraggedLineInfo(null);
    playAudioFeedback('drop');
  };

  const exportTxt = () => {
    if (song.length === 0) return;
    let content = `${title}\n\n`;
    song.forEach(section => {
      content += `[${section.name}]\n`;
      section.lines.forEach(line => {
        content += `${line.text}\n`;
      });
      content += '\n';
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMd = () => {
    if (song.length === 0) return;
    let content = `# ${title}\n\n`;
    content += `**Topic:** ${topic}\n`;
    content += `**Mood:** ${mood}\n\n`;
    
    song.forEach(section => {
      content += `### ${section.name}\n\n`;
      section.lines.forEach(line => {
        content += `${line.text}  \n`;
      });
      content += '\n';
    });
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPastedText(text);
        setIsPasteModalOpen(true);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const generateSong = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Write a song about "${topic}". \nMood: ${mood}\nDefault Rhyme Scheme: ${rhymeScheme}\nTarget Syllables per line: ${targetSyllables}\nStructure: ${structure.join(', ')}\n\nIMPORTANT: You MUST follow the provided structure EXACTLY. Generate exactly the sections listed in the Structure field, in that specific order.\n\nLine counts for sections:\n- Intro: 4 lines\n- Verse: 6 lines\n- Chorus: 4 lines\n- Bridge: 6 lines\n- Outro: 4 lines\n\nFor each section, provide a rhyme scheme (e.g., AABB, ABAB, ABCB, AAAA, AAABBB, AABBCC, ABABAB, ABCABC, AABCCB, or FREE).\nFor each line, provide the lyric text, the rhyming syllables (e.g., 'ain', 'ight'), the rhyme identifier (e.g., A, B), the exact syllable count, and a short core concept.`;

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
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
        id: crypto.randomUUID(),
        rhymeScheme: section.rhymeScheme || rhymeScheme,
        lines: section.lines.map((line: any) => ({
          ...line,
          id: crypto.randomUUID()
        }))
      }));
      const newStructure = songWithIds.map((s: any) => s.name);
      updateSongAndStructureWithHistory(songWithIds, newStructure);
      saveVersion(`Generated: ${topic}`);
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
    
    setIsGenerating(true);
    try {
      let lineCountPrompt = "";
      const lowerName = sectionToRegenerate.name.toLowerCase();
      if (lowerName.includes('intro')) lineCountPrompt = "The section should have exactly 4 lines.";
      else if (lowerName.includes('verse')) lineCountPrompt = "The section should have exactly 6 lines.";
      else if (lowerName.includes('chorus')) lineCountPrompt = "The section should have exactly 4 lines.";
      else if (lowerName.includes('bridge')) lineCountPrompt = "The section should have exactly 6 lines.";
      else if (lowerName.includes('outro')) lineCountPrompt = "The section should have exactly 4 lines.";

      const prompt = `Rewrite the following section of a song about "${topic}".\nMood: ${mood}\nTarget Syllables per line: ${targetSyllables}\nSection Name: ${sectionToRegenerate.name}\nRhyme Scheme: ${sectionToRegenerate.rhymeScheme || rhymeScheme}\nMood: ${sectionToRegenerate.mood || mood}\n${lineCountPrompt}\n\nCurrent Section:\n${JSON.stringify([sectionToRegenerate], null, 2)}\n\nProvide a new creative version of this section.\nReturn the updated section in the exact same JSON structure (as an array with one section).`;

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING, description: "The rhyme scheme for this section" },
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
      if (data.length > 0) {
        const newSection = {
          ...data[0],
          name: cleanSectionName(data[0].name),
          id: crypto.randomUUID(),
          lines: data[0].lines.map((line: any) => ({
            ...line,
            id: crypto.randomUUID()
          }))
        };
        
        const updatedSong = song.map(s => s.id === sectionId ? newSection : s);
        updateSongWithHistory(updatedSong);
      }
    } catch (error: any) {
      handleApiError(error, "Failed to regenerate section. Please try again.");
    } finally {
      setIsGenerating(false);
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
        prompt = `Rewrite the following section of a song so that EVERY line has EXACTLY ${syllables} syllables. Maintain the original meaning, rhyme scheme, and section structure.\n\nCurrent Section:\n${JSON.stringify([sectionToQuantize], null, 2)}\n\nReturn the updated section in the exact same JSON structure (as an array with one section).`;
      } else {
        prompt = `Rewrite the following song so that EVERY line has EXACTLY the number of syllables specified by its section's targetSyllables (or ${targetSyllables} if not specified). Maintain the original meaning, rhyme scheme (respecting section-level schemes if specified), and section structure.\n\nCurrent Song:\n${JSON.stringify(song, null, 2)}\n\nReturn the updated song in the exact same JSON structure.`;
      }

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rhymeScheme: { type: Type.STRING, description: "The rhyme scheme for this section" },
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
      const newSections = data.map((section: any) => ({
        ...section,
        name: cleanSectionName(section.name),
        id: crypto.randomUUID(),
        lines: section.lines.map((line: any) => ({
          ...line,
          id: crypto.randomUUID()
        }))
      }));

      if (sectionId) {
        const updatedSong = song.map(s => {
          if (s.id === sectionId && newSections.length > 0) {
            return {
              ...s,
              lines: newSections[0].lines
            };
          }
          return s;
        });
        updateSongWithHistory(updatedSong);
      } else {
        updateSongWithHistory(newSections);
      }
    } catch (error) {
      console.error("Failed to quantize:", error);
      alert("Failed to quantize syllables. Please try again.");
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
    let sectionName = "";

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
      const prompt = `Generate 3 creative alternative versions for a lyric line.\nContext:\n- Topic: ${topic}\n- Mood: ${mood}\n- Rhyme Scheme: ${song.find(s => s.lines.some(l => l.id === lineId))?.rhymeScheme || rhymeScheme}\n- Target Syllables: ${targetSyllables}\n- Section: ${sectionName}\n- Previous Line: "${previousLine?.text || ''}" (Rhyme: ${previousLine?.rhyme || ''})\n- Current Line to replace: "${currentLine.text}" (Rhyme: ${currentLine.rhyme}, Concept: ${currentLine.concept})\n- Next Line: "${nextLine?.text || ''}" (Rhyme: ${nextLine?.rhyme || ''})\n\nProvide exactly 3 alternative lines that fit the context, mood, and rhyme scheme. Return them as a JSON array of strings.`;

      const response = await getAi().models.generateContent({
        model: 'gemini-2.5-flash',
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
      handleApiError(error, "Failed to generate suggestions.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const updateLineText = (sectionId: string, lineId: string, newText: string) => {
    setSong(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lines: section.lines.map(line => {
            if (line.id === lineId) {
              return { 
                ...line, 
                text: newText,
                syllables: newText.split(/\s+/).reduce((acc, word) => acc + countSyllables(word), 0),
                isManual: true
              };
            }
            return line;
          })
        };
      }
      return section;
    }));
  };

  const handleLineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string, lineId: string) => {
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

      const newSong = song.map(s => {
        if (s.id === sectionId) {
          const newLines = [...s.lines];
          newLines[lineIndex] = {
            ...newLines[lineIndex],
            text: mergedText,
            syllables: mergedText.split(/\s+/).reduce((acc, word) => acc + countSyllables(word), 0),
            isManual: true
          };
          newLines.splice(lineIndex + 1, 1);
          return { ...s, lines: newLines };
        }
        return s;
      });
      
      updateSongWithHistory(newSong);

      setTimeout(() => {
        const currentInput = document.querySelector(`input[data-line-id="${lineId}"]`) as HTMLInputElement;
        if (currentInput) {
          currentInput.focus();
          currentInput.setSelectionRange(value.length, value.length);
        }
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

      const newSong = song.map(s => {
        if (s.id === sectionId) {
          const newLines = [...s.lines];
          newLines[lineIndex - 1] = {
            ...newLines[lineIndex - 1],
            text: mergedText,
            syllables: mergedText.split(/\s+/).reduce((acc, word) => acc + countSyllables(word), 0),
            isManual: true
          };
          newLines.splice(lineIndex, 1);
          return { ...s, lines: newLines };
        }
        return s;
      });
      
      updateSongWithHistory(newSong);
      setSelectedLineId(prevLineId);
      
      setTimeout(() => {
        const prevInput = document.querySelector(`input[data-line-id="${prevLineId}"]`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
          prevInput.setSelectionRange(prevLine.text.length, prevLine.text.length);
        }
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
      const newLineId = crypto.randomUUID();

      const newSong = song.map(s => {
        if (s.id === sectionId) {
          const newLines = [...s.lines];
          // Update current line
          newLines[lineIndex] = {
            ...newLines[lineIndex],
            text: textBefore,
            syllables: textBefore.split(/\s+/).reduce((acc, word) => acc + countSyllables(word), 0),
            isManual: true
          };
          // Insert new line
          newLines.splice(lineIndex + 1, 0, {
            id: newLineId,
            text: textAfter,
            rhymingSyllables: '',
            rhyme: '',
            syllables: textAfter.split(/\s+/).reduce((acc, word) => acc + countSyllables(word), 0),
            concept: 'New line',
            isManual: true
          });
          return { ...s, lines: newLines };
        }
        return s;
      });

      updateSongWithHistory(newSong);
      setSelectedLineId(newLineId);

      setTimeout(() => {
        const nextInput = document.querySelector(`input[data-line-id="${newLineId}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(0, 0);
        }
      }, 0);
    } else if (e.key === 'ArrowUp') {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;
      const section = song[sectionIndex];
      const lineIndex = section.lines.findIndex(l => l.id === lineId);
      
      let targetLineId = '';
      if (lineIndex > 0) {
        targetLineId = section.lines[lineIndex - 1].id;
      } else if (sectionIndex > 0) {
        const prevSection = song[sectionIndex - 1];
        if (prevSection.lines.length > 0) {
          targetLineId = prevSection.lines[prevSection.lines.length - 1].id;
        }
      }

      if (targetLineId) {
        e.preventDefault();
        setSelectedLineId(targetLineId);
        setTimeout(() => {
          const input = document.querySelector(`input[data-line-id="${targetLineId}"]`) as HTMLInputElement;
          if (input) {
            input.focus();
            const pos = Math.min(selectionStart || 0, input.value.length);
            input.setSelectionRange(pos, pos);
          }
        }, 0);
      }
    } else if (e.key === 'ArrowDown') {
      const sectionIndex = song.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;
      const section = song[sectionIndex];
      const lineIndex = section.lines.findIndex(l => l.id === lineId);
      
      let targetLineId = '';
      if (lineIndex < section.lines.length - 1) {
        targetLineId = section.lines[lineIndex + 1].id;
      } else if (sectionIndex < song.length - 1) {
        const nextSection = song[sectionIndex + 1];
        if (nextSection.lines.length > 0) {
          targetLineId = nextSection.lines[0].id;
        }
      }

      if (targetLineId) {
        e.preventDefault();
        setSelectedLineId(targetLineId);
        setTimeout(() => {
          const input = document.querySelector(`input[data-line-id="${targetLineId}"]`) as HTMLInputElement;
          if (input) {
            input.focus();
            const pos = Math.min(selectionStart || 0, input.value.length);
            input.setSelectionRange(pos, pos);
          }
        }, 0);
      }
    }
  };

  const applySuggestion = (newText: string) => {
    if (!selectedLineId) return;
    
    const newSong = song.map(section => ({
      ...section,
      lines: section.lines.map(line => {
        if (line.id === selectedLineId) {
          return { ...line, text: newText };
        }
        return line;
      })
    }));
    updateSongWithHistory(newSong);
  };

  const generateMusicalPrompt = async () => {
    if (!title && !topic) return;
    setIsGeneratingMusicalPrompt(true);
    try {
      const response = await getAi().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a detailed musical production prompt for an AI music generator (like Suno or Udio).\n        Song Title: ${title}\n        Topic/Theme: ${topic}\n        Mood: ${mood}\n        Genre: ${genre}\n        Tempo: ${tempo} BPM\n        Instrumentation: ${instrumentation}\n        Lyrics Snippet: ${song.slice(0, 2).map(s => s.lines.map(l => l.text).join('\n')).join('\n\n')}\n        \n        Provide a concise, highly descriptive prompt that captures the essence of the song's production style, vocal characteristics, and sonic atmosphere.`,
      });
      setMusicalPrompt(response.text || '');
    } catch (error) {
      handleApiError(error, "Error generating musical prompt.");
    } finally {
      setIsGeneratingMusicalPrompt(false);
    }
  };

  const handleLineClick = (lineId: string) => {
    if (selectedLineId === lineId) return;
    setSelectedLineId(lineId);
    generateSuggestions(lineId);
  };

  const handleInstructionChange = (sectionId: string, type: 'pre' | 'post', index: number, value: string) => {
    setSong(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
      const instructions = [...(s[key] || [])];
      instructions[index] = value;
      return { ...s, [key]: instructions };
    }));
  };

  const addInstruction = (sectionId: string, type: 'pre' | 'post') => {
    setSong(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
      return { ...s, [key]: [...(s[key] || []), ''] };
    }));
  };

  const removeInstruction = (sectionId: string, type: 'pre' | 'post', index: number) => {
    setSong(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const key = type === 'pre' ? 'preInstructions' : 'postInstructions';
      const instructions = [...(s[key] || [])];
      instructions.splice(index, 1);
      return { ...s, [key]: instructions };
    }));
  };

  const sectionCount = song.length;
  const wordCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0), 0);
  const charCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.length, 0), 0);

  return (
    <FluentProvider theme={theme === 'dark' ? webDarkTheme : webLightTheme} style={{ height: '100%', width: '100%', backgroundColor: 'transparent' }}>
    <div className={`h-screen w-full bg-fluent-bg text-zinc-400 flex flex-col overflow-hidden font-sans selection:bg-[var(--accent-color)]/30 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Settings */}
        <div className={`border-r border-fluent-border bg-fluent-sidebar flex flex-col z-10 shadow-2xl transition-all duration-300 ease-in-out flex-shrink-0 lcars-panel !rounded-none ${isLeftPanelOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0'}`}>
          <div className="w-80 flex flex-col h-full">
            <div className="h-16 px-5 border-b border-fluent-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center shadow-inner">
                  <Music className="w-4.5 h-4.5 text-[var(--accent-color)]" />
                </div>
                <h1 className="text-base text-primary tracking-tight">
                  Lyricist Pro
                </h1>
              </div>
            </div>
          
            <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <Label>SONG TITLE</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter song title..." />
                </div>
                <div>
                  <Label>SONG TOPIC</Label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="What's the song about?" />
                </div>
                <div>
                  <Label>SONG MOOD</Label>
                  <Input 
                    value={mood} 
                    onChange={e => setMood(e.target.value)} 
                    placeholder="e.g. Melancholic, Energetic..." 
                    list="mood-suggestions"
                  />
                  <datalist id="mood-suggestions">
                    <option value="Aggressive" />
                    <option value="Calm" />
                    <option value="Dark" />
                    <option value="Energetic" />
                    <option value="Ethereal" />
                    <option value="Funky" />
                    <option value="Gloomy" />
                    <option value="Happy" />
                    <option value="Intense" />
                    <option value="Joyful" />
                    <option value="Lonely" />
                    <option value="Majestic" />
                    <option value="Melancholic" />
                    <option value="Nostalgic" />
                    <option value="Optimistic" />
                    <option value="Peaceful" />
                    <option value="Quirky" />
                    <option value="Romantic" />
                    <option value="Sad" />
                    <option value="Tense" />
                    <option value="Uplifting" />
                    <option value="Vibrant" />
                    <option value="Whimsical" />
                    <option value="Yearning" />
                    <option value="Zen" />
                  </datalist>
                </div>
              </div>

              <div className="h-px bg-white/5 mx-1" />

              <div className="space-y-4">
                <div>
                  <Label>DEFAULT RHYME SCHEME</Label>
                  <Select value={rhymeScheme} onChange={e => setRhymeScheme(e.target.value)}>
                    <MenuItem value="AABB">AABB (Couplets)</MenuItem>
                    <MenuItem value="ABAB">ABAB (Alternate)</MenuItem>
                    <MenuItem value="AAAA">AAAA (Monorhyme)</MenuItem>
                    <MenuItem value="ABCB">ABCB (Ballad)</MenuItem>
                    <MenuItem value="AAABBB">AAABBB (6-line Block)</MenuItem>
                    <MenuItem value="AABBCC">AABBCC (6-line Couplets)</MenuItem>
                    <MenuItem value="ABABAB">ABABAB (6-line Alternate)</MenuItem>
                    <MenuItem value="ABCABC">ABCABC (6-line Repeating)</MenuItem>
                    <MenuItem value="FREE">Free Verse</MenuItem>
                  </Select>
                </div>
                <div>
                  <Label>TARGET SYLLABLES</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="4" 
                      max="20" 
                      value={targetSyllables} 
                      onChange={e => setTargetSyllables(parseInt(e.target.value))}
                      className="flex-1 accent-[var(--accent-color)] h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs telemetry-text text-[var(--accent-color)] w-5 text-center">{targetSyllables}</span>
                  </div>
                </div>
                <Tooltip title="Adjust all lines to match the target syllable count while maintaining meaning">
                  <Button
                    onClick={() => quantizeSyllables()}
                    disabled={song.length === 0 || isGenerating}
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<Ruler className="w-3.5 h-3.5" />}
                    sx={{ mt: 2, fontSize: '10px', py: 1 }}
                    className="mt-4"
                  >
                    Quantize Syllables (GLOBAL)
                  </Button>
                </Tooltip>
              </div>
            </div>

            <div className="p-5 border-t border-fluent-border">
              <button 
                onClick={() => setIsLeftPanelOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <PanelLeft className="w-3.5 h-3.5" />
                Collapse Sidebar
              </button>
            </div>
          </div>
        </div>

      {/* Main Content - Table */}
      <div className="flex-1 flex flex-col min-w-0 bg-fluent-bg relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-color)]/5 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="h-16 border-b border-fluent-border flex items-center justify-between px-8 z-10 bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center gap-6">
            <Tooltip title={isLeftPanelOpen ? "Hide Sidebar" : "Show Sidebar"}>
              <button
                onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                className="p-2 -ml-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            </Tooltip>
            <div className="w-px h-6 bg-fluent-border" />
            <button 
              onClick={() => setActiveTab('lyrics')}
              className={`text-sm tracking-widest transition-all relative py-5 ${activeTab === 'lyrics' ? 'text-[var(--accent-color)]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-400'}`}
            >
              LYRICS
              {activeTab === 'lyrics' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('musical')}
              className={`text-sm tracking-widest transition-all relative py-5 ${activeTab === 'musical' ? 'text-[var(--accent-color)]' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-400'}`}
            >
              MUSICAL
              {activeTab === 'musical' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-color)]" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title="Import File">
              <Button
                component="label"
                variant="outlined"
                color="info"
                size="small"
                startIcon={<Upload className="w-3.5 h-3.5" />}
                sx={{ fontSize: '0.75rem', py: 0.5 }}
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
              >
                Import
                <input type="file" accept=".txt,.md" className="hidden" onChange={handleImport} />
              </Button>
            </Tooltip>
            <Tooltip title="Export as TXT">
              <Button
                onClick={exportTxt}
                disabled={song.length === 0}
                variant="outlined"
                color="info"
                size="small"
                startIcon={<Download className="w-3.5 h-3.5" />}
                sx={{ fontSize: '0.75rem', py: 0.5 }}
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
              >
                TXT
              </Button>
            </Tooltip>
            <Tooltip title="Export as Markdown">
              <Button
                onClick={exportMd}
                disabled={song.length === 0}
                variant="outlined"
                color="info"
                size="small"
                startIcon={<Download className="w-3.5 h-3.5" />}
                sx={{ fontSize: '0.75rem', py: 0.5 }}
                style={{ fontSize: '0.75rem', padding: '4px 12px' }}
              >
                MD
              </Button>
            </Tooltip>
            <div className="w-px h-4 bg-white/10 mx-2"></div>
            <Tooltip title="Song Versions">
              <IconButton
                onClick={() => setIsVersionsModalOpen(true)}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <History className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Undo">
              <IconButton
                onClick={undo}
                disabled={past.length === 0}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Undo2 className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton
                onClick={redo}
                disabled={future.length === 0}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Redo2 className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <div className="w-px h-4 bg-white/10 mx-2"></div>
            <Tooltip title="Reset Song">
              <IconButton
                onClick={() => setIsResetModalOpen(true)}
                disabled={song.length === 0}
                size="small"
                sx={{ color: 'error.main' }}
              >
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <div className="w-px h-4 bg-white/10 mx-2"></div>
            {!hasApiKey && (
              <Tooltip title="Select Gemini API Key (Required for high usage)">
                <button
                  onClick={handleOpenSelectKey}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-lg flex items-center gap-2 hover:bg-amber-500/20 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  SELECT API KEY
                </button>
              </Tooltip>
            )}
            <Tooltip title={isStructureOpen ? "Hide Sidebar" : "Show Sidebar"}>
              <button
                onClick={() => setIsStructureOpen(!isStructureOpen)}
                className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <PanelRight className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
        
        {activeTab === 'lyrics' && song.length > 0 && (
          <div className="border-b border-white/10 bg-white/[0.03] p-6 z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="micro-label text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Structure & Insights
                </h3>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <Select
                    value={targetLanguage}
                    onChange={(e: any) => setTargetLanguage(e.target.value as string)}
                    size="small"
                    style={{ 
                      height: 24, 
                      fontSize: '10px',
                      color: 'var(--colorNeutralForeground2)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '4px'
                    }}
                  >
                    <MenuItem value="Amharic" sx={{ fontSize: '10px' }}>Amharic (Ethiopia - East Africa)</MenuItem>
                    <MenuItem value="Arabic" sx={{ fontSize: '10px' }}>Arabic</MenuItem>
                    <MenuItem value="Baoulé" sx={{ fontSize: '10px' }}>Baoulé (Ivory Coast - West Africa)</MenuItem>
                    <MenuItem value="Chinese" sx={{ fontSize: '10px' }}>Chinese (Mandarin)</MenuItem>
                    <MenuItem value="Dioula" sx={{ fontSize: '10px' }}>Dioula (Ivory Coast/Burkina Faso - West Africa)</MenuItem>
                    <MenuItem value="English" sx={{ fontSize: '10px' }}>English</MenuItem>
                    <MenuItem value="French" sx={{ fontSize: '10px' }}>French</MenuItem>
                    <MenuItem value="German" sx={{ fontSize: '10px' }}>German</MenuItem>
                    <MenuItem value="Hausa" sx={{ fontSize: '10px' }}>Hausa (Nigeria/Niger - West Africa)</MenuItem>
                    <MenuItem value="Italian" sx={{ fontSize: '10px' }}>Italian</MenuItem>
                    <MenuItem value="Japanese" sx={{ fontSize: '10px' }}>Japanese</MenuItem>
                    <MenuItem value="Korean" sx={{ fontSize: '10px' }}>Korean (South Korea)</MenuItem>
                    <MenuItem value="Lingala" sx={{ fontSize: '10px' }}>Lingala (Congo - Central Africa)</MenuItem>
                    <MenuItem value="Portuguese" sx={{ fontSize: '10px' }}>Portuguese</MenuItem>
                    <MenuItem value="Spanish" sx={{ fontSize: '10px' }}>Spanish</MenuItem>
                    <MenuItem value="Swahili" sx={{ fontSize: '10px' }}>Swahili (East Africa)</MenuItem>
                    <MenuItem value="Wolof" sx={{ fontSize: '10px' }}>Wolof (Senegal - West Africa)</MenuItem>
                    <MenuItem value="Yoruba" sx={{ fontSize: '10px' }}>Yoruba (Nigeria - West Africa)</MenuItem>
                    <MenuItem value="Zulu" sx={{ fontSize: '10px' }}>Zulu (South Africa)</MenuItem>
                  </Select>
                  <Tooltip title={`Translate and adapt the entire song to ${targetLanguage} (creative adaptation, not just literal translation)`}>
                    <button
                      onClick={() => adaptSongLanguage(targetLanguage)}
                      disabled={isAdaptingLanguage || song.length === 0}
                      className="px-3 py-1 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 text-[var(--accent-color)] text-[10px] font-bold rounded transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isAdaptingLanguage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                      ADAPTATION
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="micro-label text-zinc-500">Sections</span>
                  <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{sectionCount}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="micro-label text-zinc-500">Words</span>
                  <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{wordCount}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="micro-label text-zinc-500">Characters</span>
                  <span className="text-sm telemetry-text text-zinc-900 dark:text-zinc-200">{charCount}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {song.map((section) => {
                  const sectionWordCount = section.lines.reduce((acc, line) => acc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0);
                  return (
                    <Tooltip 
                      key={section.id}
                      title={
                        <div className="flex flex-col gap-1 text-xs">
                          <div><span>Lines:</span> {section.lines.length}</div>
                          <div><span>Words:</span> {sectionWordCount}</div>
                          <div><span>Syllables Target:</span> {section.targetSyllables !== undefined ? section.targetSyllables : targetSyllables}</div>
                          <div><span>Rhyme Scheme:</span> {section.rhymeScheme || rhymeScheme}</div>
                        </div>
                      }
                      placement="bottom"
                    >
                      <div 
                        onClick={() => {
                          if (isMarkupMode) {
                            if (markupTextareaRef.current) {
                              // Try bold first
                              let searchStr = `**[${section.name}]**`;
                              let index = markupText.indexOf(searchStr);
                              if (index === -1) {
                                // Try regular
                                searchStr = `[${section.name}]`;
                                index = markupText.indexOf(searchStr);
                              }
                              
                              if (index !== -1) {
                                markupTextareaRef.current.focus();
                                markupTextareaRef.current.setSelectionRange(index, index + searchStr.length);
                                
                                // Scroll to the line
                                const linesBefore = markupText.substring(0, index).split('\n').length;
                                const lineHeight = 20; // Adjusted for text-sm mono
                                markupTextareaRef.current.scrollTop = (linesBefore - 2) * lineHeight;
                              }
                            }
                          } else {
                            const el = document.getElementById(`section-${section.id}`);
                            if (el) {
                              const container = el.closest('.overflow-y-auto');
                              if (container) {
                                const top = el.offsetTop - 20;
                                container.scrollTo({ top, behavior: 'smooth' });
                              } else {
                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }
                          }
                        }}
                        className={`flex-shrink-0 px-3 py-1.5 border rounded-md text-[10px] flex items-center gap-2 transition-all hover:brightness-110 cursor-pointer ${getSectionColor(section.name)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${getSectionDotColor(section.name)} shadow-[0_0_8px_rgba(0,0,0,0.2)]`}></span>
                        {section.name.toUpperCase()}
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <Tooltip title={isMarkupMode ? "Switch to Structured Editor" : "Switch to Pure Text Mode"}>
                  <button 
                    onClick={() => {
                      if (isMarkupMode) {
                        // Convert markup to song
                        const blocks = markupText.split(/\n\s*\n/);
                        const usedSectionIds = new Set<string>();
                        const usedLineIds = new Set<string>();

                        const newSections: Section[] = blocks.map((block, index) => {
                          const lines = block.trim().split('\n');
                          if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) return null;
                          
                          let name = 'Verse';
                          let remainingLines = lines;
                          
                          const firstLine = lines[0].trim();
                          if ((firstLine.startsWith('**[') && firstLine.endsWith(']**')) || (firstLine.startsWith('[') && firstLine.endsWith(']'))) {
                            name = cleanSectionName(firstLine);
                            remainingLines = lines.slice(1);
                          }
                          
                          const preInstructions: string[] = [];
                          const postInstructions: string[] = [];
                          const lyricLines: string[] = [];
                          
                          let foundLyrics = false;
                          remainingLines.forEach(line => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                              if (foundLyrics) {
                                postInstructions.push(trimmed);
                              } else {
                                preInstructions.push(trimmed);
                              }
                            } else if (trimmed !== '') {
                              foundLyrics = true;
                              lyricLines.push(line);
                            }
                          });
                          
                          // Try to find existing section by index or name to preserve metadata, but ensure uniqueness
                          let existingSection = (song[index] && song[index].name === name) ? song[index] : song.find(s => s.name === name && !usedSectionIds.has(s.id));
                          
                          let sectionId = existingSection?.id || crypto.randomUUID();
                          if (usedSectionIds.has(sectionId)) sectionId = crypto.randomUUID();
                          usedSectionIds.add(sectionId);
                          
                          return {
                            id: sectionId,
                            name,
                            rhymeScheme: existingSection?.rhymeScheme || 'AABB',
                            targetSyllables: existingSection?.targetSyllables || 8,
                            mood: existingSection?.mood || '',
                            preInstructions: preInstructions.length > 0 ? preInstructions : (existingSection?.preInstructions || []),
                            postInstructions: postInstructions.length > 0 ? postInstructions : (existingSection?.postInstructions || []),
                            lines: lyricLines.map((text, lIdx) => {
                              // For lines, we also need to ensure uniqueness
                              const existingLine = existingSection?.lines.find(l => l.text === text && !usedLineIds.has(l.id)) || (existingSection?.lines[lIdx] && !usedLineIds.has(existingSection.lines[lIdx].id) ? existingSection.lines[lIdx] : null);
                              
                              let lineId = existingLine?.id || crypto.randomUUID();
                              if (usedLineIds.has(lineId)) lineId = crypto.randomUUID();
                              usedLineIds.add(lineId);

                              return {
                                id: lineId,
                                text,
                                rhymingSyllables: existingLine?.rhymingSyllables || '',
                                rhyme: existingLine?.rhyme || '',
                                syllables: text.split(/\s+/).reduce((acc, word) => acc + (word ? countSyllables(word) : 0), 0),
                                concept: existingLine?.concept || 'New line',
                                isManual: true
                              };
                            })
                          };
                        }).filter(s => s !== null) as Section[];
                        
                        if (newSections.length > 0) {
                          updateSongAndStructureWithHistory(newSections, newSections.map(s => s.name));
                        }
                        setIsMarkupMode(false);
                      } else {
                        // Convert song to markup
                        const text = song.map(section => {
                          const formatInst = (i: string) => {
                            const trimmed = i.trim();
                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed;
                            return `[${trimmed}]`;
                          };
                          const pre = (section.preInstructions || []).map(formatInst).join('\n');
                          const post = (section.postInstructions || []).map(formatInst).join('\n');
                          const lyrics = section.lines.map(l => l.text).join('\n');
                          return `[${section.name}]\n${pre ? pre + '\n' : ''}${lyrics}${post ? '\n' + post : ''}`;
                        }).join('\n\n');
                        setMarkupText(text);
                        setIsMarkupMode(true);
                      }
                    }}
                    disabled={!isMarkupMode && song.length === 0}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 fluent-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMarkupMode ? <Layout className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    {isMarkupMode ? 'Editor Mode' : 'Markup Mode'}
                  </button>
                </Tooltip>
                <Tooltip title="Analyze song structure, rhyme quality, and emotional impact">
                  <button 
                    onClick={analyzeCurrentSong}
                    disabled={isGenerating || isAnalyzing || song.length === 0}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 fluent-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Song Analysis
                  </button>
                </Tooltip>
                <Tooltip title="Rewrite the entire song based on current settings and topic">
                  <button 
                    onClick={generateSong}
                    disabled={isGenerating || isAnalyzing}
                    className="px-4 py-2 bg-[var(--accent-color)] hover:brightness-110 text-[var(--on-accent-color)] text-xs rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent-color)]/20 fluent-button whitespace-nowrap"
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Regenerate Song
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 z-10 custom-scrollbar">
          {activeTab === 'lyrics' ? (
            isMarkupMode ? (
              <div className="max-w-[1400px] mx-auto h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Markup Mode</h3>
                      <p className="text-[10px] text-zinc-500">Pure text editing experience</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[10px] text-amber-500 font-medium">Format: [Section Name] followed by lyrics. Separate sections with double newlines.</p>
                  </div>
                </div>
                <div className="flex-1 min-h-[600px] mb-6">
                  <MarkupInput
                    textareaRef={markupTextareaRef}
                    value={markupText}
                    onChange={(e: any) => setMarkupText(e.target.value)}
                    className="w-full h-full bg-zinc-900/50 dark:bg-black/50 border border-white/10 rounded-xl text-sm font-mono custom-scrollbar resize-none leading-relaxed"
                    placeholder="[Verse 1]\nLyrics go here...\n\n[Chorus]\nChorus lines..."
                    onScroll={(e: any) => {
                      const overlay = e.target.previousSibling;
                      if (overlay) {
                        overlay.scrollTop = e.target.scrollTop;
                      }
                    }}
                  />
                </div>
              </div>
            ) : song.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-5 p-8 border border-white/5 bg-white/[0.02] lcars-panel fluent-animate-in max-w-2xl mx-auto my-auto mt-20">
              <div className="w-20 h-20 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center shadow-2xl">
                <Music className="w-10 h-10 text-zinc-800" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-zinc-400 ">Ready to write your next masterpiece?</p>
                <p className="text-xs text-zinc-600 max-w-xs mx-auto">Configure your song settings in the sidebar or import existing lyrics to begin.</p>
              </div>
              <div className="flex items-center gap-4 w-full max-w-2xl">
                {hasSavedSession && (
                  <Button 
                    onClick={loadSavedSession}
                    variant="outlined"
                    color="success"
                    startIcon={<History className="w-4 h-4" />}
                    sx={{ flex: 1, py: 1.5 }}
                    style={{ flex: 1, padding: '12px 0' }}
                  >
                    Load Last Session
                  </Button>
                )}
                <Button 
                  onClick={() => setIsPasteModalOpen(true)}
                  variant="outlined"
                  color="secondary"
                  startIcon={<ClipboardPaste className="w-4 h-4" />}
                  sx={{ flex: 1, py: 1.5 }}
                  style={{ flex: 1, padding: '12px 0' }}
                >
                  Paste Lyrics
                </Button>
                <Button 
                  onClick={generateSong}
                  disabled={isGenerating || isAnalyzing}
                  variant="contained"
                  color="primary"
                  startIcon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  sx={{ flex: 1, py: 1.5 }}
                  style={{ flex: 1, padding: '12px 0' }}
                >
                  Generate Song
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto space-y-6 pb-32">
              {song.map((section, idx) => (
                <div 
                  key={section.id} 
                  id={`section-${section.id}`} 
                  className={`lcars-band transition-all fluent-animate-in relative group ${draggedItemIndex === idx ? 'opacity-30' : ''} ${dragOverIndex === idx && dragOverIndex !== draggedItemIndex ? 'border-t-2 border-[var(--accent-color)] pt-3 -mt-1' : ''}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  draggable={draggableSectionIndex === idx && !(section.name.toLowerCase() === 'intro' || section.name.toLowerCase() === 'outro')}
                  onDragStart={(e) => {
                    setDraggedItemIndex(idx);
                  }}
                  onDragOver={(e) => { 
                    e.preventDefault(); 
                    if (draggedItemIndex === null || draggedItemIndex === idx) return;
                    if (idx === 0 && song[0].name.toLowerCase() === 'intro') return;
                    if (idx === song.length - 1 && song[song.length - 1].name.toLowerCase() === 'outro') return;
                    setDragOverIndex(idx); 
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => { 
                    e.stopPropagation(); 
                    handleDrop(idx); 
                  }}
                >
                  <div className={`lcars-band-stripe ${getSectionDotColor(section.name)}`} />
                  <div className="flex-1 space-y-4 p-5">
                    <div className="flex items-center gap-3 flex-wrap pb-2 border-b border-black/5 dark:border-white/10">
                      <h3 className={`text-lg tracking-tight uppercase ${getSectionTextColor(section.name)}`}>
                        {section.name}
                      </h3>
                    <div className="w-28">
                      <Select 
                        value={section.rhymeScheme || rhymeScheme} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setSong(prev => prev.map(s => s.id === section.id ? { ...s, rhymeScheme: val } : s));
                        }}
                        className="!py-0 !px-2 !text-[10px] h-7"
                        style={{ minHeight: '28px', height: '28px' }}
                      >
                        <MenuItem value="AABB">AABB</MenuItem>
                        <MenuItem value="ABAB">ABAB</MenuItem>
                        <MenuItem value="AAAA">AAAA</MenuItem>
                        <MenuItem value="ABCB">ABCB</MenuItem>
                        <MenuItem value="AAABBB">AAABBB</MenuItem>
                        <MenuItem value="AABBCC">AABBCC</MenuItem>
                        <MenuItem value="ABABAB">ABABAB</MenuItem>
                        <MenuItem value="ABCABC">ABCABC</MenuItem>
                        <MenuItem value="FREE">FREE</MenuItem>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Input 
                        value={section.mood || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setSong(prev => prev.map(s => s.id === section.id ? { ...s, mood: val } : s));
                        }}
                        placeholder="Mood..."
                        list="mood-suggestions"
                        className="!py-0 !px-2 !text-[10px] h-7"
                        style={{ minHeight: '28px', height: '28px' }}
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded px-1 h-7">
                      <Globe className="w-3 h-3 text-zinc-500" />
                      <Select
                        value={sectionTargetLanguages[section.id] || section.language || songLanguage}
                        onChange={(e: any) => setSectionTargetLanguages(prev => ({ ...prev, [section.id]: e.target.value as string }))}
                        style={{ 
                          height: 20, 
                          fontSize: '9px',
                          color: 'var(--colorNeutralForeground2)',
                          minWidth: 45
                        }}
                      >
                        <MenuItem value="Amharic" sx={{ fontSize: '9px' }}>AM</MenuItem>
                        <MenuItem value="Arabic" sx={{ fontSize: '9px' }}>AR</MenuItem>
                        <MenuItem value="Baoulé" sx={{ fontSize: '9px' }}>BA</MenuItem>
                        <MenuItem value="Chinese" sx={{ fontSize: '9px' }}>CN</MenuItem>
                        <MenuItem value="Dioula" sx={{ fontSize: '9px' }}>DI</MenuItem>
                        <MenuItem value="English" sx={{ fontSize: '9px' }}>EN</MenuItem>
                        <MenuItem value="French" sx={{ fontSize: '9px' }}>FR</MenuItem>
                        <MenuItem value="German" sx={{ fontSize: '9px' }}>DE</MenuItem>
                        <MenuItem value="Hausa" sx={{ fontSize: '9px' }}>HA</MenuItem>
                        <MenuItem value="Italian" sx={{ fontSize: '9px' }}>IT</MenuItem>
                        <MenuItem value="Japanese" sx={{ fontSize: '9px' }}>JP</MenuItem>
                        <MenuItem value="Korean" sx={{ fontSize: '9px' }}>KR</MenuItem>
                        <MenuItem value="Lingala" sx={{ fontSize: '9px' }}>LI</MenuItem>
                        <MenuItem value="Portuguese" sx={{ fontSize: '9px' }}>PT</MenuItem>
                        <MenuItem value="Spanish" sx={{ fontSize: '9px' }}>ES</MenuItem>
                        <MenuItem value="Swahili" sx={{ fontSize: '9px' }}>SW</MenuItem>
                        <MenuItem value="Wolof" sx={{ fontSize: '9px' }}>WO</MenuItem>
                        <MenuItem value="Yoruba" sx={{ fontSize: '9px' }}>YO</MenuItem>
                        <MenuItem value="Zulu" sx={{ fontSize: '9px' }}>ZU</MenuItem>
                      </Select>
                      <Tooltip title={`Adapt this section to ${sectionTargetLanguages[section.id] || section.language || songLanguage}`}>
                        <button
                          onClick={() => adaptSectionLanguage(section.id, sectionTargetLanguages[section.id] || section.language || songLanguage)}
                          disabled={isAdaptingLanguage}
                          className="px-1.5 py-0.5 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] text-[8px] font-bold rounded transition-all disabled:opacity-50"
                        >
                          ADAPT
                        </button>
                      </Tooltip>
                    </div>
                    <Tooltip title="Rewrite only this section">
                      <Button
                        onClick={() => regenerateSection(section.id)}
                        disabled={isGenerating}
                        variant="outlined"
                        color="success"
                        size="small"
                        startIcon={<RefreshCw className="w-3 h-3" />}
                        sx={{ fontSize: '10px', py: 0, px: 1.5, minHeight: '28px', height: '28px' }}
                        style={{ minHeight: '28px', height: '28px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        Regenerate
                      </Button>
                    </Tooltip>
                    <div className="flex items-center gap-4 ml-auto flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2 shrink-0">
                        <input 
                          type="checkbox" 
                          id={`local-syllables-${section.id}`}
                          checked={section.targetSyllables !== undefined}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setSong(prev => prev.map(s => s.id === section.id ? { ...s, targetSyllables: enabled ? targetSyllables : undefined } : s));
                          }}
                          className="accent-[var(--accent-color)] cursor-pointer w-3.5 h-3.5"
                        />
                        <label htmlFor={`local-syllables-${section.id}`} className="micro-label text-zinc-500 cursor-pointer whitespace-nowrap">
                          Syllables {section.targetSyllables !== undefined ? `(${section.targetSyllables})` : `(${targetSyllables})`}
                        </label>
                      </div>
                      {section.targetSyllables !== undefined && (
                        <div className="flex items-center w-20 shrink-0">
                          <input 
                            type="range" 
                            min="4" 
                            max="20" 
                            value={section.targetSyllables} 
                            onChange={e => {
                              const val = parseInt(e.target.value);
                              setSong(prev => prev.map(s => s.id === section.id ? { ...s, targetSyllables: val } : s));
                            }}
                            className="w-full accent-[var(--accent-color)] h-1 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                      <Tooltip title="Adjust lines in this section to match the syllable target">
                        <Button
                          onClick={() => quantizeSyllables(section.id)}
                          disabled={isGenerating}
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<Ruler className="w-3 h-3" />}
                          sx={{ fontSize: '10px', py: 0, px: 1.5, minHeight: '28px', height: '28px', flexShrink: 0 }}
                          style={{ minHeight: '28px', height: '28px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        >
                          Quantize
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 px-2">
                    <div className="mb-4">
                      <InstructionEditor
                        instructions={section.preInstructions}
                        sectionId={section.id}
                        type="pre"
                        onChange={handleInstructionChange}
                        onAdd={addInstruction}
                        onRemove={removeInstruction}
                      />
                    </div>
                    
                    <div className="grid grid-cols-[1fr_100px_80px_60px_100px] gap-x-4 mb-2">
                      <div className="micro-label text-zinc-500 dark:text-zinc-600 ml-1">Lyric Line</div>
                      <div className="micro-label text-zinc-500 dark:text-zinc-600 text-center">Rhyme Syllable</div>
                      <div className="micro-label text-zinc-500 dark:text-zinc-600 text-center">Rhyme</div>
                      <div className="micro-label text-zinc-500 dark:text-zinc-600 text-center">Syllables</div>
                      <div className="micro-label text-zinc-500 dark:text-zinc-600">Concept</div>
                    </div>
                    
                    {section.lines.map((line) => (
                      <div 
                        key={line.id}
                        draggable
                        onDragStart={() => handleLineDragStart(section.id, line.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverLineInfo({ sectionId: section.id, lineId: line.id });
                        }}
                        onDragLeave={() => setDragOverLineInfo(null)}
                        onDrop={(e) => { e.stopPropagation(); handleLineDrop(section.id, line.id); }}
                        className={`grid grid-cols-[1fr_100px_80px_60px_100px] gap-x-4 items-center transition-all ${draggedLineInfo?.lineId === line.id ? 'opacity-30' : ''} ${dragOverLineInfo?.lineId === line.id && dragOverLineInfo?.lineId !== draggedLineInfo?.lineId ? 'border-t-2 border-[var(--accent-color)] pt-2 -mt-2' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-800 dark:hover:text-zinc-400 transition-colors shrink-0" />
                          {line.isManual ? (
                            <User className="w-4 h-4 text-[var(--accent-color)]/70 shrink-0" />
                          ) : (
                            <Bot className="w-4 h-4 text-[var(--accent-color)]/70 shrink-0" />
                          )}
                          <div 
                            onClick={() => handleLineClick(line.id)}
                            className={`relative group cursor-text transition-all flex-1 ${selectedLineId === line.id ? 'z-20' : ''}`}
                          >
                            <LyricInput
                              data-line-id={line.id}
                              value={line.text}
                              onChange={(e: any) => updateLineText(section.id, line.id, e.target.value)}
                              onKeyDown={(e: any) => handleLineKeyDown(e, section.id, line.id)}
                              className={`w-full bg-transparent py-1.5 text-sm transition-all focus:outline-none ${
                                selectedLineId === line.id 
                                  ? 'text-zinc-900 dark:text-white ' 
                                  : 'text-zinc-600 dark:text-zinc-400'
                              }`}
                            />
                            {selectedLineId === line.id && (
                              <div className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent-color)] rounded-full shadow-[0_0_12px_var(--accent-color)]" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <input
                            value={line.rhymingSyllables || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSong(prev => prev.map(s => ({
                                ...s,
                                lines: s.lines.map(l => l.id === line.id ? { ...l, rhymingSyllables: val } : l)
                              })));
                            }}
                            className="w-full bg-transparent text-[10px] text-center text-zinc-500 dark:text-zinc-400 focus:outline-none focus:text-zinc-900 dark:focus:text-white transition-colors"
                            placeholder="-"
                          />
                        </div>

                        <div className="flex items-center justify-center">
                          <input
                            value={line.rhyme || ''}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase().slice(0, 1);
                              setSong(prev => prev.map(s => ({
                                ...s,
                                lines: s.lines.map(l => l.id === line.id ? { ...l, rhyme: val } : l)
                              })));
                            }}
                            className={`w-7 h-7 rounded border text-[10px] telemetry-text text-center transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] ${getRhymeColor(line.rhyme)}`}
                            placeholder="-"
                          />
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <div className={`text-xs telemetry-text transition-colors ${line.syllables > targetSyllables ? 'text-[var(--accent-critical)]' : line.syllables < targetSyllables ? 'text-[var(--accent-warning)]' : 'text-[var(--accent-color)]'}`}>
                            {line.syllables}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="text-[10px] text-zinc-500 italic truncate group-hover:text-zinc-800 dark:group-hover:text-zinc-400 transition-colors">
                            {line.concept}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-4 mt-4 pt-2 border-t border-black/5 dark:border-white/5 micro-label text-zinc-500">
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-400">Lines:</span>
                        <span className="font-mono">{section.lines.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-400">Words:</span>
                        <span className="font-mono">{section.lines.reduce((acc, l) => acc + (l.text.trim() ? l.text.trim().split(/\s+/).length : 0), 0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-400">Chars:</span>
                        <span className="font-mono">{section.lines.reduce((acc, l) => acc + l.text.length, 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right handle */}
                {!(section.name.toLowerCase() === 'intro' || section.name.toLowerCase() === 'outro') ? (
                  <div 
                    className="w-8 flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing section-drag-handle hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-l border-black/5 dark:border-white/5"
                    onMouseEnter={() => setDraggableSectionIndex(idx)}
                    onMouseLeave={() => setDraggableSectionIndex(null)}
                  >
                    <GripVertical className="w-4 h-4 text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="w-8 flex-shrink-0 border-l border-black/5 dark:border-white/5" />
                )}
              </div>
              ))}
            </div>
          )
        ) : (
          <div className="max-w-4xl mx-auto space-y-12 pb-32 p-8 border border-white/5 bg-white/[0.02] lcars-panel fluent-animate-in">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                  <Waves className="w-6 h-6 text-[var(--accent-color)]" />
                </div>
                <div>
                  <h2 className="text-xl text-primary">Musical Prompt Generator</h2>
                  <p className="text-sm text-zinc-500">Define the sonic landscape for your lyrics</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <Label>GENRE / STYLE</Label>
                    <Input 
                      value={genre} 
                      onChange={e => setGenre(e.target.value)} 
                      placeholder="e.g. Synthwave, Indie Folk, Trap..." 
                    />
                  </div>
                  <div>
                    <Label>TEMPO (BPM)</Label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="40" 
                        max="220" 
                        value={tempo} 
                        onChange={e => setTempo(e.target.value)}
                        className="flex-1 accent-[var(--accent-color)] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm telemetry-text text-[var(--accent-color)] w-12 text-center">{tempo}</span>
                    </div>
                  </div>
                  <div>
                    <Label>INSTRUMENTATION</Label>
                    <textarea 
                      value={instrumentation} 
                      onChange={e => setInstrumentation(e.target.value)}
                      className="w-full bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg p-3 text-sm text-zinc-800 dark:text-zinc-300 focus:ring-2 focus:ring-[var(--accent-color)]/20 focus:border-[var(--accent-color)] outline-none transition-all min-h-[100px]"
                      placeholder="e.g. Warm analog synths, acoustic guitar, heavy 808s..."
                    />
                  </div>
                  <Button 
                    onClick={generateMusicalPrompt}
                    disabled={isGeneratingMusicalPrompt || (!title && !topic)}
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={isGeneratingMusicalPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    sx={{ py: 1.5 }}
                    style={{ padding: '12px 0' }}
                  >
                    Generate Master Prompt
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label>GENERATED MASTER PROMPT</Label>
                  <div className="relative group">
                    <div className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/5 rounded-xl p-6 min-h-[300px] text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-serif italic">
                      {musicalPrompt || "Your generated musical prompt will appear here..."}
                    </div>
                    {musicalPrompt && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(musicalPrompt);
                        }}
                        className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Copy to clipboard"
                      >
                        <ClipboardPaste className="w-4 h-4 text-zinc-400" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 micro-label text-zinc-500">
                    <Volume2 className="w-3 h-3" />
                    Optimized for Suno, Udio, and Stable Audio
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Structure */}
      <AnimatePresence>
        {isStructureOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="border-l border-fluent-border bg-fluent-sidebar flex flex-col z-10 shadow-2xl overflow-hidden lcars-panel !rounded-none"
          >
            <div className="w-[280px] flex flex-col h-full">
              <div className="h-16 px-5 border-b border-fluent-border flex items-center justify-between">
                <h3 className="micro-label text-zinc-400 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[var(--accent-color)]" />
                  Structure Editor
                </h3>
              </div>
              
              <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                <div>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1.5">
                      {structure.map((item, idx) => {
                        const isIntro = item.toLowerCase() === 'intro';
                        const isOutro = item.toLowerCase() === 'outro';
                        const isDraggable = !isIntro && !isOutro;
                        
                        return (
                          <div 
                            key={idx} 
                            draggable={isDraggable}
                            onDragStart={() => isDraggable && setDraggedItemIndex(idx)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (draggedItemIndex === null || draggedItemIndex === idx) return;
                              
                              // Validation logic for drop target
                              if (idx === 0 && structure[0].toLowerCase() === 'intro') return;
                              if (idx === structure.length - 1 && structure[structure.length - 1].toLowerCase() === 'outro') return;
                              
                              setDragOverIndex(idx);
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverIndex(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDrop(idx);
                            }}
                            className={`group flex items-center gap-2 border rounded-md pl-2 pr-1 py-2 text-xs transition-all duration-150 ${getSectionColor(item)} \n                              ${isDraggable ? 'cursor-grab active:cursor-grabbing hover:border-[var(--accent-color)]/50' : 'cursor-default'}\n                              ${draggedItemIndex === idx ? 'opacity-30' : ''} \n                              ${dragOverIndex === idx ? 'ring-2 ring-[var(--accent-color)] ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                          >
                            {isDraggable ? (
                              <GripVertical className="w-3.5 h-3.5 opacity-30 group-hover:opacity-60 transition-opacity" />
                            ) : (
                              <div className="w-3.5" />
                            )}
                            <span className="flex-1 ">{item}</span>
                            <button 
                              onClick={() => removeStructureItem(idx)}
                              className="p-1 hover:bg-black/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="relative" ref={sectionDropdownRef}>
                      <div className="flex gap-1.5 mt-3">
                        <div className="relative flex-1">
                          <Input 
                            value={newSectionName} 
                            onChange={e => {
                              setNewSectionName(e.target.value);
                              setIsSectionDropdownOpen(true);
                            }} 
                            onFocus={() => setIsSectionDropdownOpen(true)}
                            placeholder="Add section..." 
                            onKeyDown={e => e.key === 'Enter' && addStructureItem()}
                          />
                          <button 
                            onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSectionDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                        <IconButton 
                          onClick={() => addStructureItem()}
                          color="primary"
                          sx={{ 
                            backgroundColor: 'primary.main', 
                            color: 'primary.contrastText',
                            '&:hover': { backgroundColor: 'primary.dark' },
                            borderRadius: '8px'
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </IconButton>
                      </div>

                      {isSectionDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 py-1 bg-fluent-card border border-fluent-border rounded-md shadow-xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 lcars-panel">
                          {['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Breakdown', 'Outro']
                            .filter(name => {
                              if (name === 'Intro' || name === 'Outro') {
                                return !structure.some(s => s.toLowerCase() === name.toLowerCase());
                              }
                              return true;
                            })
                            .map(name => (
                              <button
                                key={name}
                                onClick={() => {
                                  addStructureItem(name);
                                  setIsSectionDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                              >
                                <Plus className="w-3 h-3 text-[var(--accent-color)]" />
                                {name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={normalizeStructure}
                      disabled={structure.length === 0 || isGenerating}
                      variant="outlined"
                      fullWidth
                      startIcon={<AlignLeft className="w-3.5 h-3.5" />}
                      sx={{ mt: 2, fontSize: '10px', py: 1 }}
                      className="mt-4"
                    >
                      Normalize Structure
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-fluent-border">
                <button 
                  onClick={() => setIsStructureOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <PanelRight className="w-3.5 h-3.5" />
                  Collapse Sidebar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className="h-10 border-t border-fluent-border bg-white/50 dark:bg-white/[0.02] flex items-center justify-between px-6 z-40 text-[10px] text-zinc-900 dark:text-zinc-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isGenerating || isAnalyzing || isSuggesting ? 'bg-[var(--accent-warning)] animate-pulse' : 'bg-[var(--accent-color)]'}`} />
            <span className="text-zinc-900 dark:text-zinc-300">
              {isGenerating ? 'Generating...' : isAnalyzing ? 'Analyzing...' : isSuggesting ? 'Suggesting...' : 'System Ready'}
            </span>
          </div>
          <div className="w-px h-3 bg-fluent-border" />
          <div className="text-zinc-900 dark:text-zinc-300">{song.length} Sections</div>
          <div className="text-zinc-900 dark:text-zinc-300">{wordCount} Words</div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-zinc-900 dark:text-zinc-300"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            Dark/Light Theme
          </button>
          <div className="w-px h-3 bg-fluent-border" />
          <button 
            onClick={() => setAudioFeedback(!audioFeedback)}
            className="flex items-center gap-2 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors text-zinc-900 dark:text-zinc-300"
            title="Toggle Audio Feedback"
          >
            {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            Audio Feedback
          </button>
          <div className="w-px h-3 bg-fluent-border" />
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-1 text-zinc-900 dark:text-zinc-300 hover:text-[var(--accent-color)] transition-colors"
          >
            Lyricist Pro v02.07
          </button>
        </div>
      </div>

      {/* About Dialog */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAboutOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-fluent-card border border-fluent-border shadow-2xl overflow-hidden lcars-panel"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center shadow-inner">
                  <Music className="w-10 h-10 text-[var(--accent-color)]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl text-primary tracking-tight">Lyricist Pro</h2>
                  <p className="text-xs telemetry-text text-[var(--accent-color)]">v02.05 by VoxNova42</p>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  A professional-grade AI lyrics editor designed for songwriters and poets. 
                  Craft your masterpiece with real-time suggestions, structure management, 
                  and intelligent quantization.
                </p>
                <div className="pt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between micro-label text-zinc-500 border-t border-fluent-border pt-4">
                    <span>Engine</span>
                    <span className="text-zinc-400">Gemini 3.1 Pro</span>
                  </div>
                  <div className="flex items-center justify-between micro-label text-zinc-500">
                    <span>License</span>
                    <span className="text-zinc-400">Commercial Pro</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Sidebar - Suggestions */}
      {selectedLineId && (
        <div className="absolute right-8 top-24 bottom-8 w-80 acrylic rounded-2xl shadow-3xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[var(--accent-warning)]" />
              AI Suggestions
            </h3>
            <button 
              onClick={() => setSelectedLineId(null)}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {isSuggesting ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-color)]/20 border-t-[var(--accent-color)] animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-[var(--accent-color)] animate-pulse" />
                </div>
                <p className="text-xs text-zinc-500 animate-pulse">Crafting alternatives...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      applySuggestion(suggestion);
                      setSelectedLineId(null);
                    }}
                    className="group p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[var(--accent-color)]/30 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                  >
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white leading-relaxed">{suggestion}</p>
                    <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] text-[var(--accent-color)] uppercase tracking-wider">Click to apply</span>
                      <Check className="w-3 h-3 text-[var(--accent-color)]" />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => generateSuggestions(selectedLineId)}
                  className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-[var(--accent-color)] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  More options
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20">
                <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center">
                  <Hash className="w-6 h-6 text-zinc-800" />
                </div>
                <p className="text-xs text-zinc-500">Select a line to explore AI-powered alternatives.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="acrylic w-full max-w-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 lcars-panel">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg text-zinc-100 flex items-center gap-2.5">
                <ClipboardPaste className="w-5 h-5 text-[var(--accent-color)]" />
                Paste Lyrics
              </h3>
              <button 
                onClick={() => setIsPasteModalOpen(false)} 
                className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Paste your existing lyrics below. Our AI will analyze them to extract the structure, rhyme scheme, syllable count, and core concepts to fit into the editor.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your lyrics here..."
                className="w-full h-80 bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--accent-color)]/50 focus:ring-1 focus:ring-[var(--accent-color)]/30 transition-all resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-800 font-mono leading-relaxed"
              />
            </div>
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
              <Button
                onClick={() => setIsPasteModalOpen(false)}
                variant="text"
                color="inherit"
              >
                Cancel
              </Button>
              <Button
                onClick={analyzePastedLyrics}
                disabled={!pastedText.trim() || isAnalyzing}
                variant="contained"
                color="info"
                startIcon={isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze & Import'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {isAnalysisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="acrylic w-full max-w-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 lcars-panel">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg text-zinc-100 flex items-center gap-2.5">
                <BarChart2 className="w-5 h-5 text-[var(--accent-color)]" />
                Song Analysis Report
              </h3>
              <button 
                onClick={() => setIsAnalysisModalOpen(false)} 
                className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              {isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-[var(--accent-color)]/10 border-t-[var(--accent-color)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-[var(--accent-color)] animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-3 text-center">
                    <h4 className="text-xl font-medium text-zinc-100">Deep Lyrics Analysis</h4>
                    <div className="flex flex-col items-center gap-2">
                      {analysisSteps.map((step, idx) => (
                        <p 
                          key={idx} 
                          className={`text-sm transition-all duration-500 ${idx === analysisSteps.length - 1 ? 'text-[var(--accent-color)] font-medium scale-110' : 'text-zinc-500 opacity-50'}`}
                        >
                          {step}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : analysisReport ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section className="space-y-3">
                    <h4 className="micro-label text-[var(--accent-color)] flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      Theme & Narrative
                    </h4>
                    <p className="text-zinc-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      {analysisReport.theme}
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="micro-label text-[var(--accent-color)] flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      Emotional Arc
                    </h4>
                    <p className="text-zinc-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      {analysisReport.emotionalArc}
                    </p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="space-y-3">
                      <h4 className="micro-label text-emerald-500 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {analysisReport.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-zinc-400 flex gap-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="space-y-3">
                      <h4 className="micro-label text-amber-500 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" />
                        Actionable Improvements
                      </h4>
                      <ul className="space-y-3">
                        {analysisReport.improvements.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 group">
                            <button
                              onClick={() => !appliedAnalysisItems.has(s) && toggleAnalysisItemSelection(s)}
                              disabled={isApplyingAnalysis !== null || appliedAnalysisItems.has(s)}
                              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                appliedAnalysisItems.has(s) 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : selectedAnalysisItems.has(s)
                                    ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white'
                                    : 'border-white/20 hover:border-amber-500/50 group-hover:bg-amber-500/10'
                              }`}
                            >
                              {appliedAnalysisItems.has(s) ? (
                                <Check className="w-3 h-3" />
                              ) : selectedAnalysisItems.has(s) ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-amber-500/50" />
                              )}
                            </button>
                            <span className={`text-sm leading-relaxed transition-colors ${appliedAnalysisItems.has(s) ? 'text-zinc-500 line-through' : selectedAnalysisItems.has(s) ? 'text-zinc-200' : 'text-zinc-400'}`}>
                              {s}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <section className="space-y-3">
                    <h4 className="micro-label text-blue-500 flex items-center gap-2">
                      <Music className="w-3.5 h-3.5" />
                      Musical Suggestions
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysisReport.musicalSuggestions.map((s: string, i: number) => (
                        <div 
                          key={i} 
                          onClick={() => !appliedAnalysisItems.has(s) && toggleAnalysisItemSelection(s)}
                          className={`text-xs p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 group ${
                            appliedAnalysisItems.has(s)
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-500'
                              : selectedAnalysisItems.has(s)
                                ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/30 text-zinc-200'
                                : 'bg-blue-500/5 border-blue-500/10 text-zinc-400 hover:bg-blue-500/10 hover:border-blue-500/30'
                          }`}
                        >
                          <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                            appliedAnalysisItems.has(s) 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : selectedAnalysisItems.has(s)
                                ? 'bg-[var(--accent-color)] border-[var(--accent-color)] text-white'
                                : 'border-white/20 group-hover:border-blue-500/50'
                          }`}>
                            {appliedAnalysisItems.has(s) || selectedAnalysisItems.has(s) ? (
                              <Check className="w-2.5 h-2.5" />
                            ) : (
                              <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                            )}
                          </div>
                          <span className={appliedAnalysisItems.has(s) ? 'line-through' : ''}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="pt-6 border-t border-white/5">
                    <div className="bg-[var(--accent-color)]/5 border border-[var(--accent-color)]/20 p-5 rounded-2xl">
                      <h4 className="text-sm font-medium text-[var(--accent-color)] mb-2">Executive Summary</h4>
                      <p className="text-sm text-zinc-300 italic leading-relaxed">
                        "{analysisReport.summary}"
                      </p>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <p className="text-zinc-500">No analysis data available.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-4">
                {appliedAnalysisItems.size > 0 && (
                  <button
                    onClick={() => {
                      // If we want to undo ALL, we should use the version we saved
                      const beforeVersion = versions.find(v => v.name === 'Before Analysis Improvements' || v.name === 'Before Analysis Batch Improvements');
                      if (beforeVersion) rollbackToVersion(beforeVersion);
                      setAppliedAnalysisItems(new Set());
                    }}
                    className="text-[10px] uppercase tracking-widest text-amber-500 hover:text-amber-400 flex items-center gap-2 transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Revert All Analysis Changes
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedAnalysisItems.size > 0 && (
                  <Button
                    onClick={applySelectedAnalysisItems}
                    variant="contained"
                    color="success"
                    disabled={isApplyingAnalysis !== null}
                    startIcon={isApplyingAnalysis === 'batch' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  >
                    Apply Selected ({selectedAnalysisItems.size})
                  </Button>
                )}
                <Button
                  onClick={() => setIsAnalysisModalOpen(false)}
                  variant="outlined"
                  color="inherit"
                  disabled={isAnalyzing || isApplyingAnalysis !== null}
                >
                  Close Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Versions Modal */}
      {isVersionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="acrylic w-full max-w-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300 lcars-panel">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg text-zinc-100 flex items-center gap-2.5">
                <History className="w-5 h-5 text-[var(--accent-color)]" />
                Song Versions
              </h3>
              <button 
                onClick={() => setIsVersionsModalOpen(false)} 
                className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-zinc-400">
                  Track your progress and rollback to any previous version of your song.
                </p>
                <Button
                  onClick={() => {
                    const name = prompt('Enter version name:');
                    if (name !== null) saveVersion(name);
                  }}
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Save Current
                </Button>
              </div>

              {versions.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/10 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-white/[0.02] flex items-center justify-center">
                    <History className="w-6 h-6 text-zinc-800" />
                  </div>
                  <p className="text-sm text-zinc-500">No versions saved yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div 
                      key={version.id}
                      className="group p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-[var(--accent-color)]/30 rounded-xl transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-medium text-zinc-200">{version.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(version.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          onClick={() => rollbackToVersion(version)}
                          variant="text"
                          color="primary"
                          size="small"
                          startIcon={<Undo2 className="w-3.5 h-3.5" />}
                          sx={{ fontSize: '10px' }}
                        >
                          Rollback
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Layout className="w-3 h-3" />
                          {version.song.length} Sections
                        </div>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {version.topic || 'No topic'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
              <Button
                onClick={() => setIsVersionsModalOpen(false)}
                variant="contained"
                color="inherit"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="acrylic rounded-2xl w-full max-w-md shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[var(--accent-critical)]/[0.02]">
              <h3 className="text-lg text-[var(--accent-critical)] flex items-center gap-2.5">
                <Trash2 className="w-5 h-5" />
                Reset Song
              </h3>
              <button 
                onClick={() => setIsResetModalOpen(false)} 
                className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Are you sure you want to clear the current song? This action will remove all lyrics and structure. You can use the Undo button to recover it if you change your mind.
              </p>
            </div>
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-6 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetSong}
                className="px-6 py-2.5 bg-[var(--accent-critical)]/10 hover:bg-[var(--accent-critical)]/20 text-[var(--accent-critical)] text-sm rounded-lg transition-all flex items-center gap-2 border border-[var(--accent-critical)]/20 fluent-button"
              >
                <Trash2 className="w-4 h-4" />
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </FluentProvider>
  );
}