import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Sparkles, Check, X, Loader2, RefreshCw, Music, AlignLeft, Hash, Lightbulb, ClipboardPaste, Undo2, Redo2, Ruler, BarChart2 } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Line {
  id: string;
  text: string;
  rhyme: string;
  syllables: number;
  concept: string;
}

interface Section {
  id: string;
  name: string;
  lines: Line[];
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{children}</label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700"
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select 
    {...props} 
    className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none"
  >
    {props.children}
  </select>
);

export default function App() {
  const [topic, setTopic] = useState('A neon city in the rain');
  const [mood, setMood] = useState('Cyberpunk, melancholic, reflective');
  const [rhymeScheme, setRhymeScheme] = useState('AABB');
  const [targetSteps, setTargetSteps] = useState(10);
  const [structure, setStructure] = useState('Verse 1, Chorus, Verse 2, Chorus, Bridge, Outro');
  
  const [song, setSong] = useState<Section[]>([]);
  const [past, setPast] = useState<Section[][]>([]);
  const [future, setFuture] = useState<Section[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const saveHistory = () => {
    setPast(prev => [...prev, song]);
    setFuture([]);
  };

  const updateSongWithHistory = (newSong: Section[]) => {
    setPast(prev => [...prev, song]);
    setFuture([]);
    setSong(newSong);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));
    setFuture(prev => [song, ...prev]);
    setSong(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(prev => prev.slice(1));
    setPast(prev => [...prev, song]);
    setSong(next);
  };
  
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePastedLyrics = async () => {
    if (!pastedText.trim()) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze the following lyrics and structure them into sections (e.g., Verse 1, Chorus). For each line, provide the exact lyric text, the rhyme identifier (e.g., A, B), the exact syllable count, and a short core concept.\n\nLyrics:\n${pastedText}`;

      const response = await ai.models.generateContent({
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
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING }
                    },
                    required: ["text", "rhyme", "syllables", "concept"]
                  }
                }
              },
              required: ["name", "lines"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      const songWithIds = data.map((section: any) => ({
        ...section,
        id: crypto.randomUUID(),
        lines: section.lines.map((line: any) => ({
          ...line,
          id: crypto.randomUUID()
        }))
      }));
      updateSongWithHistory(songWithIds);
      setSelectedLineId(null);
      setIsPasteModalOpen(false);
      setPastedText('');
    } catch (error) {
      console.error("Failed to analyze lyrics:", error);
      alert("Failed to analyze lyrics. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSong = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Write a song about "${topic}". 
Mood: ${mood}
Rhyme Scheme: ${rhymeScheme}
Target Syllables per line: ${targetSteps}
Structure: ${structure}

For each line, provide the lyric text, the rhyme identifier (e.g., A, B), the exact syllable count, and a short core concept.`;

      const response = await ai.models.generateContent({
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
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING }
                    },
                    required: ["text", "rhyme", "syllables", "concept"]
                  }
                }
              },
              required: ["name", "lines"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      const songWithIds = data.map((section: any) => ({
        ...section,
        id: crypto.randomUUID(),
        lines: section.lines.map((line: any) => ({
          ...line,
          id: crypto.randomUUID()
        }))
      }));
      setSong(songWithIds);
      setSelectedLineId(null);
    } catch (error) {
      console.error("Failed to generate song:", error);
      alert("Failed to generate song. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const quantizeSyllables = async () => {
    if (song.length === 0) return;
    setIsGenerating(true);
    try {
      const prompt = `Rewrite the following song so that EVERY line has EXACTLY ${targetSteps} syllables. Maintain the original meaning, rhyme scheme, and section structure.

Current Song:
${JSON.stringify(song, null, 2)}

Return the updated song in the exact same JSON structure.`;

      const response = await ai.models.generateContent({
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
                lines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      rhyme: { type: Type.STRING },
                      syllables: { type: Type.INTEGER },
                      concept: { type: Type.STRING }
                    },
                    required: ["text", "rhyme", "syllables", "concept"]
                  }
                }
              },
              required: ["name", "lines"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      const songWithIds = data.map((section: any) => ({
        ...section,
        id: crypto.randomUUID(),
        lines: section.lines.map((line: any) => ({
          ...line,
          id: crypto.randomUUID()
        }))
      }));
      updateSongWithHistory(songWithIds);
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
      const prompt = `Generate 3 creative alternative versions for a lyric line.
Context:
- Topic: ${topic}
- Mood: ${mood}
- Rhyme Scheme: ${rhymeScheme}
- Target Syllables: ${targetSteps}
- Section: ${sectionName}
${previousLine ? `- Previous Line: "${previousLine.text}" (Rhyme: ${previousLine.rhyme})` : ''}
- Current Line to replace: "${currentLine.text}" (Rhyme: ${currentLine.rhyme}, Concept: ${currentLine.concept})
${nextLine ? `- Next Line: "${nextLine.text}" (Rhyme: ${nextLine.rhyme})` : ''}

Provide exactly 3 alternative lines that fit the context, mood, and rhyme scheme. Return them as a JSON array of strings.`;

      const response = await ai.models.generateContent({
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

      const data = JSON.parse(response.text || '[]');
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
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
              return { ...line, text: newText };
            }
            return line;
          })
        };
      }
      return section;
    }));
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

  const handleLineClick = (lineId: string) => {
    if (selectedLineId === lineId) return;
    setSelectedLineId(lineId);
    generateSuggestions(lineId);
  };

  const sectionCount = song.length;
  const wordCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.split(/\s+/).filter(w => w.length > 0).length, 0), 0);
  const charCount = song.reduce((acc, sec) => acc + sec.lines.reduce((lAcc, line) => lAcc + line.text.length, 0), 0);

  return (
    <div className="h-screen w-full bg-[#09090b] text-zinc-300 flex overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Left Sidebar - Settings */}
      <div className="w-80 border-r border-zinc-800/60 bg-[#0c0c0e] flex flex-col z-10 shadow-xl">
        <div className="p-6 border-b border-zinc-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Music className="w-4 h-4 text-indigo-400" />
          </div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
            Lyricist Pro
          </h1>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div>
            <Label>Topic / Theme</Label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="What is the song about?" />
          </div>
          <div>
            <Label>Mood / Vibe</Label>
            <Input value={mood} onChange={e => setMood(e.target.value)} placeholder="e.g., Upbeat, Melancholic" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rhyme Scheme</Label>
              <Select value={rhymeScheme} onChange={e => setRhymeScheme(e.target.value)}>
                <option value="AABB">AABB</option>
                <option value="ABAB">ABAB</option>
                <option value="ABCB">ABCB</option>
                <option value="AAAA">AAAA</option>
                <option value="Free">Free Verse</option>
              </Select>
            </div>
            <div>
              <Label>Target Steps</Label>
              <Input type="number" value={targetSteps} onChange={e => setTargetSteps(parseInt(e.target.value) || 0)} min={1} max={20} />
            </div>
          </div>
          <div>
            <Label>Song Structure</Label>
            <textarea 
              value={structure} 
              onChange={e => setStructure(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all min-h-[80px] resize-y"
              placeholder="Verse 1, Chorus, Verse 2..."
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-zinc-800/60 bg-[#0c0c0e] space-y-3">
          <button 
            onClick={generateSong} 
            disabled={isGenerating || isAnalyzing}
            className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-900 font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Song
              </>
            )}
          </button>
          <button 
            onClick={() => setIsPasteModalOpen(true)} 
            disabled={isGenerating || isAnalyzing}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800"
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste Lyrics
          </button>
        </div>
      </div>

      {/* Main Content - Table */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-8 z-10 bg-[#09090b]/80 backdrop-blur-sm">
          <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <AlignLeft className="w-4 h-4" />
            Editor
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={past.length === 0}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-2"></div>
            <button
              onClick={quantizeSyllables}
              disabled={song.length === 0 || isGenerating}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-all flex items-center gap-2 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ruler className="w-3.5 h-3.5" />
              Quantize Steps
            </button>
          </div>
        </div>
        
        {song.length > 0 && (
          <div className="border-b border-zinc-800/60 bg-zinc-900/10 p-6 z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Song Structure & Stats
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Sections</span>
                  <span className="text-sm font-mono text-zinc-300">{sectionCount}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Words</span>
                  <span className="text-sm font-mono text-zinc-300">{wordCount}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Characters</span>
                  <span className="text-sm font-mono text-zinc-300">{charCount}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {song.map((section) => (
                <div key={section.id} className="flex-shrink-0 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-medium text-indigo-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  {section.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 z-10">
          {song.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <div className="w-16 h-16 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 flex items-center justify-center">
                <Music className="w-8 h-8 text-zinc-700" />
              </div>
              <p className="text-sm">Configure settings and generate a song, or paste existing lyrics to start editing.</p>
              <button 
                onClick={() => setIsPasteModalOpen(true)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium rounded-lg transition-all flex items-center gap-2 border border-zinc-800"
              >
                <ClipboardPaste className="w-4 h-4" />
                Paste Lyrics
              </button>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-12 pb-20">
              {song.map(section => (
                <div key={section.id} className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-zinc-800"></span>
                    {section.name}
                  </h3>
                  <div className="bg-[#0c0c0e] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800/60 text-[10px] text-zinc-500 uppercase tracking-wider bg-zinc-900/20">
                          <th className="px-4 py-3 font-medium w-12 text-center"><Hash className="w-3 h-3 mx-auto" /></th>
                          <th className="px-4 py-3 font-medium">Lyric Line</th>
                          <th className="px-4 py-3 font-medium w-24 text-center">Rhyme</th>
                          <th className="px-4 py-3 font-medium w-24 text-center">Steps</th>
                          <th className="px-4 py-3 font-medium w-64">Concept</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {section.lines.map((line, idx) => (
                          <tr 
                            key={line.id} 
                            onClick={() => handleLineClick(line.id)}
                            className={`group transition-colors ${selectedLineId === line.id ? 'bg-indigo-500/[0.03] border-l-2 border-l-indigo-500' : 'hover:bg-zinc-800/20 border-l-2 border-l-transparent'}`}
                          >
                            <td className="px-4 py-3.5 text-xs text-zinc-600 font-mono text-center">{idx + 1}</td>
                            <td className="px-4 py-3.5">
                              <input 
                                value={line.text}
                                onChange={(e) => updateLineText(section.id, line.id, e.target.value)}
                                onFocus={saveHistory}
                                className="bg-transparent border-none outline-none w-full text-zinc-200 font-medium placeholder-zinc-700 focus:text-white transition-colors"
                                placeholder="Enter lyric line..."
                              />
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 shadow-inner">
                                {line.rhyme}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center text-xs font-mono text-zinc-500">
                              {line.syllables}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-zinc-500 truncate max-w-[16rem]">
                              {line.concept}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Suggestions */}
      {selectedLineId && (
        <div className="w-80 border-l border-zinc-800/60 bg-[#0c0c0e] flex flex-col shadow-2xl z-20">
          <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/20">
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              AI Suggestions
            </h3>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => generateSuggestions(selectedLineId)} 
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                title="Regenerate"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSuggesting ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setSelectedLineId(null)} 
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto bg-[#0c0c0e]">
            {isSuggesting ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-4 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs font-medium uppercase tracking-wider">Brainstorming...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Based on your theme, mood, and rhyme scheme, here are some alternatives:
                </p>
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-[#09090b] border border-zinc-800/80 rounded-xl p-4 space-y-4 group hover:border-indigo-500/40 transition-all shadow-sm">
                    <p className="text-sm text-zinc-200 leading-relaxed font-medium">"{suggestion}"</p>
                    <button 
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full py-2 bg-zinc-900 hover:bg-indigo-500 text-zinc-400 hover:text-white text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 border border-zinc-800 hover:border-indigo-500"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Apply Line
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-500 text-center mt-10">
                Select a line to get AI suggestions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/20">
              <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-indigo-400" />
                Paste Lyrics
              </h3>
              <button 
                onClick={() => setIsPasteModalOpen(false)} 
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-zinc-400 mb-4">
                Paste your existing lyrics below. Our AI will analyze them to extract the structure, rhyme scheme, syllable count, and core concepts to fit into the editor.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your lyrics here..."
                className="w-full h-64 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-y placeholder:text-zinc-700 font-mono"
              />
            </div>
            <div className="p-6 border-t border-zinc-800/60 bg-zinc-900/20 flex justify-end gap-3">
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={analyzePastedLyrics}
                disabled={!pastedText.trim() || isAnalyzing}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze & Import
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
