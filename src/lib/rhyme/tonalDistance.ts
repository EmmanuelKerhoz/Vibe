export type TonalLang = 'zh' | 'yue' | 'th' | 'lo' | 'vi' | 'ha' | 'kwa' | 'yo';

function toneToNum(t: string): number | null {
  const m = String(t).match(/[0-9]$/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

export function applyTonalPenalty(
  baseScore: number,
  _lang: TonalLang,
  toneA: string,
  toneB: string,
  weight = 0.25
): number {
  const a = toneToNum(toneA);
  const b = toneToNum(toneB);
  if (a == null || b == null) return baseScore;
  if (a === b) return baseScore;
  const penalty = Math.max(0, Math.min(1, weight));
  return baseScore * (1 - penalty);
}
