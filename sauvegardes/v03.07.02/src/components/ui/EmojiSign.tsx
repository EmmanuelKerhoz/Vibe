import React from 'react';
import { emojiToTwemojiUrl } from '../../utils/emojiUtils';

/**
 * Renders a single emoji reliably across all platforms by loading it as a
 * Twemoji SVG image. Falls back to a plain text <span> with an emoji font
 * stack if the CDN image fails to load (e.g. offline or unknown codepoint).
 *
 * Use this component anywhere a flag or complex emoji must render consistently
 * — especially on Windows where regional-indicator pairs (🇬🇧, 🇫🇷 …) are
 * displayed as two-letter country codes by the system emoji font.
 */
export function EmojiSign({ sign }: { sign: string }) {
  const [useFallback, setUseFallback] = React.useState(false);

  if (useFallback) {
    return (
      <span
        aria-hidden="true"
        style={{
          fontFamily:
            '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
          lineHeight: 1,
          display: 'inline-block',
          fontSize: '1em',
        }}
      >
        {sign}
      </span>
    );
  }

  return (
    <img
      src={emojiToTwemojiUrl(sign)}
      alt={sign}
      aria-hidden="true"
      onError={() => setUseFallback(true)}
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
