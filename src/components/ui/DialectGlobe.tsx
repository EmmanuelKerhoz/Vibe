import React from 'react';

/**
 * Region-to-rotation mapping for a simple CSS-rotated globe.
 * Values are [rotateY, rotateX] in degrees where:
 * - rotateY ≈ longitude (negative = west, positive = east)
 * - rotateX ≈ latitude (negative = south, positive = north)
 */
const REGION_ROTATIONS: Record<string, [number, number]> = {
  // Europe
  'Western Europe':   [-5, 48],
  'Northern Europe':  [15, 60],
  'Eastern Europe':   [30, 52],
  'Southern Europe':  [12, 42],
  // Africa
  'West Africa':      [-5, 10],
  'East Africa':      [38, 0],
  'Central Africa':   [20, -2],
  'North Africa':     [10, 30],
  'South Africa':     [28, -30],
  // Middle East
  'Middle East':      [45, 28],
  // South Asia
  'South Asia':       [78, 22],
  // Southeast Asia
  'Southeast Asia':   [105, 10],
  // East Asia
  'East Asia':        [118, 35],
  'Central Asia':     [65, 42],
  // Americas (not currently used but included for completeness)
  'North America':    [-100, 40],
  'South America':    [-60, -15],
  // Oceania
  'Oceania':          [135, -25],
};

/** Maps region keywords to their general geographic area. */
const REGION_KEYWORDS: [string, string[]][] = [
  ['West Africa', ['west africa', 'ivory coast', 'nigeria', 'niger', 'senegal', 'mali', 'burkina', 'togo', 'cameroon']],
  ['East Africa', ['east africa', 'ethiopia', 'tanzania', 'kenya']],
  ['Central Africa', ['central africa', 'congo']],
  ['South Africa', ['south africa']],
  ['East Asia', ['hong kong', 'guangdong', 'mandarin', 'south korea', 'japan']],
  ['Southeast Asia', ['java', 'indonesia', 'cambodia', 'philippines', 'vietnam', 'thailand', 'lao', 'malay']],
  ['South Asia', ['india', 'bangladesh', 'bengal', 'karnataka', 'kerala', 'punjab', 'tamil', 'andhra', 'sri lanka', 'pakistan']],
  ['Middle East', ['iran', 'persian']],
];

/**
 * Infer the general region from a language code or region string.
 */
function inferRegion(code: string, region?: string): [number, number] {
  if (region) {
    const r = region.toLowerCase();
    for (const [area, keywords] of REGION_KEYWORDS) {
      if (keywords.some(kw => r.includes(kw))) return REGION_ROTATIONS[area]!;
    }
  }

  // Fallback by code
  const c = code.toUpperCase();
  const codeMap: Record<string, string> = {
    // European languages
    EN: 'Western Europe', FR: 'Western Europe', DE: 'Western Europe', NL: 'Western Europe', 'AR_ROM': 'Southern Europe',
    ES: 'Southern Europe', IT: 'Southern Europe', PT: 'Southern Europe', RO: 'Southern Europe', CA: 'Southern Europe',
    SV: 'Northern Europe', DA: 'Northern Europe', NO: 'Northern Europe', IS: 'Northern Europe', FI: 'Northern Europe', ET: 'Northern Europe',
    RU: 'Eastern Europe', PL: 'Eastern Europe', CS: 'Eastern Europe', SK: 'Eastern Europe', UK: 'Eastern Europe', BG: 'Eastern Europe', SR: 'Eastern Europe', HR: 'Eastern Europe', HU: 'Eastern Europe',
    // Middle East
    AR: 'Middle East', HE: 'Middle East', TR: 'Middle East', FA: 'Middle East',
    // South Asia
    HI: 'South Asia', UR: 'South Asia', BN: 'South Asia', PA: 'South Asia', TA: 'South Asia', TE: 'South Asia', KN: 'South Asia', ML: 'South Asia',
    // SE Asia
    TH: 'Southeast Asia', LO: 'Southeast Asia', VI: 'Southeast Asia', KM: 'Southeast Asia', ID: 'Southeast Asia', MS: 'Southeast Asia', TL: 'Southeast Asia', JV: 'Southeast Asia',
    // East Asia
    ZH: 'East Asia', YUE: 'East Asia', JA: 'East Asia', KO: 'East Asia',
    // Central Asia
    KK: 'Central Asia', UZ: 'Central Asia', AZ: 'Central Asia',
    // Africa
    SW: 'East Africa', AM: 'East Africa',
    YO: 'West Africa', HA: 'West Africa', FF: 'West Africa', BM: 'West Africa', BA: 'West Africa', DI: 'West Africa', WO: 'West Africa',
    BK: 'West Africa', CB: 'West Africa', OG: 'West Africa', PCM: 'West Africa', NOU: 'West Africa', CFG: 'West Africa',
    EW: 'West Africa', MI: 'West Africa',
    LN: 'Central Africa', MG: 'East Africa',
    ZU: 'South Africa',
  };

  const regionKey = codeMap[c];
  if (regionKey && REGION_ROTATIONS[regionKey]) return REGION_ROTATIONS[regionKey]!;

  return REGION_ROTATIONS['Western Europe']!; // default
}

