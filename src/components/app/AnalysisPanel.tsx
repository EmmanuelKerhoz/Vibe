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
  SearchRegular,
} from '@fluentui/react-icons';
import { X } from '../ui/icons';
import { AnimatePresence, motion } from 'motion/react';
import type { SelectTabData, SelectTabEventHandler } from '@fluentui/react-components';
import type { AnalysisResult, SectionInsight, SimilarityPair } from '../../lib/workers/linguistics.types';
import type { DetectedSchema } from '../../lib/linguistics/core/types';

// Panel width — ~25% larger than original 280
const PANEL_WIDTH = 350;

// ─── Skeleton shimmer ────────────────────────────────────────────────
function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded animate-pulse bg-black/[0.06] dark:bg-white/[0.06] ${className}`}
      aria-hidden="true"
    />
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border-color)] p-2 bg-[var(--bg-sidebar)] text-center space-y-1.5">
      <SkeletonBar className="h-6 w-10 mx-auto" />
      <SkeletonBar className="h-3 w-14 mx-auto" />
    </div>
  );
}

function SectionCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border-color)] p-3 bg-[var(--bg-sidebar)] space-y-2">
      <div className="flex items-center justify-between">
        <SkeletonBar className="h-3.5 w-28" />
        <SkeletonBar className="h-3 w-12" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        <SkeletonBar className="h-8 rounded" />
        <SkeletonBar className="h-8 rounded" />
        <SkeletonBar className="h-8 rounded" />
      </div>
    </div>
  );
}

function InsightsTabSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Computing analysis">
      <div className="grid grid-cols-3 gap-2">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      <Divider />
      <SectionCardSkeleton />
      <SectionCardSkeleton />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function InsightsTab({ sections }: { sections: SectionInsight[] }) {
  if (sections.length === 0) {
    return <EmptyState message="No sections to analyse." />;
  }

  const totalLines = sections.reduce((s, sec) => s + sec.lineInsights.length, 0);
  const totalSyllables = sections.reduce((s, sec) => s + sec.totalSyllables, 0);
  const totalWords = sections.reduce((s, sec) => s + sec.totalWords, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <KpiCard label="Lines" value={totalLines} />
        <KpiCard label="Syllables" value={totalSyllables} />
        <KpiCard label="Words" value={totalWords} />
      </div>
      <Divider />
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
          {/* text-xs = 12px minimum — font-size floor */}
          <Text weight="semibold" size={300} className="block mb-2 font-mono text-[var(--lcars-amber)]">
            {sec.sectionName}
          </Text>
          <div className="flex items-center gap-2 mb-2">
            <Text size={200} className="text-[var(--text-muted)] min-w-[80px]">Schema:</Text>
            <SchemaDisplay
              target={sec.targetSchema}
              detected={sec.detectedSchema}
              detectedSchemaObj={sec.detectedSchemaObj}
            />
          </div>
          <div className="flex flex-col gap-1 mb-2">
            <DensityBar label="Assonance" value={sec.assonanceDensity} color="var(--lcars-cyan)" />
            <DensityBar label="Alliteration" value={sec.alliterationDensity} color="var(--lcars-violet)" />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {(Object.entries(sec.rhymeTypes) as [string, unknown][])
              .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0)
              .map(([type, count]) => (
                <Badge key={type} appearance="filled" color={rhymeTypeColor(type)} size="small">
                  {type}: {count}
                </Badge>
              ))}
          </div>
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
      {/* size={200} = Fluent SM ≈ 12px — minimum floor */}
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

// ─── Shared micro-components ────────────────────────────────────────────

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] p-2 bg-[var(--bg-sidebar)] text-center">
      <Text size={500} weight="bold" className="block font-mono text-[var(--lcars-amber)]">
        {value}
      </Text>
      {/* size={200} = Fluent SM ≈ 12px — was size={100} ≈ 10px (below floor) */}
      <Text size={200} className="text-[var(--text-muted)] uppercase tracking-wider">
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
        {/* size={200} — was size={100} */}
        <Text size={200} className="text-[var(--text-muted)]">
          {section.lineInsights.length} lines
        </Text>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center text-xs">
        <div>
          <Text weight="bold" className="block font-mono">{section.totalSyllables}</Text>
          {/* size={200} — was size={100} */}
          <Text size={200} className="text-[var(--text-muted)]">σ total</Text>
        </div>
        <div>
          <Text weight="bold" className="block font-mono">{section.avgSyllablesPerLine.toFixed(1)}</Text>
          <Text size={200} className="text-[var(--text-muted)]">σ/line</Text>
        </div>
        <div>
          <Text weight="bold" className="block font-mono">{section.avgWordsPerLine.toFixed(1)}</Text>
          <Text size={200} className="text-[var(--text-muted)]">w/line</Text>
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
      {/* text-xs = 12px minimum */}
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
      {/* SearchRegular disambiguates from the DataBarVertical24Regular panel header icon */}
      <SearchRegular className="text-[var(--text-muted)] mb-2 w-6 h-6" />
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

// ─── Main panel component ──────────────────────────────────────────────

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

  // Show skeleton when computing with no prior result
  const showSkeleton = isComputing && result === null;

  return (
    <AnimatePresence>
      <motion.div
        key="analysis-panel"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isMobileOverlay ? '100%' : PANEL_WIDTH, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`flex flex-col z-50 shadow-2xl lcars-panel${
          isMobileOverlay ? ' structure-sidebar-mobile-overlay' : ''
        }`}
        style={{ overflow: 'hidden', position: 'relative' }}
      >
        <div
          className="flex flex-col h-full overflow-hidden"
          style={{ width: isMobileOverlay ? '100%' : PANEL_WIDTH, minWidth: isMobileOverlay ? undefined : PANEL_WIDTH }}
        >
          {/* Header — LCARS standard h-16 */}
          <div
            className="h-16 px-5 flex items-center justify-between shrink-0"
            style={{ position: 'relative', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}
          >
            {/* Accent rail */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 'var(--accent-rail-thickness, 2px)',
              background: 'var(--accent-rail-gradient-h-rev)',
              opacity: 0.85, pointerEvents: 'none', zIndex: 1,
            }} />
            <div className="flex items-center gap-3">
              <DataBarVertical24Regular className="text-[var(--lcars-amber)] w-4 h-4" />
              {/* text-xs = 12px — was text-[10px] (below floor) */}
              <span className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
                Phonologic Analysis
              </span>
              {isComputing && <Spinner size="tiny" />}
            </div>
            <button
              onClick={onClose}
              aria-label="Close phonologic analysis panel"
              className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Computing progress bar */}
          {isComputing && (
            <ProgressBar thickness="medium" className="w-full shrink-0" />
          )}

          {/* Tab navigation */}
          <TabList
            selectedValue={selectedTab}
            onTabSelect={handleTabSelect}
            size="small"
            className="px-3 pt-1 shrink-0"
          >
            <Tab value="insights" icon={<DataBarVertical24Regular />}>Insights</Tab>
            <Tab value="analysis" icon={<TextGrammarWand24Regular />}>Analysis</Tab>
            <Tab value="similarity" icon={<ArrowSwap24Regular />}>Similarity</Tab>
          </TabList>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 mb-3">
                <Text size={200} className="text-red-400">{error}</Text>
              </div>
            )}
            {result && result.computeTimeMs > 0 && (
              <div className="text-right mb-2">
                {/* text-xs = 12px — was size={100} ≈ 10px */}
                <Text size={200} className="text-[var(--text-muted)] font-mono">
                  ⚡ {result.computeTimeMs.toFixed(0)}ms
                </Text>
              </div>
            )}
            {/* Skeleton state: computing + no prior result */}
            {showSkeleton && selectedTab === 'insights' && <InsightsTabSkeleton />}
            {!showSkeleton && selectedTab === 'insights' && <InsightsTab sections={result?.sections ?? []} />}
            {selectedTab === 'analysis' && <AnalysisTab sections={result?.sections ?? []} />}
            {selectedTab === 'similarity' && <SimilarityTab pairs={result?.similarityPairs ?? []} />}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
