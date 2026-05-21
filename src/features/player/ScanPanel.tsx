import { useRef, useCallback } from 'react';
import {
  Button,
  RadioGroup,
  Radio,
  Label,
  tokens,
  Text,
} from '@fluentui/react-components';
import { FolderOpen24Regular } from '@fluentui/react-icons';
import type { ScanConfig, TrackEntry } from './types';

interface ScanPanelProps {
  config: ScanConfig;
  onConfigChange: (c: ScanConfig) => void;
  onTracksFound: (tracks: Omit<TrackEntry, 'id'>[]) => void;
}

const ACCEPT_MAP: Record<ScanConfig['accept'], string> = {
  wav: '.wav,audio/wav',
  mp3: '.mp3,audio/mpeg',
  all: '.wav,.mp3,.ogg,.flac,.aac,audio/*',
};

export function ScanPanel({ config, onConfigChange, onTracksFound }: ScanPanelProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderScan = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const accept = config.accept;

    const filtered = files.filter(f => {
      if (accept === 'all') return f.type.startsWith('audio/');
      if (accept === 'wav') return f.name.toLowerCase().endsWith('.wav') || f.type === 'audio/wav';
      if (accept === 'mp3') return f.name.toLowerCase().endsWith('.mp3') || f.type === 'audio/mpeg';
      return false;
    });

    const tracks: Omit<TrackEntry, 'id'>[] = filtered.map(f => ({
      title: f.name.replace(/\.[^/.]+$/, ''),
      source: 'local',
      url: URL.createObjectURL(f),
      memo: '',
      linked: true,
    }));

    onTracksFound(tracks);
    // Reset so same folder can be re-scanned
    if (folderInputRef.current) folderInputRef.current.value = '';
  }, [config.accept, onTracksFound]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, padding: tokens.spacingVerticalM }}>
      <Text weight="semibold" style={{ color: tokens.colorNeutralForeground1 }}>Scan Sector</Text>

      <div>
        <Label style={{ color: tokens.colorNeutralForeground2, marginBottom: tokens.spacingVerticalXS }}>File type filter</Label>
        <RadioGroup
          value={config.accept}
          onChange={(_, d) => onConfigChange({ ...config, accept: d.value as ScanConfig['accept'] })}
          layout="horizontal"
        >
          <Radio value="wav" label="WAV" />
          <Radio value="mp3" label="MP3" />
          <Radio value="all" label="All audio" />
        </RadioGroup>
      </div>

      <Button
        appearance="secondary"
        icon={<FolderOpen24Regular />}
        onClick={() => folderInputRef.current?.click()}
      >
        Select folder
      </Button>

      {/* Hidden folder picker */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error — webkitdirectory is non-standard but widely supported
        webkitdirectory=""
        multiple
        accept={ACCEPT_MAP[config.accept]}
        style={{ display: 'none' }}
        onChange={handleFolderScan}
        aria-hidden="true"
      />
    </div>
  );
}
