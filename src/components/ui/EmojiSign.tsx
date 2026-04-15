import React from 'react';
import { emojiToTwemojiUrl } from '../../utils/emojiUtils';

/**
 * Renders a single emoji reliably across all platforms by loading it as a
 * Twemoji SVG image. Returns null if the SVG fails to load — avoids the
 * Windows fallback font rendering unknown emoji as 🌐 (globe).
 */
export function EmojiSign({ sign }: { sign: string }) {
  const [error, setError] = React.useState(false);

  if (error) {
    return null;
  }

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
