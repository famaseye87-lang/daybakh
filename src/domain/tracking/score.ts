import type { DailyLog, WorkoutLog, MealPhoto } from '../../types';
import type { DayPlan } from '../sport/types';
import { C } from '../conventions';

const DAY = 86400000;
export const addDaysISO = (iso: string, n: number) => {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const weekDates = (monday: string) => Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));

/** Nombre de verres de 250 mL pour atteindre l'objectif bas d'hydratation. */
export const waterGoalGlasses = (minL: number) => Math.ceil((minL * 1000) / C.water.glassMl);

export interface WeekScore {
  /** null en tout début de semaine, quand rien n'est encore comptable */
  total: number | null;
  sessions: { done: number; planned: number; points: number };
  water: { days: number; counted: number; points: number };
  sleep: { days: number; counted: number; points: number };
  meals?: { pct: number; points: number };
}

/**
 * Score de la semaine sur 100 (§ G.3, convention Daybakh) : séances, eau, sommeil noté, repas conformes — 25 points chacun.
 * Comptent les jours déjà passés, et aujourd'hui seulement si c'est déjà fait : le score ne peut que monter dans la journée.
 * Une rubrique sans aucun jour comptable (ou sans photo de repas) est retirée et le score ramené sur 100.
 */
export function weekScore(o: {
  monday: string;
  today: string;
  plan: DayPlan[];
  logs: DailyLog[];
  workouts: WorkoutLog[];
  photos: Pick<MealPhoto, 'date' | 'meal' | 'conformity'>[];
  waterGoal: number;
  /** Date de création du profil : les jours d'avant ne comptent pas */
  since?: string;
}): WeekScore {
  const dates = weekDates(o.monday).filter((d) => !o.since || d >= o.since);
  const past = dates.filter((d) => d < o.today);
  const isToday = (d: string) => d === o.today;
  const logOf = (d: string) => o.logs.find((l) => l.date === d);
  const workoutDays = new Set(o.workouts.map((w) => w.date));
  const allDates = weekDates(o.monday);
  const sportDay = (d: string) => o.plan[allDates.indexOf(d)]?.items.some((i) => i.kind !== 'rest');

  const plannedDates = dates.filter((d) => sportDay(d) && (d < o.today || (isToday(d) && workoutDays.has(d))));
  const done = plannedDates.filter((d) => workoutDays.has(d)).length;

  const waterOk = (d: string) => (logOf(d)?.waterGlasses ?? 0) >= o.waterGoal;
  const waterCounted = past.length + (waterOk(o.today) && dates.includes(o.today) ? 1 : 0);
  const waterDays = past.filter(waterOk).length + (waterOk(o.today) && dates.includes(o.today) ? 1 : 0);

  const slept = (d: string) => typeof logOf(d)?.sleepHours === 'number';
  const sleepCounted = past.length + (slept(o.today) && dates.includes(o.today) ? 1 : 0);
  const sleepDays = past.filter(slept).length + (slept(o.today) && dates.includes(o.today) ? 1 : 0);

  const parts: number[] = [];
  const pts = (num: number, den: number) => (den === 0 ? undefined : (num / den) * 25);
  const sP = pts(done, plannedDates.length);
  const wP = pts(waterDays, waterCounted);
  const slP = pts(sleepDays, sleepCounted);
  for (const x of [sP, wP, slP]) if (x !== undefined) parts.push(x);

  const rated = o.photos.filter((p) => dates.includes(p.date) && p.date <= o.today && p.meal !== 'free' && p.conformity);
  let meals: WeekScore['meals'];
  if (rated.length) {
    const pct = rated.reduce((s, p) => s + (p.conformity === 'yes' ? 1 : p.conformity === 'almost' ? 0.5 : 0), 0) / rated.length;
    meals = { pct: Math.round(pct * 100), points: Math.round(pct * 25) };
    parts.push(pct * 25);
  }
  const total = parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / (parts.length * 25)) * 100) : null;
  return {
    total,
    sessions: { done, planned: plannedDates.length, points: Math.round(sP ?? 0) },
    water: { days: waterDays, counted: waterCounted, points: Math.round(wP ?? 0) },
    sleep: { days: sleepDays, counted: sleepCounted, points: Math.round(slP ?? 0) },
    meals
  };
}

/** Message d'encouragement selon le score (jamais culpabilisant). */
export function scoreMessage(total: number | null): string {
  if (total === null) return 'Ta semaine commence : chaque petit geste comptera.';
  if (total >= 85) return 'Semaine magnifique. Daybakh : tu le prouves !';
  if (total >= 60) return 'Belle régularité, continue comme ça.';
  if (total >= 30) return 'Chaque petit pas compte. Ça va aller !';
  return 'Semaine chargée ? Ce n’est pas grave : on reprend tranquillement, à ton rythme.';
}

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / DAY);
