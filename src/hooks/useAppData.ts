import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { META } from '../data/recalcService';
import { currentSummary, type Summary } from '../domain/summary';
import { useToday } from './useToday';
import type { WeekOverride } from '../domain/sport/types';
import type { Profile, Measurement, CalcSnapshot, DailyLog, WorkoutLog, MealTag } from '../types';

export interface AppData {
  profile: Profile;
  measurements: Measurement[];
  snapshots: CalcSnapshot[];
  goalReachedAt: string | null;
  goalCelebrated: boolean;
  pendingRecalcId: number | null;
  dailyLogs: DailyLog[];
  workoutLogs: WorkoutLog[];
  /** Métadonnées des photos (sans les images) */
  mealRatings: { date: string; meal: MealTag; conformity?: 'yes' | 'almost' | 'no' }[];
  /** Clés des alertes déjà lues (alert:<type>:<semaine>) */
  dismissedAlerts: Set<string>;
  /** Semaine de sport modifiée par l'utilisatrice */
  weekOverride?: WeekOverride;
  /** Semaines « répétées » pour rester plus longtemps sur un bloc */
  sportWeekOffset: number;
  summary: Summary;
  today: string;
}

/** Données courantes de l'application, mises à jour en direct depuis IndexedDB. */
export function useAppData(profile: Profile): AppData | undefined {
  const today = useToday();
  const data = useLiveQuery(async () => {
    const [measurements, snapshots, metas, dailyLogs, workoutLogs, photos, allMeta] = await Promise.all([
      db.measurements.orderBy('date').toArray(),
      db.calcSnapshots.orderBy('date').toArray(),
      db.meta.bulkGet([META.goalReachedAt, META.goalCelebrated, META.pendingRecalc]),
      db.dailyLogs.orderBy('date').toArray(),
      db.workoutLogs.orderBy('date').toArray(),
      db.mealPhotos.orderBy('date').toArray(),
      db.meta.toArray()
    ]);
    const mealRatings = photos.map((ph) => ({ date: ph.date, meal: ph.meal, conformity: ph.conformity }));
    const dismissed = allMeta.filter((m) => m.key.startsWith('alert:')).map((m) => m.key);
    const metaValue = (k: string) => allMeta.find((m) => m.key === k)?.value;
    return {
      measurements, snapshots, metas, dailyLogs, workoutLogs, mealRatings, dismissed,
      weekOverride: metaValue('weekPlan') as WeekOverride | undefined,
      sportWeekOffset: (metaValue('sportWeekOffset') as number | undefined) ?? 0
    };
  }, []);
  if (!data) return undefined;
  const [reached, celebrated, pending] = data.metas;
  const last = data.snapshots[data.snapshots.length - 1];
  const lastWaist = [...data.measurements].reverse().find((m) => m.waistCm)?.waistCm;
  const goalReachedAt = (reached?.value as string | undefined) ?? null;
  return {
    profile,
    measurements: data.measurements,
    snapshots: data.snapshots,
    goalReachedAt,
    goalCelebrated: !!celebrated?.value,
    pendingRecalcId: (pending?.value as number | undefined) ?? null,
    dailyLogs: data.dailyLogs,
    workoutLogs: data.workoutLogs,
    mealRatings: data.mealRatings,
    dismissedAlerts: new Set(data.dismissed),
    weekOverride: data.weekOverride,
    sportWeekOffset: data.sportWeekOffset,
    summary: currentSummary(profile, today, {
      lastSnapshotWeight: last?.refWeightKg,
      goalReached: !!goalReachedAt,
      waistCm: lastWaist
    }),
    today
  };
}
