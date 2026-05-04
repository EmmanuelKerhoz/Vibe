/**
 * Returns a flagcdn.com PNG URL for a given ISO 3166-1 alpha-2 country code.
 */
export function getFlagUrl(countryCode: string): string {
  return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
}

/**
 * Map from AdaptationLanguage.sign emoji → ISO 3166-1 alpha-2 country code.
 * Only flag emojis are listed here — ethnical pictos are excluded.
 */
export const FLAG_EMOJI_TO_ISO: Readonly<Record<string, string>> = {
  '🇦🇲': 'am', '🇦🇿': 'az', '🇧🇩': 'bd', '🇧🇬': 'bg',
  '🇧🇯': 'bj', '🇨🇲': 'cm', '🇨🇳': 'cn', '🇨🇮': 'ci',
  '🇨🇿': 'cz', '🇩🇪': 'de', '🇩🇰': 'dk', '🇪🇪': 'ee',
  '🇪🇸': 'es', '🇪🇹': 'et', '🇫🇮': 'fi', '🇫🇷': 'fr',
  '🇬🇧': 'gb', '🇭🇰': 'hk', '🇭🇷': 'hr', '🇭🇺': 'hu',
  '🇮🇩': 'id', '🇮🇱': 'il', '🇮🇳': 'in', '🇮🇷': 'ir',
  '🇮🇸': 'is', '🇮🇹': 'it', '🇯🇵': 'jp', '🇰🇭': 'kh',
  '🇰🇪': 'ke', '🇰🇷': 'kr', '🇰🇿': 'kz', '🇱🇦': 'la',
  '🇲🇾': 'my', '🇳🇬': 'ng', '🇳🇴': 'no', '🇵🇭': 'ph',
  '🇵🇰': 'pk', '🇵🇹': 'pt', '🇷🇴': 'ro', '🇷🇸': 'rs',
  '🇷🇺': 'ru', '🇸🇦': 'sa', '🇸🇪': 'se', '🇸🇰': 'sk',
  '🇹🇭': 'th', '🇹🇱': 'tl', '🇹🇷': 'tr', '🇹🇿': 'tz',
  '🇺🇦': 'ua', '🇺🇸': 'us', '🇺🇿': 'uz', '🇻🇳': 'vn',
  '🇿🇦': 'za',
};

/** Returns the flagcdn PNG URL for a sign emoji, or null if it's an ethnic picto. */
export function getFlagUrlFromSign(sign: string): string | null {
  const iso = FLAG_EMOJI_TO_ISO[sign];
  return iso ? getFlagUrl(iso) : null;
}
