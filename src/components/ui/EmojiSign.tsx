import React, { useRef, useState, useMemo } from 'react';
import { emojiToTwemojiUrl, emojiToTwemojiCdnUrl } from '../../utils/emojiUtils';

interface EmojiSignProps {
  sign: string;
}

const FALLBACK = '\uD83D\uDD24';
const FALLBACK_SRC = emojiToTwemojiUrl(FALLBACK);

type LoadStage = 'local' | 'cdn' | 'fallback';

/**
 * Renders an emoji as a Twemoji SVG for consistent cross-platform display.
 * Covers both pictograms and flag sequences (regional indicator pairs).
 *
 * Three-stage loading strategy:
 *   1. local  → /twemoji/<codepoints>.svg  (bundled, no network)
 *   2. cdn    → jsDelivr Twemoji CDN       (covers missing local SVGs)
 *   3. fallback → 🔤                        (last resort)
 *
 * The CDN stage fixes flag mismatches caused by an incomplete local bundle:
 * when a local SVG 404s, onError used to flip `errored` to true and show 🔤,
 * but the browser could serve a stale cached image for one frame, making it
 * look like the wrong flag was displayed.
 */
export function EmojiSign({ sign }: EmojiSignProps) {
  const resolved = useMemo(() => sign?.trim() || FALLBACK, [sign]);
  const localSrc = useMemo(() => emojiToTwemojiUrl(resolved), [resolved]);
  const cdnSrc = useMemo(() => emojiToTwemojiCdnUrl(resolved), [resolved]);

  const [stage, setStage] = useState<LoadStage>('local');

  // Reset stage when the sign changes so each new emoji gets a clean attempt.
  const prevSign = useRef(resolved);
  if (prevSign.current !== resolved) {
    prevSign.current = resolved;
    if (stage !== 'local') setStage('local');
  }

  const src =
    stage === 'local' ? localSrc :
    stage === 'cdn'   ? cdnSrc :
    FALLBACK_SRC;

  const handleError = () => {
    if (stage === 'local') setStage('cdn');
    else if (stage === 'cdn') setStage('fallback');
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
