/**
 * copy-twemoji.mjs
 *
 * Copies only the Twemoji SVGs that are actually referenced by
 * SUPPORTED_ADAPTATION_LANGUAGES and SUPPORTED_UI_LOCALES into
 * public/twemoji/ so the EmojiSign component always has the right assets.
 *
 * Run:  node scripts/copy-twemoji.mjs
 * Auto: hooked into `prebuild` and `dev` in package.json.
 */

import { copyFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Complete list of signs used in constants.ts ───────────────────────────
// UI locale flags
const UI_SIGNS = [
  '🇺🇸', // en
  '🇫🇷', // fr
  '🇪🇸', // es
  '🇩🇪', // de
  '🇵🇹', // pt
  '🇸🇦', // ar
  '🇨🇳', // zh
  '🇰🇷', // ko
];

// Adaptation language signs (nation flags + ethnic pictograms)
const ADAPT_SIGNS = [
  '🇪🇹', // Amharic
  '🇸🇦', // Arabic
  '🇦🇿', // Azerbaijani
  '🌿', // Baoulé
  '🏹', // Bekwarra
  '🇧🇩', // Bengali
  '🇧🇬', // Bulgarian
  '🦅', // Bambara
  '🐚', // Calabari
  '🇭🇰', // Cantonese
  '🇨🇲', // Camfranglais
  '🇨🇳', // Chinese
  '🇭🇷', // Croatian
  '🇨🇿', // Czech
  '🇩🇰', // Danish
  '🧭', // Dioula
  '🇳🇱', // Dutch
  '🇺🇸', // English
  '🇪🇪', // Estonian
  '🪘', // Ewe
  '🇮🇷', // Farsi
  '🇫🇮', // Finnish
  '🐄', // Fula
  '🇫🇷', // French
  '🇩🇪', // German
  '🇳🇬', // Hausa / Nigerian Pidgin
  '🇮🇱', // Hebrew
  '🇮🇳', // Hindi / Kannada / Malayalam / Punjabi / Tamil / Telugu
  '🇭🇺', // Hungarian
  '🇮🇸', // Icelandic
  '🇮🇩', // Indonesian
  '🇮🇹', // Italian
  '🇯🇵', // Japanese
  '🎭', // Javanese
  '🇰🇿', // Kazakh
  '🇰🇭', // Khmer
  '🇰🇷', // Korean
  '🇱🇦', // Lao
  '🥁', // Lingala
  '🇲🇾', // Malay
  '🌊', // Mina
  '🇨🇮', // Nouchi
  '🇳🇴', // Norwegian
  '🗿', // Ogoja
  '🇵🇱', // Polish
  '🇵🇹', // Portuguese
  '🇷🇴', // Romanian
  '🇷🇺', // Russian
  '🕉️', // Sanskrit
  '🇷🇸', // Serbian
  '🇸🇰', // Slovak
  '🇪🇸', // Spanish
  '🇰🇪', // Swahili
  '🇸🇪', // Swedish
  '🇵🇭', // Tagalog
  '🇹🇭', // Thai
  '🇹🇷', // Turkish
  '🇺🇦', // Ukrainian
  '🇵🇰', // Urdu
  '🇺🇿', // Uzbek
  '🇻🇳', // Vietnamese
  '🦁', // Wolof
  '🎺', // Yoruba
  '🛡️', // Zulu
  // Fallback used by EmojiSign
  '🔤',
  // Globe used by getLanguageDisplay for custom/unknown
  '🌐',
];

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert an emoji string to its Twemoji filename codepoints.
 * Strips variation selector U+FE0F (never in filenames).
 * Preserves U+200D (ZWJ) for composite emoji.
 */
function toCodepoints(emoji) {
  return [...emoji]
    .map(c => c.codePointAt(0).toString(16))
    .filter(cp => cp !== 'fe0f')
    .join('-');
}

// ── Main ──────────────────────────────────────────────────────────────────

const srcBase = resolve(
  __dirname,
  '../node_modules/@twemoji/api/dist/assets/svg',
);
const destDir = resolve(__dirname, '../public/twemoji');
mkdirSync(destDir, { recursive: true });

const allSigns = new Set([...UI_SIGNS, ...ADAPT_SIGNS]);
let ok = 0;
const missing = [];

for (const emoji of allSigns) {
  const cp = toCodepoints(emoji);
  const src = `${srcBase}/${cp}.svg`;
  const dest = `${destDir}/${cp}.svg`;
  try {
    copyFileSync(src, dest);
    ok++;
  } catch {
    missing.push(`${emoji}  →  ${cp}.svg`);
  }
}

if (missing.length) {
  console.warn('\n⚠️  copy-twemoji: missing SVGs:');
  missing.forEach(m => console.warn('   ', m));
  console.warn('');
}
console.log(`✓ copy-twemoji: ${ok} SVG(s) copied to public/twemoji/ (${missing.length} missing)`);
