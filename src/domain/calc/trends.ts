import { C } from '../conventions';
import { mondayOf } from './recalc';
import type { Measurement, DailyLog, WorkoutLog, MealPhoto } from '../../types';
import type { MeasureKey } from './progress';

export interface WeekPoint {
  /** Lundi de la semaine (AAAA-MM-JJ) */
  week: string;
  value: number;
}

const DAY = 86400000;
const t = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00').getTime();
export const weeksBetween = (a: string, b: string) => Math.round((t(b) - t(a)) / (7 * DAY));

/** Dernière valeur de chaque semaine pour un champ de mesure. */
export function weeklyMeasure(ms: Measurement[], key: MeasureKey): WeekPoint[] {
  const byWeek = new Map<string, { date: string; value: number }>();
  for (const m of ms) {
    const v = m[key];
    if (typeof v !== 'number') continue;
    const w = mondayOf(m.date);
    const prev = byWeek.get(w);
    if (!prev || m.date >= prev.date) byWeek.set(w, { date: m.date, value: v });
  }
  return [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, x]) => ({ week, value: x.value }));
}

/** Variation hebdomadaire (en fraction) entre semaines consécutives ; ramenée à 1 semaine en cas de trou. */
export function weeklyChanges(points: WeekPoint[]): { week: string; change: number }[] {
  const out: { week: string; change: number }[] = [];
  for (let i = 1; i < points.length; i++) {
    const gap = Math.max(1, weeksBetween(points[i - 1].week, points[i].week));
    const total = (points[i].value - points[i - 1].value) / points[i - 1].value;
    out.push({ week: points[i].week, change: total / gap });
  }
  return out;
}

/** Perte > 1 % par semaine pendant 2 semaines consécutives (consigne projet, § D). */
export function fastLossAlert(weekly: WeekPoint[]): boolean {
  const ch = weeklyChanges(weekly);
  const n = C.alerts.fastLoss.consecutiveWeeks;
  if (ch.length < n) return false;
  return ch.slice(-n).every((c) => c.change < -C.alerts.fastLoss.weeklyLossOver);
}

/** Poids stable (± 0,2 % par semaine) pendant 3 semaines (§ D ; seuil : convention Daybakh). */
export function plateauAlert(weekly: WeekPoint[]): boolean {
  const ch = weeklyChanges(weekly);
  const n = C.alerts.plateau.weeks;
  if (ch.length < n) return false;
  const last = ch.slice(-n);
  const span = weeksBetween(weekly[weekly.length - 1 - n].week, weekly[weekly.length - 1].week);
  return span === n && last.every((c) => Math.abs(c.change) <= C.alerts.plateau.tolerance);
}

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

function groupByWeek<T extends { date: string }>(items: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const w = mondayOf(it.date);
    m.set(w, [...(m.get(w) ?? []), it]);
  }
  return m;
}

const sorted = (m: Map<string, number>): WeekPoint[] =>
  [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, value]) => ({ week, value }));

/** Sommeil moyen par semaine (heures). */
export function weeklySleep(logs: DailyLog[]): WeekPoint[] {
  const out = new Map<string, number>();
  for (const [w, items] of groupByWeek(logs)) {
    const v = items.map((l) => l.sleepHours).filter((x): x is number => typeof x === 'number');
    if (v.length) out.set(w, Math.round(avg(v) * 10) / 10);
  }
  return sorted(out);
}

/** Énergie moyenne par semaine (1 à 5). */
export function weeklyEnergy(logs: DailyLog[]): WeekPoint[] {
  const out = new Map<string, number>();
  for (const [w, items] of groupByWeek(logs)) {
    const v = items.map((l) => l.energy).filter((x): x is NonNullable<typeof x> => typeof x === 'number');
    if (v.length) out.set(w, Math.round(avg(v) * 10) / 10);
  }
  return sorted(out);
}

/** Nombre de séances faites par semaine (séances complètes ; partielles comptées pour ½). */
export function weeklySessions(workouts: WorkoutLog[]): WeekPoint[] {
  const out = new Map<string, number>();
  for (const [w, items] of groupByWeek(workouts)) out.set(w, items.length);
  return sorted(out);
}

/** Part de repas conformes par semaine (%) : oui = 1, à peu près = ½, non = 0 ; repas libre exclu. */
export function weeklyMealConformity(photos: Pick<MealPhoto, 'date' | 'meal' | 'conformity'>[]): WeekPoint[] {
  const out = new Map<string, number>();
  for (const [w, items] of groupByWeek(photos)) {
    const rated = items.filter((p) => p.meal !== 'free' && p.conformity);
    if (!rated.length) continue;
    const score = rated.reduce((s, p) => s + (p.conformity === 'yes' ? 1 : p.conformity === 'almost' ? 0.5 : 0), 0);
    out.set(w, Math.round((score / rated.length) * 100));
  }
  return sorted(out);
}

/** Filtre une série sur les N dernières semaines (par rapport à la date du jour). */
export function lastWeeks(points: WeekPoint[], weeks: number | 'all', todayISO: string): WeekPoint[] {
  if (weeks === 'all') return points;
  const from = mondayOf(new Date(t(todayISO) - (weeks - 1) * 7 * DAY).toISOString().slice(0, 10));
  return points.filter((p) => p.week >= from);
}
