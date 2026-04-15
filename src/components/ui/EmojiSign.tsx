import React from 'react';
import { emojiToTwemojiUrl } from '../../utils/emojiUtils';

interface EmojiSignProps {
  sign: string;
  /**
   * When true, render the emoji as a native <span> (ideal for flag emojis
   * which rely on OS rendering and are not bundled as local Twemoji SVGs).
   * When false (default), load from the local Twemoji SVG bundle.
   */
  native?: boolean;
}

/**
 * Renders an emoji reliably across platforms.
 * - native=true  → <span> with font rendering (flags, standard emojis)
 * - native=false → local Twemoji SVG (ethnic/cultural pictograms)
 * Returns null on SVG load failure to avoid Windows globe substitution.
 */
export function EmojiSign({ sign, native = false }: EmojiSignProps) {
  const [error, setError] = React.useState(false);

  const style: React.CSSProperties = {
    width: '1em',
    height: '1em',
    display: 'inline-block',
    verticalAlign: '-0.1em',
    flexShrink: 0,
  };

  if (native) {
    return (
      <span
        aria-hidden="true"
        style={{ ...style, fontSize: '1em', lineHeight: 1 }}
      >
        {sign}
      </span>
    );
  }

  if (error) return null;

  return (
    <img
      src={emojiToTwemojiUrl(sign)}
      alt={sign}
      aria-hidden="true"
      onError={() => setError(true)}
      style={style}
    />
  );
}
