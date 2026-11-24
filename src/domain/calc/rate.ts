import { C } from '../conventions';

/** Rythme de perte attendu par semaine (Helms et al., 2014) ; bas de fourchette si sommeil < 6 h (§ J). */
export function expectedWeeklyRate(sleepHours: number): { min: number; max: number; shortSleep: boolean } {
  const shortSleep = sleepHours < C.sleep.shortNightHours;
  return { min: C.rate.min, max: shortSleep ? C.rate.min : C.rate.max, shortSleep };
}

/** Semaines pour passer de w à target à r % par semaine : ln(target / w) / ln(1 − r). */
export function etaWeeks(weightKg: number, targetKg: number, weeklyRate: number): number {
  if (targetKg >= weightKg) return 0;
  return Math.log(targetKg / weightKg) / Math.log(1 - weeklyRate);
}

/** Fourchette de semaines (rythme rapide → lent). */
export function etaRange(
  weightKg: number,
  targetKg: number,
  sleepHours: number
): { minWeeks: number; maxWeeks: number } {
  const r = expectedWeeklyRate(sleepHours);
  return {
    minWeeks: Math.ceil(etaWeeks(weightKg, targetKg, r.max)),
    maxWeeks: Math.ceil(etaWeeks(weightKg, targetKg, r.min))
  };
}

export function addWeeksISO(startISO: string, weeks: number): string {
  const d = new Date(startISO.slice(0, 10) + 'T12:00:00');
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}
