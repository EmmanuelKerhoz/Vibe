import { describe, expect, it } from 'vitest';
import { DEFAULT_MOOD, DEFAULT_TOPIC } from './songDefaults';
import { buildPartialResetPayload } from './sessionReset';

describe('buildPartialResetPayload', () => {
  it('clears the editorial metadata in addition to the lyrics', () => {
    const payload = buildPartialResetPayload('ABAB');

    expect(payload.title).toBe('');
    expect(payload.titleOrigin).toBe('user');
    expect(payload.topic).toBe(DEFAULT_TOPIC);
    expect(payload.mood).toBe(DEFAULT_MOOD);
    expect(payload.song.every(section => section.lines.every(line => line.text === ''))).toBe(true);
  });
});
