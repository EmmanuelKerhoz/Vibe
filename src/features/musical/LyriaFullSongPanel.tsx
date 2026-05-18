/**
 * LyriaFullSongPanel.tsx
 * Fluent 2 panel: full-song generation via Lyria 3 Pro.
 * Displayed after user approves the 30s preview from LyriaPreviewPanel.
 *
 * Props:
 *   clip         — the approved LyriaClip from preview (provides style/lyrics context)
 *   lyrics       — verbatim lyrics
 *   songTitle    — title
 *   onDone       — callback with the completed full-song LyriaClip
 */

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  Spinner,
  Text,
  Badge,
  Divider,
  ProgressBar,
  Tooltip,
  tokens,
} from '@fluentui/react-components';
import {
  MusicNote220Regular,
  SparkleRegular,
  CheckmarkCircle20Filled,
  DismissCircle20Regular,
  Info20Regular,
} from '@fluentui/react-icons';
import { generateAndPoll, getLyriaKPISnapshot } from '../../services/lyriaService';
import type { LyriaClip, LyriaTaskStatus } from '../../types/lyria';

interface LyriaFullSongPanelProps {
  clip: LyriaClip;
  lyrics: string;
  songTitle?: string;
  onDone?: (clip: LyriaClip) => void;
}

export const LyriaFullSongPanel: React.FC<LyriaFullSongPanelProps> = ({
  clip,
  lyrics,
  songTitle = '',
  onDone,
}) => {
  const [taskStatus, setTaskStatus] = useState<LyriaTaskStatus>({ phase: 'idle' });
  const [kpi, setKpi] = useState(getLyriaKPISnapshot());

  const isGenerating = taskStatus.phase === 'generating' || taskStatus.phase === 'polling';
  const doneClip = taskStatus.phase === 'done' ? taskStatus.clip : null;

  async function handleGenerate(): Promise<void> {
    setTaskStatus({ phase: 'generating' });
    try {
      setTaskStatus({ phase: 'polling', elapsed: 0 });
      const full = await generateAndPoll(
        {
          lyrics,
          style: clip.prompt, // reuse the prompt that the user approved in preview
          title: songTitle,
          mode: 'full',
        },
        {
          intervalMs: 5_000,
          timeoutMs: 360_000,
        },
      );
      setTaskStatus({ phase: 'done', clip: full });
      setKpi(getLyriaKPISnapshot());
      onDone?.(full);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTaskStatus({ phase: 'error', message });
      setKpi(getLyriaKPISnapshot());
    }
  }

  return (
    <Card
      style={{
        padding: tokens.spacingVerticalL,
        gap: tokens.spacingVerticalM,
        display: 'flex',
        flexDirection: 'column',
        background: tokens.colorNeutralBackground2,
      }}
    >
      <CardHeader
        image={
          <MusicNote220Regular
            style={{ color: tokens.colorBrandForeground1, fontSize: 20 }}
          />
        }
        header={
          <Text weight="semibold" size={400}>
            Lyria 3 Pro — Titre complet
          </Text>
        }
        description={
          <Badge appearance="tint" color="warning" size="small">
            ~3 minutes · async
          </Badge>
        }
        action={
          <Tooltip
            content="Gènere un titre complet (intro, couplets, refrains, pont) basé sur le preview approuvé. Modèle: Lyria 3 Pro via Vertex AI. SynthID watermarké. Durée de génération : 2–5 minutes."
            relationship="label"
          >
            <Info20Regular style={{ color: tokens.colorNeutralForeground3 }} />
          </Tooltip>
        }
      />

      <Divider />

      {/* Preview context */}
      <Card
        style={{
          background: tokens.colorNeutralBackground3,
          padding: tokens.spacingVerticalS,
        }}
      >
        <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
          Basé sur : <strong>{clip.title}</strong>
        </Text>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: 4 }}>
          Prompt : {clip.prompt.slice(0, 200)}{clip.prompt.length > 200 ? '…' : ''}
        </Text>
      </Card>

      {/* Generate button */}
      <Button
        appearance="primary"
        icon={isGenerating ? <Spinner size="tiny" /> : <SparkleRegular />}
        disabled={isGenerating || !!doneClip}
        onClick={() => void handleGenerate()}
        style={{ alignSelf: 'flex-start' }}
      >
        {isGenerating ? 'Génération en cours…' : 'Générer le titre complet'}
      </Button>

      {/* Polling progress */}
      {isGenerating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS }}>
          <ProgressBar thickness="medium" />
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Lyria 3 Pro génère votre titre. Cela peut prendre 2–5 minutes…
          </Text>
        </div>
      )}

      {/* Error state */}
      {taskStatus.phase === 'error' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacingHorizontalS,
            color: tokens.colorStatusDangerForeground1,
          }}
        >
          <DismissCircle20Regular />
          <Text size={200}>{taskStatus.message}</Text>
        </div>
      )}

      {/* Done state */}
      {doneClip && (
        <Card
          style={{
            background: tokens.colorNeutralBackground3,
            padding: tokens.spacingVerticalM,
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacingVerticalS,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <CheckmarkCircle20Filled style={{ color: tokens.colorStatusSuccessForeground1 }} />
            <Text weight="semibold" size={300}>{doneClip.title}</Text>
            <Badge appearance="tint" color="informative" size="small">
              🛡️ SynthID
            </Badge>
          </div>
          {doneClip.audioUrl && (
            <audio
              src={doneClip.audioUrl}
              controls
              style={{ width: '100%', marginTop: tokens.spacingVerticalXS }}
            />
          )}
        </Card>
      )}

      {/* KPI footer */}
      <div style={{ display: 'flex', gap: tokens.spacingHorizontalM }}>
        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
          Latence : {kpi.lastGenerationMs ? `${kpi.lastGenerationMs}ms` : '—'}
        </Text>
        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
          Erreurs : {kpi.errorCount}
        </Text>
      </div>
    </Card>
  );
};

export default LyriaFullSongPanel;
