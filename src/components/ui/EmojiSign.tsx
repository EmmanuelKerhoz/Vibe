import React from 'react';
import { emojiToTwemojiUrl } from '../../utils/emojiUtils';

interface EmojiSignProps {
  sign: string;
}

/**
 * Renders an emoji as a local Twemoji SVG for consistent cross-platform display.
 * Covers both pictograms and flag sequences (regional indicator pairs).
 * Returns null on load failure to prevent Windows globe substitution.
 */
export function EmojiSign({ sign }: EmojiSignProps) {
  const [error, setError] = React.useState(false);

  if (error) return null;

  return (
    <img
      src={emojiToTwemojiUrl(sign)}
      alt={sign}
      aria-hidden="true"
      onError={() => setError(true)}
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
