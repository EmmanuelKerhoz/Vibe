import React from 'react';
import { emojiToTwemojiUrl } from '../../utils/emojiUtils';

interface EmojiSignProps {
  sign: string;
}

const FALLBACK = '🔤';

/**
 * Renders an emoji as a local Twemoji SVG for consistent cross-platform display.
 * Covers both pictograms and flag sequences (regional indicator pairs).
 * Falls back to 🔤 when sign is empty or the Twemoji URL fails to load.
 */
export function EmojiSign({ sign }: EmojiSignProps) {
  const resolved = sign?.trim() || FALLBACK;
  const [src, setSrc] = React.useState(() => emojiToTwemojiUrl(resolved));

  // Reset src when sign changes
  React.useEffect(() => {
    setSrc(emojiToTwemojiUrl(sign?.trim() || FALLBACK));
  }, [sign]);

  const handleError = () => {
    if (resolved !== FALLBACK) {
      setSrc(emojiToTwemojiUrl(FALLBACK));
    }
  };

  return (
    <img
      src={src}
      alt={resolved}
      aria-hidden="true"
      onError={handleError}
      style={{
        width: '1em',
        height: '1em',
        display: 'inline-block',
        verticalAlign: '-0.1em',
        flexShrink: 0,
      }}
    />
  );
}
