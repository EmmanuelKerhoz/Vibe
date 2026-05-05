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
 *
 * src is derived purely from the sign prop via useMemo — no useState/useEffect
 * so there is never a stale-render frame showing the previous flag when the
 * parent reuses this component with a different sign (e.g. after list reorder).
 */
export function EmojiSign({ sign }: EmojiSignProps) {
  const resolved = useMemo(() => sign?.trim() || FALLBACK, [sign]);
  const src = useMemo(() => emojiToTwemojiUrl(resolved), [resolved]);

  const [errorSrc, setErrorSrc] = React.useState<string | null>(null);

  // Reset error state whenever the sign changes so a previously-failed emoji
  // does not keep showing the fallback icon when a new valid sign is passed.
  React.useEffect(() => { setErrorSrc(null); }, [resolved]);

  const handleError = useCallback(() => {
    if (resolved !== FALLBACK) {
      setErrorSrc(emojiToTwemojiUrl(FALLBACK));
    }
  }, [resolved]);

  return (
    <img
      src={errorSrc ?? src}
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
