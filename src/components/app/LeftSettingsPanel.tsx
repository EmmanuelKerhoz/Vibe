import React from 'react';
import { Music, PanelLeft, Ruler, Bot, User, Sparkles, Loader2, Shuffle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { LcarsSelect } from '../ui/LcarsSelect';
import { useTranslation } from '../../i18n';
import type { Section } from '../../types';

interface Props {
  title: string;
  setTitle: (v: string) => void;
  titleOrigin: 'user' | 'ai';
  onGenerateTitle: () => void;
  isGeneratingTitle: boolean;
  topic: string;
  setTopic: (v: string) => void;
  mood: string;
  setMood: (v: string) => void;
  rhymeScheme: string;
  setRhymeScheme: (v: string) => void;
  targetSyllables: number;
  setTargetSyllables: (v: number) => void;
  song: Section[];
  isGenerating: boolean;
  quantizeSyllables: () => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  onSurprise: () => void;
  isSurprising: boolean;
  onGenerateSong: () => void;
  /** Extra class applied to the panel root (e.g. mobile overlay). */
  className?: string;
}

export function LeftSettingsPanel({
  title, setTitle, titleOrigin, onGenerateTitle, isGeneratingTitle,
  topic, setTopic, mood, setMood,
  rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables,
  song, isGenerating, quantizeSyllables,
  isLeftPanelOpen, setIsLeftPanelOpen,
  onSurprise, isSurprising,
  onGenerateSong,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={`border border-fluent-border bg-fluent-sidebar flex flex-col shadow-2xl lcars-panel fluent-animate-panel
      fixed left-3 right-3 top-3 bottom-3 z-[80] max-w-[26rem]
      transition-all duration-300 ease-in-out
      ${isLeftPanelOpen
        ? 'translate-x-0 opacity-100'
        : '-translate-x-[110%] opacity-0 pointer-events-none'
      }${className ? ` ${className}` : ''}`}
    >
      <div className="w-full flex flex-col h-full">
        <div className="h-16 px-5 border-b border-fluent-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center shadow-inner">
              <Music className="w-5 h-5 text-[var(--accent-color)]" />
            </div>
            <h1 className="text-base text-primary tracking-tight">{t.app.name}</h1>
          </div>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">New generation</span>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-4 rounded-full bg-[var(--lcars-amber,#f59e0b)] opacity-80" />
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">Song Info</span>
          </div>
          <div className="space-y-4">
            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <span>{t.leftPanel.songTitle}</span>
                  {titleOrigin === 'ai' ? (
                    <Tooltip title={t.tooltips.aiGeneratedTitle}>
                      <Bot className="w-3 h-3 text-[var(--accent-color)]" />
                    </Tooltip>
                  ) : (
                    <Tooltip title={t.tooltips.userEnteredTitle}>
                      <User className="w-3 h-3 text-zinc-400" />
                    </Tooltip>
                  )}
                </div>
              </Label>
              <div className="flex items-center gap-2">
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.leftPanel.songTitlePlaceholder} className="flex-1" />
                <Tooltip title={t.tooltips.generateTitle}>
                  <button
                    onClick={onGenerateTitle}
                    disabled={isGeneratingTitle || song.length === 0}
                    className="ux-interactive px-2 py-1.5 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] rounded transition-all disabled:opacity-50"
                  >
                    {isGeneratingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">Topic &amp; Mood</span>
                <Tooltip title="Generate a random topic &amp; mood with AI">
                  <Button
                    onClick={onSurprise}
                    disabled={isSurprising || isGenerating}
                    variant="outlined" color="primary"
                    startIcon={isSurprising
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Shuffle className="w-3 h-3" />}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                  >
                    Surprise
                  </Button>
                </Tooltip>
              </div>
              <div>
                <Label>{t.leftPanel.songTopic}</Label>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder={t.leftPanel.songTopicPlaceholder} />
              </div>
              <div>
                <Label>{t.leftPanel.songMood}</Label>
                <div className="space-y-2">
                  <Input
                    value={mood}
                    onChange={e => setMood(e.target.value)}
                    placeholder={t.leftPanel.songMoodPlaceholder}
                    list="mood-suggestions"
                  />
                  <LcarsSelect
                    value=""
                    onChange={(v) => { if (v) setMood(v); }}
                    placeholder={t.leftPanel.songMoodPresets}
                    options={Object.entries(t.moods).map(([, moodOption]) => ({ value: moodOption, label: moodOption }))}
                  />
                </div>
                <datalist id="mood-suggestions">
                  {Object.entries(t.moods).map(([key, moodOption]) => <option key={key} value={moodOption} />)}
                </datalist>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 mx-1" />

          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-4 rounded-full bg-[var(--lcars-cyan,#06b6d4)] opacity-80" />
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">Composition</span>
          </div>
          <div className="space-y-4">
            <div>
              <Label>{t.leftPanel.rhymeScheme}</Label>
              <LcarsSelect
                value={rhymeScheme}
                onChange={setRhymeScheme}
                options={[
                  { value: 'AABB', label: t.rhymeSchemes.AABB },
                  { value: 'ABAB', label: t.rhymeSchemes.ABAB },
                  { value: 'AAAA', label: t.rhymeSchemes.AAAA },
                  { value: 'ABCB', label: t.rhymeSchemes.ABCB },
                  { value: 'AAABBB', label: t.rhymeSchemes.AAABBB },
                  { value: 'AABBCC', label: t.rhymeSchemes.AABBCC },
                  { value: 'ABABAB', label: t.rhymeSchemes.ABABAB },
                  { value: 'ABCABC', label: t.rhymeSchemes.ABCABC },
                  { value: 'FREE', label: t.rhymeSchemes.FREE },
                ]}
              />
            </div>
            <div>
              <Label>{t.leftPanel.targetSyllables}</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="4" max="20" value={targetSyllables}
                  onChange={e => setTargetSyllables(parseInt(e.target.value))}
                  className="flex-1 accent-[var(--accent-color)] h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs telemetry-text text-[var(--accent-color)] w-5 text-center">{targetSyllables}</span>
              </div>
            </div>
            <Tooltip title={t.tooltips.quantize}>
              <Button
                onClick={quantizeSyllables}
                disabled={song.length === 0 || isGenerating}
                variant="outlined" color="primary" fullWidth
                startIcon={<Ruler className="w-3.5 h-3.5" />}
                style={{ fontSize: '10px', padding: '4px 0' }}
                className="mt-4"
              >
                {t.leftPanel.quantize}
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="p-5 border-t border-fluent-border space-y-3">
          <Button
            onClick={onGenerateSong}
            disabled={isGenerating}
            variant="contained"
            color="primary"
            fullWidth
            startIcon={isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            style={{ fontSize: '11px', padding: '8px 0' }}
          >
            {t.editor.emptyState.generateSong}
          </Button>
          <Tooltip title={t.tooltips.collapseLeft}>
            <button
              onClick={() => setIsLeftPanelOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest text-[var(--accent-color)] hover:text-[var(--accent-color)]/80 transition-colors"
            >
              <PanelLeft className="w-3.5 h-3.5" />
              Close
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
