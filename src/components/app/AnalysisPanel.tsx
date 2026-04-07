/**
 * AnalysisPanel — Async phonological analysis sidebar (Star Trek FUI × Fluent 2).
 *
 * Three tabs:
 *   Insights  — KPI overview (syllables, words, chars per section)
 *   Analysis  — Rhyme schema detection, assonance/alliteration density
 *   Similarity — Pairwise similarity matrix
 *
 * Architecture invariant (docs_fusion_optimal.md):
 *   All heavy computation runs in a Web Worker. This component is a pure
 *   observer of the worker's output — it NEVER mutates song state or
 *   participates in the UNDO/REDO stack.
 */
import React, { useState } from 'react';
import {
  TabList,
  Tab,
  Badge,
  ProgressBar,
  Spinner,
  Text,
  Tooltip,
  Divider,
} from '@fluentui/react-components';
import {
  DataBarVertical24Regular,
  TextGrammarWand24Regular,
  ArrowSwap24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import type { SelectTabData, SelectTabEventHandler } from '@fluentui/react-components';
import type { AnalysisResult, SectionInsight, SimilarityPair } from '../../lib/workers/linguistics.types';
import type { DetectedSchema } from '../../lib/linguistics/core/types';

// ─── Sub-components ─────────────────────────────────────────────────────────

function InsightsTab({ sections }: { sections: SectionInsight[] }) {
  if (sections.length === 0) {
    return <EmptyState message="No sections to analyse." />;
  }

  const totalLines = sections.reduce((s, sec) => s + sec.lineInsights.length, 0);
  const totalSyllables = sections.reduce((s, sec) => s + sec.totalSyllables, 0);
  const totalWords = sections.reduce((s, sec) => s + sec.totalWords, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Global KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <KpiCard label="Lines" value={totalLines} />
        <KpiCard label="Syllables" value={totalSyllables} />
        <KpiCard label="Words" value={totalWords} />
      </div>
      <Divider />
      {/* Per-section breakdown */}
      {sections.map(sec => (
        <SectionInsightCard key={sec.sectionId} section={sec} />
      ))}
    </div>
  );
}

function AnalysisTab({ sections }: { sections: SectionInsight[] }) {
  if (sections.length === 0) {
    return <EmptyState message="No sections to analyse." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map(sec => (
        <div key={sec.sectionId} className="rounded-lg border border-[var(--border-color)] p-3 bg-[var(--bg-sidebar)]">
          <Text weight="semibold" size={300} className="block mb-2 font-mono text-[var(--lcars-amber)]">
            {sec.sectionName}
          </Text>

          {/* Rhyme Schema */}
          <div className="flex items-center gap-2 mb-2">
            <Text size={200} className="text-[var(--text-muted)] min-w-[80px]">Schema:</Text>
            <SchemaDisplay
              target={sec.targetSchema}
              detected={sec.detectedSchema}
              detectedSchemaObj={sec.detectedSchemaObj}
            />
          </div>

          {/* Assonance / Alliteration density bars */}
          <div className="flex flex-col gap-1 mb-2">
            <DensityBar label="Assonance" value={sec.assonanceDensity} color="var(--lcars-cyan)" />
            <DensityBar label="Alliteration" value={sec.alliterationDensity} color="var(--lcars-violet)" />
          </div>

          {/* Rhyme type distribution — typed filter guards against undefined/null
              values in malformed worker payloads without relying on a cast. */}
          <div className="flex flex-wrap gap-1 mt-1">
            {(Object.entries(sec.rhymeTypes) as [string, unknown][])
              .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
              .map(([type, count]) => (
                <Badge key={type} appearance="filled" color={rhymeTypeColor(type)} size="small">
                  {type}: {count}
                </Badge>
              ))}
          </div>

          {/* Per-line labels */}
          <div className="mt-2 flex flex-col gap-0.5">
            {sec.lineInsights.map(li => (
              <div key={li.lineId} className="flex items-center gap-2 text-xs font-mono">
                <Badge
                  appearance="outline"
                  color={li.rhymeLabel ? 'brand' : 'informative'}
                  size="small"
                  className="min-w-[20px] text-center"
                >
                  {li.rhymeLabel || '—'}
                </Badge>
                <span className="truncate text-[var(--text-secondary)]" title={li.text}>
                  {li.text.slice(0, 60)}{li.text.length > 60 ? '…' : ''}
                </span>
                <span className="ml-auto text-[var(--text-muted)] whitespace-nowrap">
                  {li.syllableCount}σ · {li.wordCount}w
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SimilarityTab({ pairs }: { pairs: SimilarityPair[] }) {
  if (pairs.length === 0) {
    return <EmptyState message="No similarity pairs found." />;
  }

  return (
    <div className="flex flex-col gap-1">
      <Text size={200} className="text-[var(--text-muted)] mb-1">
        Top {Math.min(pairs.length, 30)} pairs by phonological similarity
      </Text>
      {pairs.slice(0, 30).map((pair) => (
        <div
          key={`${pair.lineIdA}-${pair.lineIdB}`}
          className="rounded border border-[var(--border-color)] p-2 bg-[var(--bg-sidebar)]"
        >
          <div className="flex items-center gap-2 mb-1">
            <Badge appearance="filled" color={rhymeTypeColor(pair.rhymeType)} size="small">
              {pair.rhymeType}
            </Badge>
            <span className="text-xs font-mono text-[var(--lcars-amber)]">
              {(pair.score * 100).toFixed(0)}%
            </span>
            <ProgressBar
              value={pair.score}
              max={1}
              thickness="large"
              className="flex-1"
              color={pair.score >= 0.85 ? 'success' : pair.score >= 0.6 ? 'warning' : 'brand'}
            />
          </div>
          <div className="text-xs font-mono space-y-0.5">
            <div className="truncate text-[var(--text-secondary)]" title={pair.textA}>
              <span className="text-[var(--text-muted)] mr-1">A:</span>{pair.textA.slice(0, 50)}
            </div>
            <div className="truncate text-[var(--text-secondary)]" title={pair.textB}>
              <span className="text-[var(--text-muted)] mr-1">B:</span>{pair.textB.slice(0, 50)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared micro-components ────────────────────────────────────────────────

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] p-2 bg-[var(--bg-sidebar)] text-center">
      <Text size={500} weight="bold" className="block font-mono text-[var(--lcars-amber)]">
        {value}
      </Text>
      <Text size={100} className="text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </Text>
    </div>
  );
}

function SectionInsightCard({ section }: { section: SectionInsight }) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] p-3 bg-[var(--bg-sidebar)]">
      <div className="flex items-center justify-between mb-2">
        <Text weight="semibold" size={300} className="font-mono text-[var(--lcars-amber)]">
          {section.sectionName}
        </Text>
        <Text size={100} className="text-[var(--text-muted)]">
          {section.lineInsights.length} lines
        </Text>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center text-xs">
        <div>
          <Text weight="bold" className="block font-mono">{section.totalSyllables}</Text>
          <Text size={100} className="text-[var(--text-muted)]">σ total</Text>
        </div>
        <div>
          <Text weight="bold" className="block font-mono">{section.avgSyllablesPerLine.toFixed(1)}</Text>
          <Text size={100} className="text-[var(--text-muted)]">σ/line</Text>
        </div>
        <div>
          <Text weight="bold" className="block font-mono">{section.avgWordsPerLine.toFixed(1)}</Text>
          <Text size={100} className="text-[var(--text-muted)]">w/line</Text>
        </div>
      </div>
    </div>
  );
}

function SchemaDisplay({
  target,
  detected,
  detectedSchemaObj,
}: {
  target: string;
  detected: string;
  detectedSchemaObj?: DetectedSchema;
}) {
  const match = target && detected && target === detected;
  const confidence = detectedSchemaObj?.confidence ?? null;
  const confidencePct = confidence !== null ? `${Math.round(confidence * 100)}%` : null;

  const detectedTooltip = [
    `Detected: ${detected || '—'}`,
    confidencePct ? `Confidence: ${confidencePct}` : null,
    detectedSchemaObj?.lineCount ? `Lines: ${detectedSchemaObj.lineCount}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex items-center gap-1">
      {target && (
        <Tooltip content="Target schema" relationship="label">
          <Badge appearance="outline" color="informative" size="small">{target}</Badge>
        </Tooltip>
      )}
      {target && detected && <span className="text-[var(--text-muted)]">→</span>}
      <Tooltip content={detectedTooltip} relationship="label">
        <Badge
          appearance="filled"
          color={match ? 'success' : detected ? 'warning' : 'informative'}
          size="small"
        >
          {detected || '—'}
        </Badge>
      </Tooltip>
      {confidencePct && (
        <span className="text-[var(--text-muted)] text-xs font-mono">{confidencePct}</span>
      )}
    </div>
  );
}

function DensityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Text size={200} className="text-[var(--text-muted)] min-w-[80px]">{label}:</Text>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }}
        />
      </div>
      <Text size={200} className="text-[var(--text-muted)] min-w-[32px] text-right font-mono">
        {(value * 100).toFixed(0)}%
      </Text>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <DataBarVertical24Regular className="text-[var(--text-muted)] mb-2" />
      <Text size={200} className="text-[var(--text-muted)]">{message}</Text>
    </div>
  );
}

function rhymeTypeColor(type: string): 'success' | 'warning' | 'danger' | 'informative' | 'brand' {
  switch (type) {
    case 'rich': return 'success';
    case 'sufficient': return 'brand';
    case 'assonance': return 'warning';
    case 'weak': return 'informative';
    default: return 'informative';
  }
}

// ─── Main panel component ───────────────────────────────────────────────────

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  isComputing: boolean;
  error: string | null;
  onClose: () => void;
  isMobileOverlay?: boolean;
}

export const AnalysisPanel = React.memo(function AnalysisPanel({
  result,
  isComputing,
  error,
  onClose,
  isMobileOverlay,
}: AnalysisPanelProps) {
  const [selectedTab, setSelectedTab] = useState<string>('insights');

  const handleTabSelect: SelectTabEventHandler = (_event, data: SelectTabData) => {
    setSelectedTab(data.value as string);
  };

  return (
    <aside
      className={`analysis-panel flex flex-col border-l border-[var(--border-color)] bg-[var(--bg-sidebar)] ${
        isMobileOverlay ? 'structure-sidebar-mobile-overlay' : ''
      }`}
      style={{
        // clamp absorbs narrow-viewport constraints (< 320px, iPhone SE landscape
        // with safe-area) that a fixed 320px value would escape under overflow:hidden.
        width: isMobileOverlay ? '100%' : 'clamp(280px, 25vw, 400px)',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <DataBarVertical24Regular className="text-[var(--lcars-amber)]" />
          <Text weight="semibold" size={300} className="font-mono text-[var(--lcars-amber)] uppercase tracking-wider">
            Analysis
          </Text>
          {isComputing && (
            <Spinner size="tiny" />
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          aria-label="Close analysis panel"
        >
          <Dismiss24Regular className="text-[var(--text-muted)]" />
        </button>
      </div>

      {/* LCARS accent bar */}
      <div
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, var(--lcars-amber) 0%, var(--lcars-cyan) 50%, var(--lcars-violet) 100%)',
          opacity: 0.85,
        }}
      />

      {/* Loading indicator */}
      {isComputing && (
        <ProgressBar thickness="medium" className="w-full" />
      )}

      {/* Tab navigation */}
      <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect} size="small" className="px-2 pt-1">
        <Tab value="insights" icon={<DataBarVertical24Regular />}>
          Insights
        </Tab>
        <Tab value="analysis" icon={<TextGrammarWand24Regular />}>
          Analysis
        </Tab>
        <Tab value="similarity" icon={<ArrowSwap24Regular />}>
          Similarity
        </Tab>
      </TabList>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 mb-3">
            <Text size={200} className="text-red-400">{error}</Text>
          </div>
        )}

        {result && result.computeTimeMs > 0 && (
          <div className="text-right mb-2">
            <Text size={100} className="text-[var(--text-muted)] font-mono">
              ⚡ {result.computeTimeMs.toFixed(0)}ms
            </Text>
          </div>
        )}

        {selectedTab === 'insights' && (
          <InsightsTab sections={result?.sections ?? []} />
        )}
        {selectedTab === 'analysis' && (
          <AnalysisTab sections={result?.sections ?? []} />
        )}
        {selectedTab === 'similarity' && (
          <SimilarityTab pairs={result?.similarityPairs ?? []} />
        )}
      </div>
    </aside>
  );
});
