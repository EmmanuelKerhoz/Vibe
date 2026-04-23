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
 *
 * Guard: if `flag` is empty or plain ASCII (e.g. the prop was not populated),
 * we skip Twemoji entirely and let the OS render the regional indicator pair
 * from `code` — preventing an isPlainAscii short-circuit that would show
 * raw "FR"/"EN" text instead of the flag emoji.
 */
export function FlagEmoji({ flag, code, size = '1.125rem' }: FlagEmojiProps) {
  const [useFallback, setUseFallback] = React.useState(false);

  // Determine whether we have a real emoji to work with.
  // `flag` may arrive empty-string when the language entry has no flag field.
  const hasEmoji = flag && !isPlainAscii(flag);

  // Native-emoji fallback span (system font stack for colour emoji).
  const nativeFallback = (
    <span
      aria-hidden="true"
      style={{
        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif',
        fontSize: size,
        lineHeight: 1,
        display: 'inline-block',
      }}
    >
      {flag || code.toUpperCase()}
    </span>
  );

  if (!hasEmoji || useFallback) {
    return nativeFallback;
  }

  return (
    <img
      src={emojiToTwemojiUrl(flag)}
      alt={flag}
      aria-hidden="true"
      onError={() => setUseFallback(true)}
      style={{ width: size, height: size, display: 'inline-block', verticalAlign: '-0.1em' }}
    />
  );
}
