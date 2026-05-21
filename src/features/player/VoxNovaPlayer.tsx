import { useState, useCallback } from 'react';
import {
  Tab,
  TabList,
  tokens,
} from '@fluentui/react-components';
import { Cloud24Regular, Laptop24Regular, ArrowUpload24Regular, FolderOpen24Regular } from '@fluentui/react-icons';
import { WarpField } from './WarpField';
import { FrequencyVisualizer } from './FrequencyVisualizer';
import { PlayerControls } from './PlayerControls';
import { TrackList } from './TrackList';
import { ScanPanel } from './ScanPanel';
import { UploadPanel } from './UploadPanel';
import { useLibrary } from './useLibrary';
import { useAudioEngine } from './useAudioEngine';
import { useFrequencyAnalyser } from './useFrequencyAnalyser';
import type { ScanConfig, TrackEntry } from './types';

type LibraryTab = 'cloud' | 'local' | 'scan' | 'upload';

export function VoxNovaPlayer() {
  const library = useLibrary();
  const engine = useAudioEngine();
  const analyser = useFrequencyAnalyser();

  const [selectedTrack, setSelectedTrack] = useState<TrackEntry | undefined>(library.tracks[0]);
  const [activeTab, setActiveTab] = useState<LibraryTab>('cloud');
  const [scanConfig, setScanConfig] = useState<ScanConfig>({ accept: 'wav' });

  const handleSelect = useCallback((track: TrackEntry) => {
    setSelectedTrack(track);
    engine.loadTrack(track);
    engine.beep(880, 'sine', 0.05);
  }, [engine]);

  const handlePrev = useCallback(() => {
    const idx = library.tracks.findIndex(t => t.id === selectedTrack?.id);
    const prev = library.tracks[(idx - 1 + library.tracks.length) % library.tracks.length];
    if (prev) handleSelect(prev);
  }, [library.tracks, selectedTrack, handleSelect]);

  const handleNext = useCallback(() => {
    const idx = library.tracks.findIndex(t => t.id === selectedTrack?.id);
    const next = library.tracks[(idx + 1) % library.tracks.length];
    if (next) handleSelect(next);
  }, [library.tracks, selectedTrack, handleSelect]);

  const handleTracksAdded = useCallback((entries: Omit<TrackEntry, 'id'>[]) => {
    library.addTracks(entries);
    engine.beep(660, 'sine', 0.08);
  }, [library, engine]);

  return (
    <div
      role="region"
      aria-label="VoxNova Player"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: 480,
        background: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusXLarge,
        overflow: 'hidden',
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        boxShadow: tokens.shadow16,
      }}
    >
      {/* Three.js background */}
      <WarpField isPlaying={engine.isPlaying} />

      {/* Content over background */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, gap: 0 }}>

        {/* Frequency visualizer */}
        <div style={{ padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM} 0` }}>
          <FrequencyVisualizer
            isPlaying={engine.isPlaying}
            analyser={analyser}
            audioRef={engine.audioRef}
          />
        </div>

        {/* Player controls */}
        <PlayerControls
          engine={engine}
          onPrev={handlePrev}
          onNext={handleNext}
          trackTitle={selectedTrack?.title}
        />

        {/* Library tabs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}` }}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={(_, d) => setActiveTab(d.value as LibraryTab)}
            size="small"
          >
            <Tab value="cloud" icon={<Cloud24Regular />}>Neural Cloud</Tab>
            <Tab value="local" icon={<Laptop24Regular />}>Local</Tab>
            <Tab value="scan" icon={<FolderOpen24Regular />}>Scan Sector</Tab>
            <Tab value="upload" icon={<ArrowUpload24Regular />}>Uplink</Tab>
          </TabList>

          <div style={{ flex: 1, marginTop: tokens.spacingVerticalS, overflow: 'auto' }}>
            {(activeTab === 'cloud' || activeTab === 'local') && (
              <TrackList
                tracks={library.tracks}
                selectedId={selectedTrack?.id}
                onSelect={handleSelect}
                onRemove={library.removeTrack}
                filter={activeTab}
              />
            )}
            {activeTab === 'scan' && (
              <ScanPanel
                config={scanConfig}
                onConfigChange={setScanConfig}
                onTracksFound={handleTracksAdded}
              />
            )}
            {activeTab === 'upload' && (
              <UploadPanel onTracksAdded={handleTracksAdded} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
