import React from 'react';
import { getFlagUrlFromSign } from '../lib/flagUrl';

interface FlagSignProps {
  sign: string;
  size?: number; // default 18
  alt?: string;
}

/**
 * Renders a country flag using a flagcdn.com PNG image for consistent
 * cross-platform display (avoids Windows regional-indicator rendering bugs).
 * Ethnical picto signs (not in FLAG_EMOJI_TO_ISO) fall back to emoji text.
 * On image load error, also falls back to emoji text.
 */
export const FlagSign: React.FC<FlagSignProps> = ({ sign, size = 18, alt = '' }) => {
  const url = getFlagUrlFromSign(sign);
  const [errored, setErrored] = React.useState(false);

  // Reset error state when sign changes
  React.useEffect(() => {
    setErrored(false);
  }, [sign]);

  if (!url || errored) {
    // Ethnical picto or load error — render as text
    return (
      <span style={{ fontSize: size, lineHeight: 1 }} aria-label={alt} aria-hidden={!alt || undefined}>
        {sign}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      width={Math.round(size * 4 / 3)}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
};
