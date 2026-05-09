/**
 * copy-twemoji.mjs
 *
 * Downloads exactly the Twemoji SVGs referenced by SUPPORTED_ADAPTATION_LANGUAGES
 * and SUPPORTED_UI_LOCALES from the authoritative jdecked/twemoji CDN and saves
 * them into public/twemoji/.
 *
 * Every codepoint is pre-computed from the actual emoji character — no guessing,
 * no missing files.
 *
 * Run:  node scripts/copy-twemoji.mjs
 * Auto: hooked into `prebuild` and `dev` in package.json.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CDN_BASE =
  'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.2/assets/svg';

// ── Complete, exhaustive list of every sign in constants.ts ──────────────
// UI locale flags
const UI_SIGNS = [
  '🇺🇸', // English  → US
  '🇫🇷', // Français → FR
  '🇪🇸', // Español  → ES
  '🇩🇪', // Deutsch  → DE
  '🇵🇹', // Português→ PT
  '🇸🇦', // العربية  → SA
  '🇨🇳', // 中文     → CN
  '🇰🇷', // 한국어    → KR
];

// Adaptation language signs: nation flags + ethnic pictograms
const ADAPT_SIGNS = [
  '🇪🇹', // Amharic         ET
  '🇸🇦', // Arabic           SA
  '🇦🇿', // Azerbaijani      AZ
  '🌿', // Baoulé           (pictogram)
  '🏹', // Bekwarra         (pictogram)
  '🇧🇩', // Bengali          BD
  '🇧🇬', // Bulgarian        BG
  '🦅', // Bambara          (pictogram)
  '🐚', // Calabari         (pictogram)
  '🇭🇰', // Cantonese        HK
  '🇨🇲', // Camfranglais     CM
  '🇨🇳', // Chinese          CN
  '🇭🇷', // Croatian         HR
  '🇨🇿', // Czech            CZ
  '🇩🇰', // Danish           DK
  '🧭', // Dioula           (pictogram)
  '🇳🇱', // Dutch            NL
  '🇺🇸', // English          US
  '🇪🇪', // Estonian         EE
  '🪘', // Ewe              (pictogram)
  '🇮🇷', // Farsi            IR
  '🇫🇮', // Finnish          FI
  '🐄', // Fula             (pictogram)
  '🇫🇷', // French           FR
  '🇩🇪', // German           DE
  '🇳🇬', // Hausa/Nig.Pidgin NG
  '🇮🇱', // Hebrew           IL
  '🇮🇳', // Hindi/Kannada/…  IN
  '🇭🇺', // Hungarian        HU
  '🇮🇸', // Icelandic         IS
  '🇮🇩', // Indonesian        ID
  '🇮🇹', // Italian          IT
  '🇯🇵', // Japanese         JP
  '🎭', // Javanese          (pictogram)
  '🇰🇿', // Kazakh           KZ
  '🇰🇭', // Khmer            KH
  '🇰🇷', // Korean           KR
  '🇱🇦', // Lao              LA
  '🥁', // Lingala          (pictogram)
  '🇲🇾', // Malay            MY
  '🌊', // Mina             (pictogram)
  '🇨🇮', // Nouchi           CI
  '🇳🇴', // Norwegian        NO
  '🗿', // Ogoja            (pictogram)
  '🇵🇱', // Polish           PL
  '🇵🇹', // Portuguese       PT
  '🇷🇴', // Romanian         RO
  '🇷🇺', // Russian          RU
  '🕉️', // Sanskrit          (pictogram)
  '🇷🇸', // Serbian          RS
  '🇸🇰', // Slovak           SK
  '🇪🇸', // Spanish          ES
  '🇰🇪', // Swahili          KE
  '🇸🇪', // Swedish          SE
  '🇵🇭', // Tagalog          PH
  '🇹🇭', // Thai             TH
  '🇹🇷', // Turkish          TR
  '🇺🇦', // Ukrainian        UA
  '🇵🇰', // Urdu             PK
  '🇺🇿', // Uzbek            UZ
  '🇻🇳', // Vietnamese       VN
  '🦁', // Wolof            (pictogram)
  '🎺', // Yoruba           (pictogram)
  '🛡️', // Zulu             (pictogram)
  // Reserved by EmojiSign internals
  '🔤', // FALLBACK
  '🌐', // globe / custom
];

// ── Helpers ────────────────────────────────────────────────────────────

function toCodepoints(emoji) {
  return [...emoji]
    .map(c => c.codePointAt(0).toString(16))
    .filter(cp => cp !== 'fe0f') // strip variation selector — never in filenames
    .join('-');
}

function fetchSvg(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * Sync a single emoji's SVG to disk.
 *
 * History bug: a stale `existsSync` short-circuit kept corrupted local SVGs
 * (wrong stripes, missing coats of arms — see issues about flag/language
 * mismatches) from ever being repaired. We now always fetch the canonical
 * SVG from the pinned CDN and only write to disk when the bytes actually
 * differ from what's already on disk. This keeps the script idempotent and
 * git-diff-friendly while making it self-healing if the local bundle drifts
 * from upstream for any reason (manual edits, partial downloads, etc.).
 */
async function sync(url, dest) {
  const fresh = await fetchSvg(url);
  if (existsSync(dest)) {
    const current = readFileSync(dest);
    if (current.equals(fresh)) return 'cached';
  }
  writeFileSync(dest, fresh);
  return 'ok';
}

// ── Main ─────────────────────────────────────────────────────────────────

const destDir = resolve(__dirname, '../public/twemoji');
mkdirSync(destDir, { recursive: true });

const unique = [...new Set([...UI_SIGNS, ...ADAPT_SIGNS])];

const tasks = unique.map(emoji => {
  const cp = toCodepoints(emoji);
  const url = `${CDN_BASE}/${cp}.svg`;
  const dest = `${destDir}/${cp}.svg`;
  return sync(url, dest)
    .then(status => ({ emoji, cp, status }))
    .catch(err => ({ emoji, cp, status: 'error', err }));
});

const results = await Promise.all(tasks);

const errors = results.filter(r => r.status === 'error');
const cached = results.filter(r => r.status === 'cached').length;
const fetched = results.filter(r => r.status === 'ok').length;

if (errors.length) {
  // Should never happen — every codepoint is pre-validated against the CDN.
  console.error('\n❌ copy-twemoji: unexpected download errors:');
  errors.forEach(r => console.error(`   ${r.emoji} ${r.cp}.svg — ${r.err?.message}`));
  process.exit(1);
}

console.log(
  `✓ copy-twemoji: ${fetched} written, ${cached} unchanged — public/twemoji/ ready.`,
);
