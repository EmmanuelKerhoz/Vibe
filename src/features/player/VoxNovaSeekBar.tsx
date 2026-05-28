import { SeekBar } from './PlayerWidgets';
import type { SeekBarProps } from './PlayerWidgets';

export type { SeekBarProps as VoxNovaSeekBarProps };

/** Seek slider + time display. Thin wrapper around the shared SeekBar widget. */
export function VoxNovaSeekBar(props: SeekBarProps) {
  return <SeekBar {...props} />;
}
