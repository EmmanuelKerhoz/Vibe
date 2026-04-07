import { describe, it, expect } from 'vitest';
import { splitIntoRhymingLines, extractLineTail } from './lyricSegmenter';

describe('splitIntoRhymingLines', () => {
  it('splits a basic 4-line verse', () => {
    const text = `Je marche dans la nuit
Sous un ciel pur et beau
Le vent qui fait du bruit
Se perd dans les roseaux`;
    expect(splitIntoRhymingLines(text)).toHaveLength(4);
  });

  it('strips section markers', () => {
    const text = `[Chorus]
Fire in my heart
[Verse 2]
Never fall apart`;
    const lines = splitIntoRhymingLines(text);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Fire in my heart');
  });

  it('strips empty lines', () => {
    const text = `Line one\n\n\nLine two\n`;
    expect(splitIntoRhymingLines(text)).toHaveLength(2);
  });

  it('handles Nouchi mixed text', () => {
    const text = `On fait quoi cé soir
Tout le monde doit savoir
Après police on va voir
Abidjan cé notre histoire`;
    expect(splitIntoRhymingLines(text)).toHaveLength(4);
  });
});

describe('extractLineTail', () => {
  it('extracts last word, strips punctuation', () => {
    expect(extractLineTail('Je marche dans la nuit!')).toBe('nuit');
  });

  it('strips trailing comma', () => {
    expect(extractLineTail('Le vent qui fait du bruit,')).toBe('bruit');
  });

  it('handles single word', () => {
    expect(extractLineTail('amour')).toBe('amour');
  });

  it('lowercases output', () => {
    expect(extractLineTail('la Nuit')).toBe('nuit');
  });
});
