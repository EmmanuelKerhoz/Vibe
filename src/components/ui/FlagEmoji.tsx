import React from 'react';
import { emojiToTwemojiUrl, isPlainAscii } from '../../utils/emojiUtils';

interface FlagEmojiProps {
  flag: string;
  code: string;
  /** Override size in rem (default 1.125rem ≈ 18 px) */
  size?: string;
}

/**
 * Renders a flag emoji using locally-bundled Twemoji SVGs with a native-emoji
 * fallback when the SVG is missing or the input is plain ASCII text.
 */
export function FlagEmoji({ flag, code, size = '1.125rem' }: FlagEmojiProps) {
  const [useFallback, setUseFallback] = React.useState(false);
  const display = flag || code.toUpperCase();

  if (useFallback || isPlainAscii(display)) {
    return (
      <span
        aria-hidden="true"
        style={{
          fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
          fontSize: size,
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        {display}
      </span>
    );
  }

  return (
    <img
      src={emojiToTwemojiUrl(display)}
      alt={display}
      aria-hidden="true"
      onError={() => setUseFallback(true)}
      style={{ width: size, height: size, display: 'inline-block', verticalAlign: '-0.1em' }}
    />
  );
}
