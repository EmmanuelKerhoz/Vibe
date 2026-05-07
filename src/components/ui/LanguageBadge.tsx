import React from 'react';
import { EmojiSign } from './EmojiSign';
import { getLanguageDisplay } from '../../i18n';

/**
 * <LanguageBadge> — single canonical render path for a flag+label pair.
 *
 * The component accepts only a `langId` (e.g. "adapt:ES", "ui:fr",
 * "custom:Scots Gaelic") and resolves both the sign and the label from one
 * authoritative table. This guarantees the flag and the language name can
 * never get out of sync at the render layer: there is no API for "render only
 * the flag" or "render only the label" that takes anything other than a langId.
 *
 * Components MUST NOT pass a sign emoji or aiName directly — funnel everything
 * through `langId` and let this component own the visual pairing.
 */
interface LanguageBadgeProps {
  /** Canonical language identifier — see `LangId` in src/i18n/constants.ts. */
  langId: string;
  /** When true, append the region in parentheses if the entry has one. */
  showRegion?: boolean;
  /** When true, render only the sign (still keyed to its langId for safety). */
  signOnly?: boolean;
  /** When true, render only the label (still keyed to its langId for safety). */
  labelOnly?: boolean;
  /** Extra classes applied to the wrapper span. */
  className?: string;
  /** Extra classes applied to the label text span. */
  labelClassName?: string;
}

export function LanguageBadge({
  langId,
  showRegion = false,
  signOnly = false,
  labelOnly = false,
  className,
  labelClassName,
}: LanguageBadgeProps) {
  const display = getLanguageDisplay(langId);
  const label = showRegion && display.region
    ? `${display.label} (${display.region})`
    : display.label;

  // The wrapper key is intentionally tied to `langId` so React never reuses a
  // mounted EmojiSign instance from a different language across re-orders or
  // re-renders of the parent list.
  if (signOnly) {
    return (
      <span key={langId} className={className} aria-label={display.label}>
        <EmojiSign sign={display.sign} />
      </span>
    );
  }

  if (labelOnly) {
    return (
      <span key={langId} className={[className, labelClassName].filter(Boolean).join(' ')}>
        {label}
      </span>
    );
  }

  return (
    <span
      key={langId}
      className={['flex items-center gap-1.5 min-w-0', className].filter(Boolean).join(' ')}
    >
      <EmojiSign sign={display.sign} />
      <span className={['truncate', labelClassName].filter(Boolean).join(' ')}>
        {label}
      </span>
    </span>
  );
}
