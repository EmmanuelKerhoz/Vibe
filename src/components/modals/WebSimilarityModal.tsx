import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Badge,
  Spinner,
  Text,
  Divider,
  Tooltip,
} from '@fluentui/react-components';
import { Globe, ExternalLink, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import type { WebSimilarityIndex } from '../../types/webSimilarity';

interface WebSimilarityModalProps {
  isOpen: boolean;
  onClose: () => void;
  index: WebSimilarityIndex;
  onRefresh: () => void;
}

const SOURCE_LABEL: Record<string, string> = {
  ddg: 'DuckDuckGo',
  wikipedia: 'Wikipedia',
};

const scoreColor = (score: number): 'danger' | 'warning' | 'success' | 'informative' => {
  if (score >= 60) return 'danger';
  if (score >= 30) return 'warning';
  if (score >= 10) return 'success';
  return 'informative';
};

const scoreLabel = (score: number): string => {
  if (score >= 60) return 'High similarity';
  if (score >= 30) return 'Moderate';
  if (score >= 10) return 'Low';
  return 'Minimal';
};

export const WebSimilarityModal: React.FC<WebSimilarityModalProps> = ({
  isOpen,
  onClose,
  index,
  onRefresh,
}) => {
  const { candidates, status, lastUpdated, error } = index;

  const formattedTime = lastUpdated
    ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(lastUpdated))
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => { if (!data.open) onClose(); }}>
      <DialogSurface
        style={{
          maxWidth: 600,
          width: '95vw',
          background: 'var(--colorNeutralBackground1)',
          border: '1px solid var(--colorNeutralStroke1)',
        }}
      >
        <DialogTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} style={{ color: 'var(--colorBrandForeground1)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Web Similarity Check
            </span>
            {status === 'running' && (
              <Spinner size="extra-tiny" label="" style={{ marginLeft: 4 }} />
            )}
            {status === 'done' && formattedTime && (
              <Tooltip content={`Last updated at ${formattedTime}`} relationship="label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--colorNeutralForeground3)', marginLeft: 8, cursor: 'default' }}>
                  <Clock size={10} />
                  {formattedTime}
                </span>
              </Tooltip>
            )}
          </div>
        </DialogTitle>

        <DialogBody style={{ paddingTop: 12, paddingBottom: 4 }}>
          {status === 'idle' && (
            <Text style={{ fontSize: 13, color: 'var(--colorNeutralForeground3)' }}>
              No search run yet. The engine triggers automatically after 30 s of inactivity (≥ 20 % text change), or click Refresh.
            </Text>
          )}

          {status === 'running' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
              <Spinner size="small" />
              <Text style={{ fontSize: 13, color: 'var(--colorNeutralForeground2)' }}>
                Searching DuckDuckGo + Wikipedia…
              </Text>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--colorStatusDangerForeground1)' }}>
              <AlertCircle size={14} />
              <Text style={{ fontSize: 13 }}>{error ?? 'Unknown error'}</Text>
            </div>
          )}

          {status === 'done' && candidates.length === 0 && (
            <Text style={{ fontSize: 13, color: 'var(--colorStatusSuccessForeground1)' }}>
              ✓ No significant external matches found. Your lyrics appear original.
            </Text>
          )}

          {status === 'done' && candidates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Text style={{ fontSize: 11, color: 'var(--colorNeutralForeground3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Top {candidates.length} candidate{candidates.length > 1 ? 's' : ''} — Jaccard n-gram scoring
              </Text>
              {candidates.map((c, i) => (
                <div
                  key={`${c.url}-${i}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--colorNeutralStroke2)',
                    background: 'var(--colorNeutralBackground2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <Badge
                        appearance="filled"
                        color={scoreColor(c.score)}
                        style={{ minWidth: 40, justifyContent: 'center', fontWeight: 700, fontSize: 11 }}
                      >
                        {c.score}%
                      </Badge>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--colorNeutralForeground1)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 300,
                        }}
                        title={c.title}
                      >
                        {c.title}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <Badge appearance="outline" color="informative" style={{ fontSize: 10 }}>
                        {SOURCE_LABEL[c.source] ?? c.source}
                      </Badge>
                      {c.url && (
                        <Tooltip content="Open source" relationship="label">
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            style={{ display: 'flex', alignItems: 'center', color: 'var(--colorBrandForeground1)' }}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <Text
                    style={{
                      fontSize: 12,
                      color: 'var(--colorNeutralForeground3)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.snippet}
                  </Text>

                  <Text style={{ fontSize: 10, color: 'var(--colorNeutralForeground4)', fontStyle: 'italic' }}>
                    {scoreLabel(c.score)} · {c.matchedSegments.length} matching segment{c.matchedSegments.length !== 1 ? 's' : ''}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <Divider style={{ marginTop: 16 }} />

        <DialogActions style={{ paddingTop: 10, paddingBottom: 14, justifyContent: 'space-between' }}>
          <Button
            icon={<RefreshCw size={13} />}
            appearance="subtle"
            size="small"
            disabled={status === 'running'}
            onClick={onRefresh}
            style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Refresh Now
          </Button>
          <Button appearance="secondary" size="small" onClick={onClose}
            style={{ fontSize: 11 }}
          >
            Close
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
