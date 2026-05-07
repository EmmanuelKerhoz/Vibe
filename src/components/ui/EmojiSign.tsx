import React, { useCallback, useMemo, useRef } from 'react';
import { emojiToTwemojiUrl } from '../../utils/emojiUtils';

interface EmojiSignProps {
  sign: string;
}

const FALLBACK = '\uD83D\uDD24';
const FALLBACK_SRC = emojiToTwemojiUrl(FALLBACK);

/**
 * Renders an emoji as a local Twemoji SVG for consistent cross-platform display.
 * Covers both pictograms and flag sequences (regional indicator pairs).
 * Falls back to 🔤 when sign is empty or the Twemoji URL fails to load.
 *
 * Error handling is performed via a direct DOM mutation (imgRef) instead of
 * useState so there is never a stale-render frame showing the wrong flag when
 * the parent reuses this component with a different sign (e.g. list reorder,
 * scroll virtualisation, search filter).
 */
export function EmojiSign({ sign }: EmojiSignProps) {
  const resolved = useMemo(() => sign?.trim() || FALLBACK, [sign]);
  const src = useMemo(() => emojiToTwemojiUrl(resolved), [resolved]);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleError = useCallback(() => {
    if (imgRef.current && imgRef.current.src !== FALLBACK_SRC) {
      imgRef.current.src = FALLBACK_SRC;
    }
  }, []);

  return (
    <img
      ref={imgRef}
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
