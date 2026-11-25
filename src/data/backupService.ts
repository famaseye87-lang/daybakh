import { db } from './db';
import { buildBackup, type Backup } from '../domain/export/backup';
import { measurementsCsv, dailyCsv } from '../domain/export/csv';
import type { Measurement } from '../types';
import { shareOrDownload } from './files';

export const LAST_EXPORT_KEY = 'lastExportAt';

/** Sauvegarde complète en JSON (sans les photos, exportées à part en ZIP). */
export async function exportJson(today: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const profile = await db.profile.get('me');
  if (!profile) return 'cancelled';
  const backup = buildBackup(
    {
      profile,
      measurements: await db.measurements.toArray(),
      dailyLogs: await db.dailyLogs.toArray(),
      workoutLogs: await db.workoutLogs.toArray(),
      calcSnapshots: await db.calcSnapshots.toArray(),
      shoppingLists: await db.shoppingLists.toArray(),
      badges: await db.badges.toArray(),
      meta: (await db.meta.toArray()).filter((m) => m.key !== LAST_EXPORT_KEY)
    },
    new Date().toISOString()
  );
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const r = await shareOrDownload(blob, `daybakh-sauvegarde-${today}.json`);
  if (r !== 'cancelled') await db.meta.put({ key: LAST_EXPORT_KEY, value: today });
  return r;
}

export async function exportCsv(kind: 'mesures' | 'suivi', today: string): Promise<void> {
  let text: string;
  if (kind === 'mesures') text = measurementsCsv(await db.measurements.toArray());
  else {
    const byDate = new Map<string, string[]>();
    for (const w of await db.workoutLogs.toArray()) byDate.set(w.date, [...(byDate.get(w.date) ?? []), w.kind]);
    text = dailyCsv(await db.dailyLogs.toArray(), byDate);
  }
  await shareOrDownload(new Blob([text], { type: 'text/csv;charset=utf-8' }), `daybakh-${kind}-${today}.csv`);
}

/** Remplace les données de ce téléphone par la sauvegarde (les photos déjà présentes sont conservées). */
export async function importBackup(b: Backup, today: string): Promise<void> {
  await db.transaction('rw', [db.profile, db.measurements, db.dailyLogs, db.workoutLogs, db.calcSnapshots, db.shoppingLists, db.badges, db.meta], async () => {
    await Promise.all([db.profile, db.measurements, db.dailyLogs, db.workoutLogs, db.calcSnapshots, db.shoppingLists, db.badges, db.meta].map((t) => t.clear()));
    await db.profile.put(b.profile);
    await db.measurements.bulkPut(b.measurements);
    await db.dailyLogs.bulkPut(b.dailyLogs);
    await db.workoutLogs.bulkPut(b.workoutLogs);
    await db.calcSnapshots.bulkPut(b.calcSnapshots);
    await db.shoppingLists.bulkPut(b.shoppingLists as never[]);
    await db.badges.bulkPut(b.badges);
    await db.meta.bulkPut(b.meta.filter((m) => m.key !== 'newBadges' && m.key !== 'pendingRecalcId'));
    await db.meta.put({ key: LAST_EXPORT_KEY, value: today });
  });
}

/** Statut du stockage persistant (le navigateur s'engage à ne pas effacer les données). */
export async function persistStatus(): Promise<boolean | undefined> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : undefined;
  } catch {
    return undefined;
  }
}

/** Ajoute des mesures importées depuis un CSV ; une date déjà présente n'est pas dupliquée. */
export async function importMeasurements(ms: Measurement[]): Promise<{ added: number; existing: number }> {
  const have = new Set((await db.measurements.toArray()).map((m) => m.date));
  const fresh = ms.filter((m) => !have.has(m.date));
  await db.measurements.bulkPut(fresh);
  return { added: fresh.length, existing: ms.length - fresh.length };
}
