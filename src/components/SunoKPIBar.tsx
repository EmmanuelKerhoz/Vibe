/**
 * SunoKPIBar — Fluent 2 status bar showing live Suno service metrics.
 * Mounts as a compact horizontal band; import wherever relevant (e.g. Settings panel or footer).
 *
 * KPIs displayed:
 *   • Mode badge (DEV/PROD)
 *   • Pending in-flight
 *   • Success / Error counts
 *   • Last round-trip latency
 *   • Last error tooltip
 */

import {
  Badge,
  Text,
  Tooltip,
  tokens,
} from '@fluentui/react-components';
import { CheckmarkCircle20Regular, ErrorCircle20Regular, ArrowClockwise20Regular } from '@fluentui/react-icons';
import { useSuno } from '../hooks/useSuno';

export function SunoKPIBar() {
  const { kpi, status } = useSuno();

  const isPolling = status.phase === 'polling';
  const elapsedSec =
    isPolling && 'elapsed' in status
      ? (status.elapsed / 1000).toFixed(1)
      : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
        background: tokens.colorNeutralBackground3,
        borderRadius: tokens.borderRadiusMedium,
        flexWrap: 'wrap',
      }}
    >
      {/* Mode */}
      <Badge
        appearance="filled"
        color={kpi.mode === 'prod' ? 'success' : 'warning'}
        size="small"
      >
        {kpi.mode.toUpperCase()}
      </Badge>

      {/* Pending */}
      {kpi.pendingCount > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowClockwise20Regular
            style={{ color: tokens.colorPaletteYellowForeground1, animation: 'spin 1s linear infinite' }}
          />
          <Text size={200}>{kpi.pendingCount} pending</Text>
        </span>
      )}

      {/* Polling elapsed */}
      {elapsedSec && (
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          ⏱ {elapsedSec}s
        </Text>
      )}

      {/* Success */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <CheckmarkCircle20Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
        <Text size={200}>{kpi.successCount}</Text>
      </span>

      {/* Errors */}
      <Tooltip
        content={kpi.lastError ?? 'No errors'}
        relationship="description"
        positioning="above"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'default' }}>
          <ErrorCircle20Regular
            style={{
              color:
                kpi.errorCount > 0
                  ? tokens.colorPaletteRedForeground1
                  : tokens.colorNeutralForeground3,
            }}
          />
          <Text size={200}>{kpi.errorCount}</Text>
        </span>
      </Tooltip>

      {/* Latency */}
      {kpi.lastGenerationMs !== null && (
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          {kpi.lastGenerationMs}ms
        </Text>
      )}
    </div>
  );
}
