import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import {
  Button,
  Input,
  Select,
  Textarea,
  Label,
  Spinner,
  Badge,
  Card,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Tooltip,
} from '@fluentui/react-components';
import {
  SparkleRegular,
  CheckmarkRegular,
  DismissRegular,
  MusicNote2Regular,
  TextAlignLeftRegular,
  NumberSymbolRegular,
  LightbulbRegular,
  ClipboardPasteRegular,
  ArrowUndoRegular,
  ArrowRedoRegular,
  RulerRegular,
  DataBarVerticalRegular,
  ArrowClockwiseRegular,
} from '@fluentui/react-icons';

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
        lines: section.lines.map((line: any) => ({ ...line, id: crypto.randomUUID() }))
      }));
      updateSongWithHistory(songWithIds);
      setSelectedLineId(null);
      setIsPasteModalOpen(false);
      setPastedText('');
    } catch (error) {
      console.error('Failed to analyze lyrics:', error);
      alert('Failed to analyze lyrics. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSong = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Write a song about "${topic}". \nMood: ${mood}\nRhyme Scheme: ${rhymeScheme}\nTarget Syllables per line: ${targetSteps}\nStructure: ${structure}\n\nFor each line, provide the lyric text, the rhyme identifier (e.g., A, B), the exact syllable count, and a short core concept.`;
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
        lines: section.lines.map((line: any) => ({ ...line, id: crypto.randomUUID() }))
      }));
      setSong(songWithIds);
      setSelectedLineId(null);
    } catch (error) {
      console.error('Failed to generate song:', error);
      alert('Failed to generate song. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const quantizeSyllables = async () => {
    if (song.length === 0) return;
    setIsGenerating(true);
    try {
      const prompt = `Rewrite the following song so that EVERY line has EXACTLY ${targetSteps} syllables. Maintain the original meaning, rhyme scheme, and section structure.\n\nCurrent Song:\n${JSON.stringify(song, null, 2)}\n\nReturn the updated song in the exact same JSON structure.`;
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
        lines: section.lines.map((line: any) => ({ ...line, id: crypto.randomUUID() }))
      }));
      updateSongWithHistory(songWithIds);
    } catch (error) {
      console.error('Failed to quantize:', error);
      alert('Failed to quantize syllables. Please try again.');
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
    if (!currentLine) { setIsSuggesting(false); return; }
    try {
      const prompt = `Generate 3 creative alternative versions for a lyric line.\nContext:\n- Topic: ${topic}\n- Mood: ${mood}\n- Rhyme Scheme: ${rhymeScheme}\n- Target Syllables: ${targetSteps}\n- Section: ${sectionName}\n${previousLine ? `- Previous Line: "${previousLine.text}" (Rhyme: ${previousLine.rhyme})` : ''}\n- Current Line to replace: "${currentLine.text}" (Rhyme: ${currentLine.rhyme}, Concept: ${currentLine.concept})\n${nextLine ? `- Next Line: "${nextLine.text}" (Rhyme: ${nextLine.rhyme})` : ''}\n\nProvide exactly 3 alternative lines that fit the context, mood, and rhyme scheme. Return them as a JSON array of strings.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      const data = JSON.parse(response.text || '[]');
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const updateLineText = (sectionId: string, lineId: string, newText: string) => {
    setSong(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, lines: section.lines.map(line => line.id === lineId ? { ...line, text: newText } : line) }
        : section
    ));
  };

  const applySuggestion = (newText: string) => {
    if (!selectedLineId) return;
    const newSong = song.map(section => ({
      ...section,
      lines: section.lines.map(line => line.id === selectedLineId ? { ...line, text: newText } : line)
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
    <div style={{ height: '100vh', width: '100%', display: 'flex', overflow: 'hidden', backgroundColor: '#09090b', color: '#d4d4d8' }}>

      {/* ── Left Sidebar ── */}
      <div style={{ width: 320, borderRight: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#0c0c0e', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MusicNote2Regular style={{ color: '#818cf8', fontSize: 16 }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#f4f4f5' }}>Lyricist Pro</span>
        </div>

        <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label htmlFor="topic">Topic / Theme</Label>
            <Input id="topic" value={topic} onChange={(_, d) => setTopic(d.value)} placeholder="What is the song about?" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label htmlFor="mood">Mood / Vibe</Label>
            <Input id="mood" value={mood} onChange={(_, d) => setMood(d.value)} placeholder="e.g., Upbeat, Melancholic" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="rhyme">Rhyme Scheme</Label>
              <Select id="rhyme" value={rhymeScheme} onChange={(_, d) => setRhymeScheme(d.value)}>
                <option value="AABB">AABB</option>
                <option value="ABAB">ABAB</option>
                <option value="ABCB">ABCB</option>
                <option value="AAAA">AAAA</option>
                <option value="Free">Free Verse</option>
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="steps">Target Steps</Label>
              <Input id="steps" type="number" value={String(targetSteps)} onChange={(_, d) => setTargetSteps(parseInt(d.value) || 0)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label htmlFor="structure">Song Structure</Label>
            <Textarea
              id="structure"
              value={structure}
              onChange={(_, d) => setStructure(d.value)}
              placeholder="Verse 1, Chorus, Verse 2..."
              resize="vertical"
              style={{ minHeight: 80 }}
            />
          </div>
        </div>

        <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            appearance="primary"
            icon={isGenerating ? <Spinner size="tiny" /> : <SparkleRegular />}
            onClick={generateSong}
            disabled={isGenerating || isAnalyzing}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isGenerating ? 'Generating...' : 'Generate Song'}
          </Button>
          <Button
            appearance="secondary"
            icon={<ClipboardPasteRegular />}
            onClick={() => setIsPasteModalOpen(true)}
            disabled={isGenerating || isAnalyzing}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Paste Lyrics
          </Button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#09090b', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, background: 'rgba(99,102,241,0.05)', filter: 'blur(120px)', pointerEvents: 'none', borderRadius: '50%' }} />

        {/* Top bar */}
        <div style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 10, backgroundColor: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(8px)' }}>
          <span style={{ fontSize: 13, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TextAlignLeftRegular style={{ fontSize: 16 }} /> Editor
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tooltip content="Undo" relationship="label">
              <Button appearance="subtle" icon={<ArrowUndoRegular />} onClick={undo} disabled={past.length === 0} />
            </Tooltip>
            <Tooltip content="Redo" relationship="label">
              <Button appearance="subtle" icon={<ArrowRedoRegular />} onClick={redo} disabled={future.length === 0} />
            </Tooltip>
            <div style={{ width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
            <Button
              appearance="outline"
              icon={<RulerRegular />}
              onClick={quantizeSyllables}
              disabled={song.length === 0 || isGenerating}
              size="small"
            >
              Quantize Steps
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {song.length > 0 && (
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', padding: '24px 32px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DataBarVerticalRegular style={{ fontSize: 16 }} /> Song Structure & Stats
              </span>
              <div style={{ display: 'flex', gap: 24 }}>
                {([['Sections', sectionCount], ['Words', wordCount], ['Characters', charCount]] as [string, number][]).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#d4d4d8' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {song.map(section => (
                <Badge key={section.id} appearance="tint" color="brand" style={{ flexShrink: 0 }}>
                  {section.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Editor */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32, zIndex: 10 }}>
          {song.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#71717a' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MusicNote2Regular style={{ fontSize: 32, color: '#3f3f46' }} />
              </div>
              <p style={{ fontSize: 14 }}>Configure settings and generate a song, or paste existing lyrics to start editing.</p>
              <Button appearance="secondary" icon={<ClipboardPasteRegular />} onClick={() => setIsPasteModalOpen(true)}>Paste Lyrics</Button>
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 48, paddingBottom: 80 }}>
              {song.map(section => (
                <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <span style={{ width: 32, height: 1, backgroundColor: '#27272a', display: 'inline-block' }} />
                    {section.name}
                  </h3>
                  <Card style={{ padding: 0, overflow: 'hidden', backgroundColor: '#0c0c0e', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <TableHeaderCell style={{ width: 48, textAlign: 'center' }}><NumberSymbolRegular style={{ fontSize: 12, color: '#71717a' }} /></TableHeaderCell>
                          <TableHeaderCell>Lyric Line</TableHeaderCell>
                          <TableHeaderCell style={{ width: 96, textAlign: 'center' }}>Rhyme</TableHeaderCell>
                          <TableHeaderCell style={{ width: 96, textAlign: 'center' }}>Steps</TableHeaderCell>
                          <TableHeaderCell style={{ width: 256 }}>Concept</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.lines.map((line, idx) => (
                          <TableRow
                            key={line.id}
                            onClick={() => handleLineClick(line.id)}
                            style={{
                              cursor: 'pointer',
                              borderLeft: selectedLineId === line.id ? '3px solid #818cf8' : '3px solid transparent',
                              backgroundColor: selectedLineId === line.id ? 'rgba(99,102,241,0.06)' : undefined,
                            }}
                          >
                            <TableCell style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: '#52525b' }}>{idx + 1}</TableCell>
                            <TableCell>
                              <input
                                value={line.text}
                                onChange={(e) => updateLineText(section.id, line.id, e.target.value)}
                                onFocus={saveHistory}
                                style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', color: '#e4e4e7', fontWeight: 500, fontSize: 14 }}
                                placeholder="Enter lyric line..."
                              />
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }}>
                              <Badge appearance="outline" style={{ fontFamily: 'monospace', fontSize: 11 }}>{line.rhyme}</Badge>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: '#71717a' }}>{line.syllables}</TableCell>
                            <TableCell style={{ fontSize: 12, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 256 }}>{line.concept}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar – Suggestions ── */}
      {selectedLineId && (
        <div style={{ width: 320, borderLeft: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#0c0c0e', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
          <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: 8 }}>
              <LightbulbRegular style={{ color: '#fbbf24', fontSize: 16 }} /> AI Suggestions
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <Tooltip content="Regenerate" relationship="label">
                <Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={() => generateSuggestions(selectedLineId)} size="small" disabled={isSuggesting} />
              </Tooltip>
              <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setSelectedLineId(null)} size="small" />
            </div>
          </div>
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            {isSuggesting ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 16 }}>
                <Spinner size="medium" label="Brainstorming..." />
              </div>
            ) : suggestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.6, margin: 0 }}>Based on your theme, mood, and rhyme scheme, here are some alternatives:</p>
                {suggestions.map((suggestion, idx) => (
                  <Card key={idx} style={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.06)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 14, color: '#e4e4e7', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>"{suggestion}"</p>
                    <Button
                      appearance="primary"
                      icon={<CheckmarkRegular />}
                      onClick={() => applySuggestion(suggestion)}
                      size="small"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Apply Line
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#71717a', textAlign: 'center', marginTop: 40 }}>Select a line to get AI suggestions.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Paste Modal ── */}
      <Dialog open={isPasteModalOpen} onOpenChange={(_, d) => setIsPasteModalOpen(d.open)}>
        <DialogSurface style={{ backgroundColor: '#0c0c0e', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 640, width: '100%' }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setIsPasteModalOpen(false)} />
              }
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardPasteRegular style={{ color: '#818cf8', fontSize: 20 }} /> Paste Lyrics
              </span>
            </DialogTitle>
            <DialogContent>
              <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 16, lineHeight: 1.6 }}>
                Paste your existing lyrics below. Our AI will analyze them to extract the structure, rhyme scheme, syllable count, and core concepts to fit into the editor.
              </p>
              <Textarea
                value={pastedText}
                onChange={(_, d) => setPastedText(d.value)}
                placeholder="Paste your lyrics here..."
                resize="vertical"
                style={{ width: '100%', minHeight: 256, fontFamily: 'monospace', fontSize: 13 }}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsPasteModalOpen(false)}>Cancel</Button>
              <Button
                appearance="primary"
                icon={isAnalyzing ? <Spinner size="tiny" /> : <SparkleRegular />}
                onClick={analyzePastedLyrics}
                disabled={!pastedText.trim() || isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze & Import'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
