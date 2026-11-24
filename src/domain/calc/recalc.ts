import { C } from '../conventions';
import type { Measurement, CalcSnapshot } from '../../types';

const byDate = (a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date);

/** Poids de référence pour le recalcul : moyenne des 2 dernières pesées (convention Daybakh). */
export function referenceWeight(ms: Measurement[]): number | undefined {
  const sorted = [...ms].sort(byDate);
  const last = sorted.slice(-2);
  if (last.length === 0) return undefined;
  const avg = last.reduce((s, m) => s + m.weightKg, 0) / last.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Un recalcul est dû toutes les 4 semaines de programme,
 * à condition qu'au moins une pesée ait été faite depuis le dernier calcul.
 */
export function isRecalcDue(
  currentWeek: number,
  last: Pick<CalcSnapshot, 'weekIndex' | 'date'> | undefined,
  ms: Measurement[]
): boolean {
  if (!last) return ms.length > 0;
  if (currentWeek < last.weekIndex + C.recalcEveryWeeks) return false;
  return ms.some((m) => m.date > last.date);
}

/** Objectif atteint : les 2 dernières pesées sont ≤ au poids cible. */
export function goalReached(ms: Measurement[], targetKg: number | undefined): boolean {
  if (!targetKg) return false;
  const last = [...ms].sort(byDate).slice(-2);
  return last.length === 2 && last.every((m) => m.weightKg <= targetKg);
}

/** Lundi (AAAA-MM-JJ) de la semaine contenant la date. */
export function mondayOf(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - dow);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Y a-t-il déjà une mesure cette semaine (du lundi au dimanche) ? */
export function measuredThisWeek(ms: Measurement[], todayISO: string): boolean {
  const monday = mondayOf(todayISO);
  return ms.some((m) => m.date >= monday && m.date <= todayISO);
}
