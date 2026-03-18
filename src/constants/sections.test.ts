import { describe, expect, it } from 'vitest';
import { getSectionExplanation, getSectionTypeKey, SECTION_TYPE_OPTIONS } from './sections';

describe('section definitions', () => {
  it('includes the newly supported structural section types', () => {
    expect(SECTION_TYPE_OPTIONS).toEqual(expect.arrayContaining([
      'Refrain',
      'Hook',
      'Post-Chorus',
      'Middle 8',
      'Interlude',
      'Build-Up',
      'Drop',
      'Break',
      'Coda',
      'Tag',
      'Vamp',
      'Turnaround',
    ]));
  });

  it('recognizes aliases and provides explanations for tooltips', () => {
    expect(getSectionTypeKey('Pont')).toBe('bridge');
    expect(getSectionTypeKey('Pré-refrain')).toBe('pre-chorus');
    expect(getSectionExplanation('Drop')).toContain('Pic d’énergie');
  });
});
