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
  isSessionHydrated: boolean;
  isMobileOverlay?: boolean;
}

export function LeftSettingsPanel({
  title, setTitle, titleOrigin, onGenerateTitle, isGeneratingTitle,
  topic, setTopic, mood, setMood,
  rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables,
  song, isGenerating, quantizeSyllables,
  isLeftPanelOpen, setIsLeftPanelOpen,
  onSurprise, isSurprising,
  onGenerateSong,
  isSessionHydrated,
  isMobileOverlay,
}: Props) {
  const { t } = useTranslation();

  // ── Desktop: inline sidebar ───────────────────────────────────────────────
  if (!isMobileOverlay) {
    // Guard: don't render until session is hydrated — prevents blank flash
    if (!isLeftPanelOpen || !isSessionHydrated) return null;
    return (
      <div
        className={`border-r border-fluent-border bg-fluent-sidebar flex flex-col shadow-2xl lcars-panel fluent-animate-panel w-[22rem] shrink-0 h-full overflow-hidden`}
        style={{
          borderRight: 'none',
          boxShadow: 'inset -1px 0 0 transparent',
          position: 'relative',
        }}
      >
        {/* LCARS gradient separator — right edge */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0,
          width: '2px',
          background: 'linear-gradient(180deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
          opacity: 0.7,
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        <PanelContent
          t={t} title={title} setTitle={setTitle} titleOrigin={titleOrigin}
          onGenerateTitle={onGenerateTitle} isGeneratingTitle={isGeneratingTitle}
          topic={topic} setTopic={setTopic} mood={mood} setMood={setMood}
          rhymeScheme={rhymeScheme} setRhymeScheme={setRhymeScheme}
          targetSyllables={targetSyllables} setTargetSyllables={setTargetSyllables}
          song={song} isGenerating={isGenerating} quantizeSyllables={quantizeSyllables}
          isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
          onSurprise={onSurprise} isSurprising={isSurprising} onGenerateSong={onGenerateSong}
        />
      </div>
    );
  }

  // ── Mobile/tablet: fixed overlay ─────────────────────────────────────────
  return (
    <div
      className={`border border-fluent-border bg-fluent-sidebar flex flex-col shadow-2xl lcars-panel fluent-animate-panel
        fixed left-0 top-0 bottom-0 z-[80] w-[min(22rem,85vw)]
        transition-transform duration-300 ease-in-out
        ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
      style={{ position: 'fixed' }}
    >
      {/* LCARS gradient separator — right edge */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0,
        width: '2px',
        background: 'linear-gradient(180deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      {/* Mobile: always render content (panel is off-screen when closed — no flash risk) */}
      <PanelContent
        t={t} title={title} setTitle={setTitle} titleOrigin={titleOrigin}
        onGenerateTitle={onGenerateTitle} isGeneratingTitle={isGeneratingTitle}
        topic={topic} setTopic={setTopic} mood={mood} setMood={setMood}
        rhymeScheme={rhymeScheme} setRhymeScheme={setRhymeScheme}
        targetSyllables={targetSyllables} setTargetSyllables={setTargetSyllables}
        song={song} isGenerating={isGenerating} quantizeSyllables={quantizeSyllables}
        isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
        onSurprise={onSurprise} isSurprising={isSurprising} onGenerateSong={onGenerateSong}
      />
    </div>
  );
}

// ── Inner content ────────────────────────────────────────────────────────────
function PanelContent({
  t, title, setTitle, titleOrigin, onGenerateTitle, isGeneratingTitle,
  topic, setTopic, mood, setMood,
  rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables,
  song, isGenerating, quantizeSyllables,
  isLeftPanelOpen: _isLeftPanelOpen, setIsLeftPanelOpen,
  onSurprise, isSurprising, onGenerateSong,
}: Omit<Props, 'isMobileOverlay' | 'isSessionHydrated'> & { t: ReturnType<typeof useTranslation>['t'] }) {
  return (
    <div className="w-full flex flex-col h-full">
      <div className="h-16 px-5 border-b border-fluent-border flex items-center justify-between" style={{
        borderBottom: '1px solid transparent',
        backgroundImage: 'none',
        boxShadow: 'inset 0 -1px 0 var(--border-color)',
        position: 'relative',
      }}>
        {/* LCARS gradient separator — bottom of header */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
          opacity: 0.5,
          pointerEvents: 'none',
        }} />
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
                  accentColor="var(--lcars-violet)"
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
              accentColor="var(--lcars-cyan)"
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

      <div className="p-5 border-t border-fluent-border space-y-3" style={{ position: 'relative' }}>
        {/* LCARS gradient separator — top of footer */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
          opacity: 0.5,
          pointerEvents: 'none',
        }} />
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
  );
}
