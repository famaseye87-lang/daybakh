import type { Measurement } from '../../types';

export type MeasureKey = Exclude<keyof Measurement, 'id' | 'date'>;

export const MEASURE_KEYS: MeasureKey[] = ['weightKg', 'waistCm', 'bellyCm', 'hipsCm', 'armRightCm', 'armLeftCm', 'thighCm'];

export interface Delta {
  key: MeasureKey;
  current: number;
  /** Écart avec la mesure précédente qui contient cette valeur */
  vsPrevious?: number;
  /** Écart avec la première mesure qui contient cette valeur */
  vsStart?: number;
  /** Écart en % par rapport au départ */
  vsStartPct?: number;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Écarts de la dernière mesure de chaque champ, par rapport à la précédente et au départ. */
export function deltas(ms: Measurement[]): Delta[] {
  const sorted = [...ms].sort((a, b) => a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0));
  const out: Delta[] = [];
  for (const key of MEASURE_KEYS) {
    const vals = sorted.map((m) => m[key]).filter((v): v is number => typeof v === 'number');
    if (vals.length === 0) continue;
    const current = vals[vals.length - 1];
    const first = vals[0];
    out.push({
      key,
      current,
      vsPrevious: vals.length > 1 ? r1(current - vals[vals.length - 2]) : undefined,
      vsStart: vals.length > 1 ? r1(current - first) : undefined,
      vsStartPct: vals.length > 1 ? Math.round(((current - first) / first) * 1000) / 10 : undefined
    });
  }
  return out;
}

/** Progression vers l'objectif, de 0 (départ) à 1 (objectif atteint). */
export function goalProgress(startKg: number, currentKg: number, targetKg: number): number {
  if (startKg <= targetKg) return 1;
  const p = (startKg - currentKg) / (startKg - targetKg);
  return Math.max(0, Math.min(1, p));
}
