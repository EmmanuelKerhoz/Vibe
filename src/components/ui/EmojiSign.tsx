import React, { useCallback, useMemo } from 'react';
import { emojiToTwemojiUrl } from '../../utils/emojiUtils';

interface EmojiSignProps {
  sign: string;
}

const FALLBACK = '\uD83D\uDD24';

/**
 * Renders an emoji as a local Twemoji SVG for consistent cross-platform display.
 * Covers both pictograms and flag sequences (regional indicator pairs).
 * Falls back to 🔤 when sign is empty or the Twemoji URL fails to load.
 */
export function EmojiSign({ sign }: EmojiSignProps) {
  const resolved = useMemo(() => sign?.trim() || FALLBACK, [sign]);
  const [src, setSrc] = React.useState(() => emojiToTwemojiUrl(resolved));

  // Reset src when resolved changes
  React.useEffect(() => {
    setSrc(emojiToTwemojiUrl(resolved));
  }, [resolved]);

  // useCallback([sign]) ensures handleError always references the current
  // `resolved` value — avoids stale closure if sign changes while loading.
  const handleError = useCallback(() => {
    if (resolved !== FALLBACK) {
      setSrc(emojiToTwemojiUrl(FALLBACK));
    }
  }, [resolved]);

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
