import React from 'react';
import {
  Search, X, Activity, Globe, ExternalLink, RefreshCw,
  AlertCircle, Clock, Loader2, Trash2,
} from '../../ui/icons';
import { Button } from '../../ui/Button';
import { useTranslation } from '../../../i18n';
import type { SimilarityMatch } from '../../../utils/similarityUtils';
import type { WebSimilarityIndex } from '../../../types/webSimilarity';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  matches: SimilarityMatch[];
  candidateCount: number;
  webIndex: WebSimilarityIndex;
  onWebRefresh: () => void;
  onDeleteLibraryAsset?: (versionId: string) => void;
};

const SOURCE_LABEL: Record<string, string> = {
  ddg: 'DuckDuckGo',
  wikipedia: 'Wikipedia',
};

const scoreBadgeClass = (score: number): string => {
  if (score >= 60) return 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400';
  if (score >= 30) return 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
  if (score >= 10) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
  return 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]';
};

const scoreLabel = (score: number): string => {
  if (score >= 60) return 'High';
  if (score >= 30) return 'Moderate';
  if (score >= 10) return 'Low';
  return 'Minimal';
};

export function SimilarityModal({
  isOpen, onClose, matches, candidateCount,
  webIndex, onWebRefresh, onDeleteLibraryAsset,
}: Props) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const { candidates, status, lastUpdated, error } = webIndex;

  const formattedTime = lastUpdated
    ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(lastUpdated))
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-300" onClick={onClose} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden items-center justify-center hidden dark:flex">
        <div className="w-[700px] h-[500px] bg-[var(--accent-color)]/10 blur-[120px] rounded-full" />
      </div>

      {/* Gradient border wrapper */}
      <div
        className="lcars-gradient-outline relative w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[24px_8px_24px_8px] animate-in zoom-in-95 duration-300"
        style={{
          padding: '2px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          isolation: 'isolate',
        }}
      >
      <div className="relative w-full h-full flex flex-col dialog-surface rounded-none sm:rounded-[22px_6px_22px_6px] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-widest text-[var(--text-primary)] uppercase">{t.similarity.title}</h3>
              <p className="text-xs text-[var(--accent-color)] uppercase tracking-wider mt-0.5">{t.similarity.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* WEB SIMILARITY */}
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--accent-color)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{t.similarity.webTitle}</span>
                {status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-color)]" />}
                {status === 'done' && formattedTime && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                    <Clock className="w-3 h-3" />{formattedTime}
                  </span>
                )}
              </div>
              <button
                onClick={onWebRefresh}
                disabled={status === 'running'}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-3 h-3" />{t.similarity.webRefresh}
              </button>
            </div>

            {status === 'idle' && (
              <div className="px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)]">{t.similarity.webIdle}</div>
            )}
            {status === 'running' && (
              <div className="px-4 py-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-color)]" />
                <span className="text-sm text-[var(--text-secondary)]">{t.similarity.webRunning}</span>
              </div>
            )}
            {status === 'error' && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error ?? 'Unknown error'}
              </div>
            )}
            {status === 'done' && candidates.length === 0 && (
              <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400">{t.similarity.webNoMatches}</div>
            )}
            {status === 'done' && candidates.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                  {candidates.length} result{candidates.length > 1 ? 's' : ''} · {t.similarity.nGramScoring}
                </p>
                {candidates.map((c, i) => (
                  <div
                    key={`${c.url}-${i}`}
                    className="p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] space-y-2 hover:border-[var(--accent-color)]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${scoreBadgeClass(c.score)}`}>
                          {c.score}%
                        </span>
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[280px]" title={c.title}>
                          {c.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)]">
                          {SOURCE_LABEL[c.source] ?? c.source}
                        </span>
                        {c.url && (
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] hover:opacity-70 transition-opacity" title="Open source">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{c.snippet}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] italic">
                      {scoreLabel(c.score)} similarity · {c.matchedSegments.length} matched segment{c.matchedSegments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="px-6 py-2">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border-color)]" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-app)] border border-[var(--border-color)]">
                <Search className="w-3 h-3 text-[var(--text-secondary)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{t.similarity.libraryTitle}</span>
              </div>
              <div className="h-px flex-1 bg-[var(--border-color)]" />
            </div>
          </div>

          {/* LIBRARY SIMILARITY */}
          <div className="p-6 space-y-4">
            <div className="px-4 py-3 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 text-sm text-[var(--text-primary)] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] animate-pulse flex-shrink-0" />
              {t.similarity.thresholdHint}
            </div>

            {candidateCount === 0 || matches.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-[var(--border-color)] rounded-[16px_4px_16px_4px] bg-[var(--bg-app)]">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center">
                  <Search className="w-5 h-5 text-[var(--accent-color)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)] uppercase tracking-widest">
                  {candidateCount === 0 ? t.similarity.noCandidates : t.similarity.empty}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match, i) => (
                  <article
                    key={match.versionId}
                    className="rounded-[16px_4px_16px_4px] bg-[var(--bg-app)] border border-[var(--border-color)] p-5 hover:border-[var(--accent-color)]/30 hover:shadow-sm transition-all"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
                          {match.title || match.versionName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-[var(--text-secondary)] font-mono">{match.versionName}</span>
                          <span className="text-[var(--text-secondary)]">{new Date(match.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">{t.similarity.score}</div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-color)]">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${match.score}%` }} />
                            </div>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{match.score}%</span>
                          </div>
                        </div>
                        {onDeleteLibraryAsset && (
                          <button
                            type="button"
                            onClick={() => onDeleteLibraryAsset(match.versionId)}
                            title={t.tooltips?.removeFromLibrary ?? 'Remove from library'}
                            className="mt-1 p-1.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-3">
                        <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">{t.similarity.sharedWords}</div>
                        <div className="text-xl font-light text-[var(--text-primary)] font-mono">{match.sharedWords}</div>
                      </div>
                      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-3">
                        <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">{t.similarity.sharedLines}</div>
                        <div className="text-xl font-light text-[var(--text-primary)] font-mono">{match.sharedLines}</div>
                      </div>
                      <div className="rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">{t.similarity.matchedSections}</div>
                        <div className="text-xl font-light text-[var(--text-primary)] font-mono">{match.matchedSections.length}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {match.sharedKeywords.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">{t.similarity.sharedKeywords}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {match.sharedKeywords.map(keyword => (
                              <span key={keyword} className="px-2.5 py-1 text-xs bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-[var(--text-primary)] hover:border-[var(--accent-color)]/30 transition-colors">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {match.matchedSections.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">{t.similarity.matchedSections}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchedSections.map(section => (
                              <span
                                key={`${match.versionId}-${section.name}`}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 rounded text-[var(--text-primary)]"
                              >
                                <span className="font-bold uppercase tracking-wider">{section.name}</span>
                                <span className="w-1 h-1 rounded-full bg-[var(--accent-color)]" />
                                <span className="font-mono text-[var(--accent-color)] font-bold">{section.score}%</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex justify-end flex-shrink-0">
          <Button onClick={onClose} variant="contained" color="primary">{t.saveToLibrary.close}</Button>
        </div>
      </div>
      </div>
    </div>
  );
}
