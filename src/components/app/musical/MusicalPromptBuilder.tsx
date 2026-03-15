import React, { useState, useCallback } from 'react';
import {
  Sparkle24Regular,
  Copy24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { useTranslation } from '../../../i18n';

function SpinnerIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`inline-flex animate-spin ${className ?? ''}`} style={style}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
      </svg>
    </span>
  );
}

const AMBER_PRIMARY = '#f59e0b';

function GBPanel({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`lcars-gb-panel ${className}`} style={style}>{children}</div>;
}

interface Props {
  musicalPrompt: string;
  setMusicalPrompt: (v: string) => void;
  isGeneratingMusicalPrompt: boolean;
  isAnalyzingLyrics: boolean;
  canGenerate: boolean;
  generateMusicalPrompt: () => void;
}

export function MusicalPromptBuilder({
  musicalPrompt, setMusicalPrompt,
  isGeneratingMusicalPrompt, isAnalyzingLyrics,
  canGenerate, generateMusicalPrompt,
}: Props) {
  const { t } = useTranslation();
  const m = t.musical;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!musicalPrompt) return;
    navigator.clipboard.writeText(musicalPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [musicalPrompt]);

  return (
    <div className="space-y-4">
      <button onClick={generateMusicalPrompt}
        disabled={!canGenerate || isGeneratingMusicalPrompt || isAnalyzingLyrics}
        className="ux-interactive w-full flex items-center justify-center gap-2.5 px-6 py-3.5 font-semibold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
        style={{ borderRadius: '14px 4px 14px 4px', background: AMBER_PRIMARY, color: '#000' }}
      >
        {isGeneratingMusicalPrompt ? <SpinnerIcon className="text-current" /> : <Sparkle24Regular className="w-4 h-4" />}
        {m.generatePrompt}
      </button>

      {(musicalPrompt || isGeneratingMusicalPrompt) && (
        <GBPanel>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkle24Regular className="w-4 h-4" style={{ color: AMBER_PRIMARY }} />
                <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-secondary)]">{m.promptLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[var(--text-secondary)] opacity-60">{m.optimizedFor}</span>
                {musicalPrompt && (
                  <button onClick={handleCopy}
                    className="ux-interactive flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium tracking-wide border border-[var(--border-color)] text-[var(--text-secondary)]"
                    style={{ borderRadius: '8px 2px 8px 2px' }}
                  >
                    {copied ? <Checkmark24Regular className="w-3 h-3" /> : <Copy24Regular className="w-3 h-3" />}
                    {copied ? m.copied : m.copyPrompt}
                  </button>
                )}
              </div>
            </div>
            {isGeneratingMusicalPrompt && !musicalPrompt ? (
              <div className="flex items-center gap-3 py-4">
                <SpinnerIcon style={{ color: AMBER_PRIMARY }} />
                <span className="text-sm text-[var(--text-secondary)]">{m.analyzing}</span>
              </div>
            ) : (
              <textarea value={musicalPrompt} onChange={e => setMusicalPrompt(e.target.value)} rows={6}
                className="w-full bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] lcars-glow-focus transition-colors resize-none leading-relaxed border"
                style={{ borderRadius: '10px 3px 10px 3px', borderColor: `${AMBER_PRIMARY}55` }}
              />
            )}
          </div>
        </GBPanel>
      )}

      {!musicalPrompt && !isGeneratingMusicalPrompt && (
        <GBPanel>
          <div className="p-6 text-center space-y-2">
            <Sparkle24Regular className="w-8 h-8 opacity-30 mx-auto" style={{ color: AMBER_PRIMARY }} />
            <p className="text-sm text-[var(--text-secondary)] opacity-50">{m.promptPlaceholder}</p>
          </div>
        </GBPanel>
      )}
    </div>
  );
}
