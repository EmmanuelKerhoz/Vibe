/**
 * Converts a BCP-47 language code to a full English language name
 * suitable for AI prompt injection.
 * Single source of truth — replaces duplicated inline chains in hooks.
 */
export const resolveUiLanguageName = (code: string): string => {
  switch (code) {
    case 'fr': return 'French';
    case 'es': return 'Spanish';
    case 'de': return 'German';
    case 'pt': return 'Portuguese';
    case 'ar': return 'Arabic';
    case 'zh': return 'Chinese';
    case 'ko': return 'Korean';
    default:   return 'English';
  }
};