interface DialectGlobeProps {
  /** Language code (e.g. 'BA', 'EN') */
  code: string;
  /** Optional region label from the AdaptationLanguage */
  region?: string;
  /** Size in pixels (default 28) */
  size?: number;
}

/**
 * Small inline Earth globe SVG that rotates to highlight the approximate
 * region of a dialect/language. Rendered as a pure SVG with CSS transitions
 * for smooth rotation animation.
 */
export function DialectGlobe({ code, region, size = 28 }: DialectGlobeProps) {
  const [rotY, rotX] = inferRegion(code, region);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="flex-shrink-0"
      aria-hidden="true"
      style={{ transition: 'transform 0.4s ease' }}
    >
      <defs>
        <radialGradient id={`globe-grad-${code}`} cx="35%" cy="35%" r="60%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.3)" />
          <stop offset="100%" stopColor="rgba(14,165,233,0.08)" />
        </radialGradient>
        <clipPath id={`globe-clip-${code}`}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>
      {/* Ocean background */}
      <circle cx="50" cy="50" r="46" fill={`url(#globe-grad-${code})`} stroke="var(--lcars-cyan)" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Simplified continent shapes — rotated based on region */}
      <g clipPath={`url(#globe-clip-${code})`}>
        <g style={{
          transform: `rotate(${-rotX}deg) rotate(${-rotY * 0.3}deg)`,
          transformOrigin: '50px 50px',
          transition: 'transform 0.4s ease',
        }}>
          {/* Grid lines */}
          <ellipse cx="50" cy="50" rx="46" ry="20" fill="none" stroke="var(--lcars-cyan)" strokeWidth="0.5" strokeOpacity="0.15" />
          <ellipse cx="50" cy="50" rx="46" ry="35" fill="none" stroke="var(--lcars-cyan)" strokeWidth="0.5" strokeOpacity="0.15" />
          <line x1="50" y1="4" x2="50" y2="96" stroke="var(--lcars-cyan)" strokeWidth="0.5" strokeOpacity="0.15" />
          <line x1="4" y1="50" x2="96" y2="50" stroke="var(--lcars-cyan)" strokeWidth="0.5" strokeOpacity="0.15" />
          {/* Region indicator dot */}
          <circle cx="50" cy="50" r="5" fill="var(--lcars-cyan)" fillOpacity="0.6">
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="fillOpacity" values="0.6;0.3;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="50" cy="50" r="2" fill="var(--lcars-cyan)" fillOpacity="0.9" />
        </g>
      </g>
      {/* Rim highlight */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--lcars-cyan)" strokeWidth="1" strokeOpacity="0.2" />
    </svg>
  );
}
