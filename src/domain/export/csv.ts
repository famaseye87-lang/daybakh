import type { Measurement, DailyLog } from '../../types';

/** CSV pour Excel en français : séparateur « ; », virgule décimale, BOM UTF-8 pour les accents. */
const BOM = '\uFEFF';
const cell = (v: unknown): string => {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') return String(v).replace('.', ',');
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (header: string[], rows: unknown[][]) => BOM + [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';

export function measurementsCsv(ms: Measurement[]): string {
  const sorted = [...ms].sort((a, b) => a.date.localeCompare(b.date));
  return toCsv(
    ['Date', 'Poids (kg)', 'Tour de taille (cm)', 'Tour de ventre (cm)', 'Tour de hanches (cm)', 'Bras droit (cm)', 'Bras gauche (cm)', 'Cuisse (cm)'],
    sorted.map((m) => [m.date, m.weightKg, m.waistCm, m.bellyCm, m.hipsCm, m.armRightCm, m.armLeftCm, m.thighCm])
  );
}

const QUALITY: Record<string, string> = { good: 'bonne', average: 'moyenne', interrupted: 'interrompue' };

export function dailyCsv(logs: DailyLog[], workoutsByDate: Map<string, string[]>): string {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const dates = [...new Set([...sorted.map((l) => l.date), ...workoutsByDate.keys()])].sort();
  return toCsv(
    ['Date', 'Séances', 'Verres d’eau', 'Sommeil (h)', 'Qualité du sommeil', 'Énergie (1-5)', 'Marche (min)', 'Pas'],
    dates.map((d) => {
      const l = sorted.find((x) => x.date === d);
      return [d, (workoutsByDate.get(d) ?? []).join(' + '), l?.waterGlasses, l?.sleepHours, l?.sleepQuality ? QUALITY[l.sleepQuality] : undefined, l?.energy, l?.walkMinutes, l?.steps];
    })
  );
}
