import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emojiToTwemojiCdnUrl, emojiToTwemojiUrl } from '../../utils/emojiUtils';
import { EmojiSign } from './EmojiSign';

describe('EmojiSign', () => {
  it('uses the latest sign when an image error fires after a fast sign change', () => {
    const { container, rerender } = render(<EmojiSign sign="🇫🇷" />);
    const img = container.querySelector('img')!;

    expect(img).toHaveAttribute('src', emojiToTwemojiUrl('🇫🇷'));

    rerender(<EmojiSign sign="🇺🇸" />);
    fireEvent.error(img);

    expect(img).toHaveAttribute('alt', '🇺🇸');
    expect(img).toHaveAttribute('src', emojiToTwemojiCdnUrl('🇺🇸'));
  });
});
