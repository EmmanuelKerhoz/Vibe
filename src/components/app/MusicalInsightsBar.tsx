/**
 * MusicalInsightsBar
 * Ribbon contextuel affiché à la place de InsightsBar quand activeTab === 'musical'.
 *
 * Groupes :
 *   [State]   — badge prompt filled/empty
 *   [Actions] — Auto-Suggest · Copy · Export JSON · Reset fields
 *   [Generate]— bouton Generate → Suno (spinner pendant génération)
 *   [Quality] — score de complétude du prompt (segments remplis / total)
 */
import React, { useCallback, useState } from 'react';
import { Tooltip } from '../ui/Tooltip';
import { useTranslation } from '../../i18n';
import { useSongContext } from '../../contexts/SongContext';
import { useComposerContext } from '../../contexts/ComposerContext';
import { useSuno } from '../../hooks/useSuno';
import { copyToClipboard } from '../../utils/clipboard';
import {
  MusicNote2Regular,
  CopyRegular,
  ArrowDownloadRegular,
  DeleteRegular,
  PlayCircleRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  SparkleRegular,
} from '@fluentui/react-icons';

// ─── helpers ─────────────────────────────────────────────────────────────────

function computeCompleteness(prompt: string | undefined): { filled: number; total: number; pct: number } {
  if (!prompt || prompt.trim().length === 0) return { filled: 0, total: 5, pct: 0 };
  const checks = [
    /style/i,
    /mood|vibe/i,
    /vocal|voice/i,
    /instrument|bpm|tempo/i,
    /structure|verse|chorus/i,
  ];
  const filled = checks.filter(re => re.test(prompt)).length;
  return { filled, total: checks.length, pct: Math.round((filled / checks.length) * 100) };
}

// ─── sub-components ──────────────────────────────────────────────────────────

function PromptStateBadge({ hasPrompt }: { hasPrompt: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide"
      style={{
        background: hasPrompt
          ? 'color-mix(in srgb, var(--lcars-cyan, #4f98a3) 12%, transparent)'
          : 'color-mix(in srgb, var(--text-secondary) 8%, transparent)',
        color: hasPrompt ? 'var(--lcars-cyan, #4f98a3)' : 'var(--text-secondary)',
        border: `1px solid ${
          hasPrompt
            ? 'color-mix(in srgb, var(--lcars-cyan, #4f98a3) 25%, transparent)'
            : 'var(--border-color)'
        }`,
      }}
      aria-label={hasPrompt ? 'Prompt ready' : 'Prompt empty'}
    >
      {hasPrompt
        ? <CheckmarkCircleRegular style={{ width: 13, height: 13 }} />
        : <ErrorCircleRegular style={{ width: 13, height: 13 }} />}
      <span>{hasPrompt ? 'PROMPT READY' : 'NO PROMPT'}</span>
    </div>
  );
}

