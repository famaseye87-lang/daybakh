import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { META } from '../data/recalcService';
import { currentSummary, type Summary } from '../domain/summary';
import { useToday } from './useToday';
import type { Profile, Measurement, CalcSnapshot } from '../types';

export interface AppData {
  profile: Profile;
  measurements: Measurement[];
  snapshots: CalcSnapshot[];
  goalReachedAt: string | null;
  goalCelebrated: boolean;
  pendingRecalcId: number | null;
  summary: Summary;
  today: string;
}

/** Données courantes de l'application, mises à jour en direct depuis IndexedDB. */
export function useAppData(profile: Profile): AppData | undefined {
  const today = useToday();
  const data = useLiveQuery(async () => {
    const [measurements, snapshots, metas] = await Promise.all([
      db.measurements.orderBy('date').toArray(),
      db.calcSnapshots.orderBy('date').toArray(),
      db.meta.bulkGet([META.goalReachedAt, META.goalCelebrated, META.pendingRecalc])
    ]);
    return { measurements, snapshots, metas };
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
    summary: currentSummary(profile, today, {
      lastSnapshotWeight: last?.refWeightKg,
      goalReached: !!goalReachedAt,
      waistCm: lastWaist
    }),
    today
  };
}
