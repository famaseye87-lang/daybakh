import type { DailyLog, WorkoutLog, Measurement, MealPhoto } from '../../types';
import type { DayPlan } from '../sport/types';
import { mondayOf } from '../calc/recalc';
import { weekDates, daysBetween, addDaysISO } from './score';

export interface BadgeInput {
  today: string;
  startWeightKg: number;
  plan: DayPlan[];
  workouts: WorkoutLog[];
  logs: DailyLog[];
  measurements: Measurement[];
  photos: Pick<MealPhoto, 'date'>[];
  waterGoal: number;
}

/** Badges mérités d'après l'historique (règles : conventions Daybakh, § G.3). */
export function earnedBadges(i: BadgeInput): string[] {
  const out: string[] = [];
  const w = [...i.workouts].sort((a, b) => a.date.localeCompare(b.date));
  if (w.length) out.push('first-session');
  if (i.measurements.length) out.push('first-measure');

  // Semaine complète : une semaine passée (ou en cours) où chaque jour prévu a une séance.
  const plannedDays = i.plan.filter((d) => d.items.some((x) => x.kind !== 'rest')).map((d) => d.day);
  const weeks = new Set(w.map((x) => mondayOf(x.date)));
  for (const m of weeks) {
    const dates = weekDates(m);
    const done = new Set(w.filter((x) => dates.includes(x.date)).map((x) => x.date));
    if (plannedDays.length && plannedDays.every((d) => done.has(dates[d - 1]))) {
      out.push('full-week');
      break;
    }
  }

  const palier = Math.round(i.startWeightKg * 0.95 * 10) / 10; // même arrondi que le palier affiché
  if (i.measurements.some((m) => m.weightKg <= palier)) out.push('milestone-5');
  if (w.filter((x) => x.kind === 'swim').length >= 10) out.push('swim-10');

  // 4 semaines consécutives avec l'objectif d'eau atteint au moins 5 jours.
  const goodWeeks = new Set<string>();
  const byWeek = new Map<string, number>();
  for (const l of i.logs) if (l.waterGlasses >= i.waterGoal) byWeek.set(mondayOf(l.date), (byWeek.get(mondayOf(l.date)) ?? 0) + 1);
  for (const [k, v] of byWeek) if (v >= 5) goodWeeks.add(k);
  for (const m of goodWeeks) {
    if ([1, 2, 3].every((k) => goodWeeks.has(addDaysISO(m, 7 * k)))) {
      out.push('water-4w');
      break;
    }
  }

  // Reprise après au moins 7 jours sans séance.
  for (let k = 1; k < w.length; k++) {
    if (daysBetween(w[k - 1].date, w[k].date) >= 8) {
      out.push('comeback');
      break;
    }
  }

  if (new Set(i.photos.map((p) => p.date)).size >= 7) out.push('journal-7');
  if (i.logs.filter((l) => typeof l.sleepHours === 'number').length >= 14) out.push('sleep-14');
  return out;
}
