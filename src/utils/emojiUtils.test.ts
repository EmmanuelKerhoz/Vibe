import { describe, expect, it } from 'vitest';
import { emojiToTwemojiCdnUrl, emojiToTwemojiUrl } from './emojiUtils';

describe('emojiUtils twemoji codepoint mapping', () => {
  it('maps Romance flags to expected local twemoji filenames', () => {
    expect(emojiToTwemojiUrl('🇪🇸')).toBe('/twemoji/1f1ea-1f1f8.svg');
    expect(emojiToTwemojiUrl('🇫🇷')).toBe('/twemoji/1f1eb-1f1f7.svg');
    expect(emojiToTwemojiUrl('🇮🇹')).toBe('/twemoji/1f1ee-1f1f9.svg');
    expect(emojiToTwemojiUrl('🇵🇹')).toBe('/twemoji/1f1f5-1f1f9.svg');
    expect(emojiToTwemojiUrl('🇷🇴')).toBe('/twemoji/1f1f7-1f1f4.svg');
  });

  it('uses the same flag-capable twemoji source for CDN fallback', () => {
    expect(emojiToTwemojiCdnUrl('🇮🇹')).toBe(
      'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.2/assets/svg/1f1ee-1f1f9.svg',
    );
  });

  it('strips U+FE0F from filenames', () => {
    expect(emojiToTwemojiUrl('🛡️')).toBe('/twemoji/1f6e1.svg');
    expect(emojiToTwemojiUrl('☺️')).toBe('/twemoji/263a.svg');
    expect(emojiToTwemojiUrl('⚡️')).toBe('/twemoji/26a1.svg');
  });
});
