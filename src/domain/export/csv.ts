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

const HEADER_KEYS: Record<string, keyof Measurement> = {
  'poids (kg)': 'weightKg',
  'tour de taille (cm)': 'waistCm',
  'tour de ventre (cm)': 'bellyCm',
  'tour de hanches (cm)': 'hipsCm',
  'bras droit (cm)': 'armRightCm',
  'bras gauche (cm)': 'armLeftCm',
  'cuisse (cm)': 'thighCm'
};

/**
 * Lit un CSV de mesures (format exporté par Daybakh, séparateur « ; » ou « , », virgule ou point décimal).
 * Les lignes invalides sont ignorées et comptées.
 */
export function parseMeasurementsCsv(text: string): { measurements: Measurement[]; skipped: number } | { error: string } {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { error: 'Le fichier ne contient aucune mesure.' };
  const sep = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  if (header[0] !== 'date' || !header.includes('poids (kg)')) return { error: 'Ce CSV n’a pas le format des mesures Daybakh (colonnes « Date » et « Poids (kg) »).' };
  const num = (s: string | undefined) => {
    if (!s || !s.trim()) return undefined;
    const v = Number(s.trim().replace(',', '.'));
    return Number.isFinite(v) ? v : NaN;
  };
  const out: Measurement[] = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cells = line.split(sep);
    const date = cells[0]?.trim();
    const m: Measurement = { date, weightKg: NaN };
    header.forEach((h, i) => {
      const key = HEADER_KEYS[h];
      if (key) (m as unknown as Record<string, number | undefined>)[key] = num(cells[i]);
    });
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') && m.weightKg >= 25 && m.weightKg <= 350 &&
      Object.values(HEADER_KEYS).every((k) => k === 'weightKg' || m[k] === undefined || (Number.isFinite(m[k] as number) && (m[k] as number) > 0));
    if (valid) out.push(m);
    else skipped++;
  }
  return { measurements: out, skipped };
}
