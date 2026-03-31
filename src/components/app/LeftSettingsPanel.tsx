import React, { useId, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Music, Ruler, Bot, User, Sparkles, Loader2, Shuffle, RefreshCw, X } from '../ui/icons';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { LcarsSelect } from '../ui/LcarsSelect';
import { useTranslation } from '../../i18n';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  onSurprise: () => void;
  isSurprising: boolean;
  hasApiKey: boolean;
  onGenerateSong: () => void;
  onRegenerateSong?: () => void;
  isMobileOverlay?: boolean;
}

const SOLID_BG_DARK = 'var(--bg-app, #0c0c0c)';

type PanelContentProps = Omit<Props, 'isMobileOverlay'> & {
  t: ReturnType<typeof useTranslation>['t'];
  isMobileOverlay: boolean;
  song: ReturnType<typeof useSongContext>['song'];
  isGenerating: ReturnType<typeof useComposerContext>['isGenerating'];
  quantizeSyllables: ReturnType<typeof useComposerContext>['quantizeSyllables'];
  headingId?: string;
};

const RHYME_SCHEME_ORDER = ['FREE', 'AABB', 'ABAB', 'AAAA', 'ABCB', 'AAABBB', 'AABBCC', 'ABABAB', 'ABCABC'] as const;

export function LeftSettingsPanel({
  title, setTitle, titleOrigin, onGenerateTitle, isGeneratingTitle,
  topic, setTopic, mood, setMood,
  rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables,
  isLeftPanelOpen, setIsLeftPanelOpen,
  onSurprise, isSurprising, hasApiKey,
  onGenerateSong,
  onRegenerateSong,
  isMobileOverlay,
}: Props) {
  const { t } = useTranslation();
  const { song } = useSongContext();
  const { isGenerating, quantizeSyllables } = useComposerContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const handleClose = () => setIsLeftPanelOpen(false);
  useFocusTrap(panelRef, !!(isMobileOverlay && isLeftPanelOpen), handleClose);

  // ── Mobile/tablet: fixed overlay ────────────────────────────────────────────────────────
  if (isMobileOverlay) {
    return (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`flex flex-col shadow-2xl lcars-panel
          fixed left-0 top-0 z-[80] w-[min(22rem,85vw)]
          transition-transform duration-300 ease-in-out
          ${isLeftPanelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
        style={{
          bottom: 'calc(56px + var(--sab, 0px))',
          position: 'fixed',
          overflow: 'hidden',
          backgroundColor: 'color-mix(in srgb, var(--bg-app, #0c0c0c) 98%, transparent)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRight: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        }}
      >
        {/* LCARS separator — right edge */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: '2px',
          background: 'linear-gradient(180deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
          opacity: 0.85, pointerEvents: 'none', zIndex: 10,
        }} />
        <PanelContent
          t={t} title={title} setTitle={setTitle} titleOrigin={titleOrigin}
          onGenerateTitle={onGenerateTitle} isGeneratingTitle={isGeneratingTitle}
          topic={topic} setTopic={setTopic} mood={mood} setMood={setMood}
          rhymeScheme={rhymeScheme} setRhymeScheme={setRhymeScheme}
          targetSyllables={targetSyllables} setTargetSyllables={setTargetSyllables}
          song={song} isGenerating={isGenerating} quantizeSyllables={quantizeSyllables}
          isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
          onSurprise={onSurprise} isSurprising={isSurprising} hasApiKey={hasApiKey} onGenerateSong={onGenerateSong}
          onRegenerateSong={onRegenerateSong}
          isMobileOverlay={true}
          headingId={headingId}
        />
      </div>
    );
  }

  // ── Desktop: animated inline sidebar ──────────────────────────────────────────
  return (
    <AnimatePresence initial={false}>
      {isLeftPanelOpen && (
        <motion.div
          key="left-panel-desktop"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 352, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="shrink-0 h-full flex flex-col relative lcars-panel"
          style={{
            overflow: 'hidden',
            backgroundColor: SOLID_BG_DARK,
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            borderRight: '1px solid var(--border-color, rgba(255,255,255,0.08))',
            minWidth: 0,
          }}
        >
          {/* LCARS separator — right edge */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: '2px',
            background: 'linear-gradient(180deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
            opacity: 0.85, pointerEvents: 'none', zIndex: 2,
          }} />
          <div style={{ width: 352, minWidth: 352, flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <PanelContent
              t={t} title={title} setTitle={setTitle} titleOrigin={titleOrigin}
              onGenerateTitle={onGenerateTitle} isGeneratingTitle={isGeneratingTitle}
              topic={topic} setTopic={setTopic} mood={mood} setMood={setMood}
              rhymeScheme={rhymeScheme} setRhymeScheme={setRhymeScheme}
              targetSyllables={targetSyllables} setTargetSyllables={setTargetSyllables}
              song={song} isGenerating={isGenerating} quantizeSyllables={quantizeSyllables}
              isLeftPanelOpen={isLeftPanelOpen} setIsLeftPanelOpen={setIsLeftPanelOpen}
              onSurprise={onSurprise} isSurprising={isSurprising} hasApiKey={hasApiKey} onGenerateSong={onGenerateSong}
              onRegenerateSong={onRegenerateSong}
              isMobileOverlay={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Inner content ──────────────────────────────────────────────────────────────────
function PanelContent({
  t, title, setTitle, titleOrigin, onGenerateTitle, isGeneratingTitle,
  topic, setTopic, mood, setMood,
  rhymeScheme, setRhymeScheme, targetSyllables, setTargetSyllables,
  song, isGenerating, quantizeSyllables,
  isLeftPanelOpen: _isLeftPanelOpen, setIsLeftPanelOpen,
  onSurprise, isSurprising, hasApiKey, onGenerateSong, onRegenerateSong,
  isMobileOverlay,
  headingId,
}: PanelContentProps) {
  const hasLyrics = song.some(section => section.lines.some(line => !line.isMeta && line.text.trim().length > 0));
  const isAiUnavailable = !hasApiKey;
  const primaryActionLabel = hasLyrics ? t.editor.regenerateLyrics : t.editor.emptyState.generateSong;
  const primaryActionTooltip = isAiUnavailable
    ? (t.tooltips.aiUnavailable ?? 'AI unavailable')
    : (hasLyrics ? t.tooltips.regenerate : t.tooltips.generateSong);
  const primaryActionHandler = hasLyrics && onRegenerateSong ? onRegenerateSong : onGenerateSong;
  const primaryActionIcon = isGenerating
    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
    : hasLyrics
      ? <RefreshCw className="w-3.5 h-3.5" />
      : <Sparkles className="w-3.5 h-3.5" />;

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">

      {/* Header — accent rail bottom, reversed gradient, full-width bleed */}
      <div className="h-16 px-5 flex items-center justify-between shrink-0" style={{ position: 'relative', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
        {/* Reversed accent rail — touches both panel borders */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 'var(--accent-rail-thickness, 2px)',
          background: 'var(--accent-rail-gradient-h-rev)',
          opacity: 0.85, pointerEvents: 'none', zIndex: 1,
        }} />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
            <Music className="w-5 h-5 text-[var(--accent-color)]" />
          </div>
          <h1
            id={headingId}
            className="text-base text-primary tracking-tight"
          >
            {t.app.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">New generation</span>
          <button
            type="button"
            onClick={() => setIsLeftPanelOpen(false)}
            aria-label="Close lyrics generation panel"
            className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 rounded-full bg-[var(--lcars-amber,#f59e0b)] opacity-80" />
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">Song Info</span>
          <div className="flex-1" />
          <Tooltip title={isAiUnavailable ? (t.tooltips.aiUnavailable ?? 'AI unavailable') : 'Suggest a random topic, mood &amp; title'}>
            <div className="lcars-gradient-outline" style={{ borderRadius: '8px 2px 8px 2px' }}>
              <Button
                onClick={onSurprise}
                disabled={isAiUnavailable || isSurprising || isGenerating}
                variant="outlined" color="primary"
                className="ux-interactive"
                startIcon={isSurprising ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shuffle className="w-3 h-3" />}
                style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px 2px 8px 2px' }}
              >
                Suggest
              </Button>
            </div>
          </Tooltip>
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
              {hasLyrics && (
                  <Tooltip title={isAiUnavailable ? (t.tooltips.aiUnavailable ?? 'AI unavailable') : t.tooltips.generateTitle}>
                    <button
                      onClick={onGenerateTitle}
                      disabled={isAiUnavailable || isGeneratingTitle}
                      aria-label={t.tooltips.generateTitle}
                      className="ux-interactive px-2 py-1.5 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] rounded transition-all disabled:opacity-50"
                  >
                    {isGeneratingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          <div className="space-y-3">
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

        <div className="flex items-center gap-2">
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
              options={RHYME_SCHEME_ORDER.map(value => ({
                value,
                label: t.rhymeSchemes[value],
              }))}
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
              onClick={() => { void quantizeSyllables(); }}
              disabled={song.length === 0 || isGenerating}
              variant="outlined" color="primary" fullWidth
              startIcon={<Ruler className="w-3.5 h-3.5" />}
              style={{ fontSize: '10px', padding: '4px 0' }}
            >
              {t.leftPanel.quantize}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Footer — generate / regenerate button */}
      <div className="p-5 shrink-0">
        <Tooltip title={primaryActionTooltip}>
          <div className="lcars-gradient-outline" style={{ borderRadius: '10px 3px 10px 3px', width: '100%' }}>
            <Button
              onClick={primaryActionHandler}
              disabled={isAiUnavailable || isGenerating}
              variant="outlined" color="primary" fullWidth
              className="ux-interactive"
              startIcon={primaryActionIcon}
              style={{ fontSize: '10px', padding: '4px 0', borderRadius: '10px 3px 10px 3px' }}
            >
              {primaryActionLabel}
            </Button>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
