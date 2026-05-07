import React, { useRef, useState, useMemo } from 'react';
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
 * Error handling uses useState so React correctly re-evaluates the src on every
 * sign change, eliminating stale DOM nodes when the component is reused during
 * list reorder, virtualised scroll, or search filter. The previous useRef
 * approach mutated the DOM directly and could leave the wrong flag visible for
 * one render frame before the new src was applied.
 */
export function EmojiSign({ sign }: EmojiSignProps) {
  const resolved = useMemo(() => sign?.trim() || FALLBACK, [sign]);
  const src = useMemo(() => emojiToTwemojiUrl(resolved), [resolved]);
  const [errored, setErrored] = useState(false);

  // Reset error state when the sign changes so the new src gets a clean attempt.
  const prevSign = useRef(resolved);
  if (prevSign.current !== resolved) {
    prevSign.current = resolved;
    if (errored) setErrored(false);
  }

  return (
    <img
      src={errored ? FALLBACK_SRC : src}
      alt={resolved}
      aria-hidden="true"
      onError={() => setErrored(true)}
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
