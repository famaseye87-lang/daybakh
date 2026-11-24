import { db } from './db';
import { getProfile, listMeasurements, listSnapshots, getMeta, setMeta } from './repositories';
import { isRecalcDue, referenceWeight, goalReached } from '../domain/calc/recalc';
import { computeSummary, programWeek, toSnapshot } from '../domain/summary';
import { todayISO } from '../domain/dates';

/** Clés « méta » utilisées pour les cartes à afficher une seule fois. */
export const META = {
  pendingRecalc: 'pendingRecalcId',
  goalReachedAt: 'goalReachedAt',
  goalCelebrated: 'goalCelebrated'
} as const;

/**
 * Vérifie à l'ouverture et après chaque pesée :
 * - si l'objectif est atteint (passage en maintien) ;
 * - si un recalcul est dû (toutes les 4 semaines).
 */
export async function runChecks(today = todayISO()): Promise<void> {
  const p = await getProfile();
  if (!p) return;
  const ms = await listMeasurements();

  const reachedAt = await getMeta<string | null>(META.goalReachedAt, null);
  const reachedNow = goalReached(ms, p.targetWeightKg);
  if (reachedNow && !reachedAt) await setMeta(META.goalReachedAt, today);

  if (today < p.programStartDate) return;
  const snaps = await listSnapshots();
  const last = snaps[snaps.length - 1];
  const week = programWeek(p.programStartDate, today);
  if (!isRecalcDue(week, last, ms)) return;

  const ref = referenceWeight(ms) ?? p.startWeightKg;
  const sm = computeSummary(p, today, { weightKg: ref, goalReached: !!reachedAt || reachedNow });
  const id = await db.calcSnapshots.add(toSnapshot(sm, today));
  await setMeta(META.pendingRecalc, id);
}