function CompletenessScore({ pct, filled, total }: { pct: number; filled: number; total: number }) {
  const color =
    pct >= 80 ? 'var(--lcars-cyan, #4f98a3)'
    : pct >= 40 ? 'var(--lcars-amber, #e8af34)'
    : 'var(--accent-danger, #f87171)';

  return (
    <Tooltip title={`Prompt completeness: ${filled}/${total} sections detected`}>
      <div className="flex items-center gap-2" aria-label={`Completeness ${pct}%`}>
        <div
          style={{
            width: 56,
            height: 4,
            borderRadius: 2,
            background: 'var(--border-color)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: color,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color,
            minWidth: 28,
          }}
        >
          {pct}%
        </span>
      </div>
    </Tooltip>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      style={{
        width: 1,
        height: 20,
        background: 'var(--border-color)',
        opacity: 0.5,
        flexShrink: 0,
      }}
    />
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export const MusicalInsightsBar = React.memo(function MusicalInsightsBar() {
  const { t } = useTranslation();

  // ── Song state ──────────────────────────────────────────────────────────────
  const {
    musicalPrompt,
    setMusicalPrompt,
    setGenre,
    setTempo,
    setInstrumentation,
    setRhythm,
    setNarrative,
    genre,
    mood,
    instrumentation,
    rhythm,
    title,
  } = useSongContext();

  // ── Composer ────────────────────────────────────────────────────────────────
  const {
    isGenerating,
    isGeneratingMusicalPrompt,
    generateMusicalPrompt,
  } = useComposerContext();

  // ── Suno ────────────────────────────────────────────────────────────────────
  const { generate, status } = useSuno();

  const isSunoGenerating =
    status.phase === 'generating' || status.phase === 'polling';

  const hasPrompt = Boolean(musicalPrompt && musicalPrompt.trim().length > 0);
  const { filled, total, pct } = computeCompleteness(musicalPrompt);
  const busy = isGenerating || isGeneratingMusicalPrompt || isSunoGenerating;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setMusicalPrompt('');
    setGenre('');
    setTempo(120);
    setInstrumentation('');
    setRhythm('');
    setNarrative('');
  }, [setMusicalPrompt, setGenre, setTempo, setInstrumentation, setRhythm, setNarrative]);

  const handleGenerateWithSuno = useCallback(() => {
    if (!musicalPrompt.trim()) return;
    const trimmedTitle = title?.trim();
    void generate({
      prompt: musicalPrompt.trim(),
      ...(trimmedTitle ? { title: trimmedTitle } : {}),
      style: [genre, mood, instrumentation, rhythm].filter(Boolean).join(', '),
    });
  }, [generate, musicalPrompt, title, genre, mood, instrumentation, rhythm]);

  // copy feedback
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    if (!musicalPrompt) return;
    const ok = await copyToClipboard(musicalPrompt);
    if (!ok) return; // clipboard unavailable — do not flash the "Copied" state
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [musicalPrompt]);

  // export as JSON
  const handleExport = useCallback(() => {
    if (!musicalPrompt) return;
    const blob = new Blob(
      [JSON.stringify({ prompt: musicalPrompt, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'musical-prompt.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [musicalPrompt]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      role="toolbar"
      aria-label="Musical generation controls"
      className="flex items-center gap-3 px-4 py-2 border-b border-fluent-border"
      style={{
        backgroundColor: 'var(--bg-elev-1, var(--bg-app))',
        minHeight: 40,
        flexWrap: 'wrap',
        userSelect: 'none',
      }}
    >
      {/* ── State ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <MusicNote2Regular
          style={{ width: 15, height: 15, color: 'var(--lcars-violet, #a86fdf)', flexShrink: 0 }}
          aria-hidden
        />
        <PromptStateBadge hasPrompt={hasPrompt} />
      </div>

      <Divider />

      {/* ── Prompt actions ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* Auto-Suggest */}
        <Tooltip title="Generate musical prompt from current settings">
          <button
            onClick={generateMusicalPrompt}
            disabled={busy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
            style={{
              background: busy
                ? 'transparent'
                : 'color-mix(in srgb, var(--accent-color) 10%, transparent)',
              color: busy ? 'var(--text-secondary)' : 'var(--accent-color)',
              border: `1px solid ${
                busy
                  ? 'var(--border-color)'
                  : 'color-mix(in srgb, var(--accent-color) 30%, transparent)'
              }`,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
            aria-label={t.tooltips?.generateMusical ?? 'Generate musical prompt'}
          >
            <SparkleRegular style={{ width: 13, height: 13 }} />
            <span className="hidden sm:inline">Auto-Suggest</span>
          </button>
        </Tooltip>

        {/* Copy */}
        <Tooltip title={copied ? 'Copied!' : 'Copy prompt to clipboard'}>
          <button
            onClick={handleCopy}
            disabled={!hasPrompt || busy}
            className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md transition-all"
            style={{
              color: copied ? 'var(--lcars-cyan, #4f98a3)' : 'var(--text-secondary)',
              opacity: hasPrompt ? 1 : 0.35,
              cursor: hasPrompt ? 'pointer' : 'not-allowed',
            }}
            aria-label="Copy prompt"
            aria-pressed={copied}
          >
            <CopyRegular style={{ width: 15, height: 15 }} />
          </button>
        </Tooltip>

        {/* Export JSON */}
        <Tooltip title="Export prompt as JSON">
          <button
            onClick={handleExport}
            disabled={!hasPrompt || busy}
            className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md transition-all"
            style={{
              color: 'var(--text-secondary)',
              opacity: hasPrompt ? 1 : 0.35,
              cursor: hasPrompt ? 'pointer' : 'not-allowed',
            }}
            aria-label="Export prompt as JSON"
          >
            <ArrowDownloadRegular style={{ width: 15, height: 15 }} />
          </button>
        </Tooltip>

        {/* Reset */}
        <Tooltip title="Reset all musical fields">
          <button
            onClick={handleReset}
            disabled={busy}
            className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md transition-all"
            style={{
              color: 'var(--text-secondary)',
              opacity: busy ? 0.35 : 0.7,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
            aria-label="Reset musical form"
          >
            <DeleteRegular style={{ width: 15, height: 15 }} />
          </button>
        </Tooltip>
      </div>

      <Divider />

      {/* ── Suno generate ─────────────────────────────────────────────── */}
      <Tooltip title={hasPrompt ? 'Generate music with Suno' : 'Generate a prompt first'}>
        <button
          onClick={handleGenerateWithSuno}
          disabled={!hasPrompt || busy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all"
          style={{
            background:
              hasPrompt && !busy
                ? 'var(--lcars-amber, #e8af34)'
                : 'color-mix(in srgb, var(--lcars-amber, #e8af34) 15%, transparent)',
            color: hasPrompt && !busy ? '#0c0c0c' : 'var(--text-secondary)',
            border: 'none',
            cursor: hasPrompt && !busy ? 'pointer' : 'not-allowed',
            opacity: hasPrompt ? 1 : 0.4,
            minHeight: 28,
          }}
          aria-label="Generate music with Suno"
          aria-busy={isSunoGenerating}
        >
          {isSunoGenerating ? (
            <span
              className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin"
              aria-hidden
            />
          ) : (
            <PlayCircleRegular style={{ width: 14, height: 14 }} />
          )}
          <span>
            {status.phase === 'polling'
              ? `Generating… ${Math.round(((status as { elapsed?: number }).elapsed ?? 0) / 1000)}s`
              : isSunoGenerating
              ? 'Generating…'
              : 'Generate Music'}
          </span>
        </button>
      </Tooltip>

      {/* Suno error */}
      {status.phase === 'error' && (
        <span
          className="text-[10px]"
          style={{ color: 'var(--accent-danger, #f87171)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={(status as { message?: string }).message}
        >
          {(status as { message?: string }).message}
        </span>
      )}

      {/* ── Completeness ─────────────────────────────────────────────── */}
      <div className="ml-auto hidden sm:flex items-center gap-2">
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Prompt
        </span>
        <CompletenessScore pct={pct} filled={filled} total={total} />
      </div>
    </div>
  );
});
