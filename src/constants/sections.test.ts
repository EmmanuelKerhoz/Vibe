import { describe, expect, it } from 'vitest';
import {
  getSectionExplanation,
  getSectionTooltipText,
  getSectionTypeKey,
  isLinkedPreChorusPair,
  SECTION_TYPE_OPTIONS,
} from './sections';

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

  it('formats supported section tooltips without repeating the section title', () => {
    expect(getSectionTooltipText('Intro').split('\n')).toEqual([
      'Ouvre le morceau et pose l’atmosphère.',
      'Repère : presque toujours au début, souvent courte.',
    ]);
  });

  it('treats final chorus as a valid linked target for a pre-chorus', () => {
    expect(isLinkedPreChorusPair('Pre-Chorus 3', 'Final Chorus')).toBe(true);
    expect(isLinkedPreChorusPair('Pre-Chorus 1', 'Chorus 1')).toBe(true);
    expect(isLinkedPreChorusPair('Pre-Chorus 1', 'Bridge')).toBe(false);
  });
});
