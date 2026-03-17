import React from 'react';
import { Music, Wand2, Loader2, Zap } from 'lucide-react';
import { useTranslation } from '../../../i18n';

const AMBER_PRIMARY = '#f59e0b';
const AMBER_SECONDARY = '#38bdf8';

const MUSICAL_GUIDE_STEPS = [
  { title: 'Start broad',         description: 'Choose the family that gets closest to the track before refining the micro-scene.' },
  { title: 'Refine the niche',    description: 'Use a sub-style to tell whether it leans indie, club-ready, cinematic, soulful, or hybrid.' },
  { title: 'Give references',     description: 'Artist touchpoints, mood words, and era cues help define the intended lane instantly.' },
  { title: 'Lock the production', description: 'Confirm BPM, groove, and instruments so the prompt sounds intentional instead of generic.' },
];

interface Props {
  title: string;
  topic: string;
  mood: string;
  hasContext: boolean;
  hasApiKey: boolean;
  isAnalyzingLyrics: boolean;
  isGeneratingMusicalPrompt: boolean;
  analyzeLyricsForMusic: () => void;
}

export function LyricsMusicAnalysis({ title, topic, mood, hasContext, hasApiKey, isAnalyzingLyrics, isGeneratingMusicalPrompt, analyzeLyricsForMusic }: Props) {
  const { t } = useTranslation();
  const m = t.musical;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] lcars-ribbon-rail">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px_4px_12px_4px] flex items-center justify-center shrink-0" style={{ background: `${AMBER_PRIMARY}22` }}>
              <Music className="w-5 h-5" style={{ color: AMBER_PRIMARY }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: AMBER_PRIMARY }}>{m.title}</h2>
              <p className="text-xs mt-0.5" style={{ color: AMBER_SECONDARY }}>{m.description}</p>
            </div>
          </div>
          {hasApiKey && (
            <button onClick={analyzeLyricsForMusic} disabled={isAnalyzingLyrics || isGeneratingMusicalPrompt}
              className="ux-interactive flex items-center gap-2 px-3 py-2 text-xs font-medium tracking-wide shrink-0 disabled:opacity-50 disabled:cursor-not-allowed border"
              style={{ borderRadius: '10px 3px 10px 3px', background: `${AMBER_PRIMARY}1a`, borderColor: `${AMBER_PRIMARY}55`, color: AMBER_PRIMARY }}
            >
              {isAnalyzingLyrics ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAnalyzingLyrics ? m.analyzing : m.analyzeLyricsShort}</span>
            </button>
          )}
        </div>
        {hasContext && (
          <div className="mt-3 flex items-center gap-2 text-[10px] px-3 py-1.5 border"
            style={{ borderRadius: '10px 3px 10px 3px', background: `${AMBER_PRIMARY}0d`, borderColor: `${AMBER_PRIMARY}2a`, color: AMBER_SECONDARY }}
          >
            <Zap className="w-3 h-3 shrink-0" style={{ color: AMBER_PRIMARY }} />
            <span>{m.contextInfo}</span>
            <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
              {title && <span className="px-1.5 py-0.5 rounded-md font-medium" style={{ background: `${AMBER_PRIMARY}22`, color: AMBER_PRIMARY }}>{title}</span>}
              {topic && <span className="px-1.5 py-0.5 rounded-md text-[var(--text-secondary)] bg-[var(--border-color)]/40">{topic}</span>}
              {mood  && <span className="px-1.5 py-0.5 rounded-md text-[var(--text-secondary)] bg-[var(--border-color)]/40">{mood}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Guide steps */}
      <div className="grid gap-2 lg:grid-cols-4 px-6 pt-2">
        {MUSICAL_GUIDE_STEPS.map((step, index) => (
          <div key={step.title} className="ux-interactive border px-3 py-2.5"
            style={{ borderRadius: '14px 4px 14px 4px', background: `${AMBER_SECONDARY}10`, borderColor: `${AMBER_SECONDARY}30` }}
          >
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] uppercase"
              style={{ color: index === 0 ? AMBER_PRIMARY : AMBER_SECONDARY }}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center border text-[9px]" style={{ borderRadius: '50%', borderColor: `${AMBER_SECONDARY}45` }}>{index + 1}</span>
              {step.title}
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
