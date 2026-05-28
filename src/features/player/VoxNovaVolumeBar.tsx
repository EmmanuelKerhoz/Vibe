import { VolumeControl } from './PlayerWidgets';
import type { VolumeControlProps } from './PlayerWidgets';

export type { VolumeControlProps as VoxNovaVolumeBarProps };

/** Volume slider + mute toggle. Thin wrapper around the shared VolumeControl widget. */
export function VoxNovaVolumeBar(props: VolumeControlProps) {
  return <VolumeControl {...props} />;
}
