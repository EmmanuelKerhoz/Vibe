import { describe, expect, it } from 'vitest';
import { formatConsolidatedDuration } from './StatusBar';

describe('formatConsolidatedDuration', () => {
  it('formats empty and sub-hour player library durations', () => {
    expect(formatConsolidatedDuration(0)).toBe('0:00');
    expect(formatConsolidatedDuration(185)).toBe('3:05');
  });

  it('formats hour-long player library durations', () => {
    expect(formatConsolidatedDuration(3661)).toBe('1:01:01');
  });
});
