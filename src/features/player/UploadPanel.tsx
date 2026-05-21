import { useRef, useCallback } from 'react';
import {
  Button,
  tokens,
  Text,
} from '@fluentui/react-components';
import { ArrowUpload24Regular } from '@fluentui/react-icons';
import type { TrackEntry } from './types';

interface UploadPanelProps {
  onTracksAdded: (tracks: Omit<TrackEntry, 'id'>[]) => void;
}

export function UploadPanel({ onTracksAdded }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('audio/'));
    const tracks: Omit<TrackEntry, 'id'>[] = files.map(f => ({
      title: f.name.replace(/\.[^/.]+$/, ''),
      source: 'local',
      url: URL.createObjectURL(f),
      memo: '',
      linked: true,
    }));
    onTracksAdded(tracks);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onTracksAdded]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, padding: tokens.spacingVerticalM }}>
      <Text weight="semibold" style={{ color: tokens.colorNeutralForeground1 }}>Uplink</Text>

      <Button
        appearance="secondary"
        icon={<ArrowUpload24Regular />}
        onClick={() => fileInputRef.current?.click()}
      >
        Upload audio files
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".wav,.mp3,.ogg,.flac,.aac,audio/*"
        style={{ display: 'none' }}
        onChange={handleFiles}
        aria-hidden="true"
      />
    </div>
  );
}
