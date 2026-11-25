import { db } from './db';
import type { DailyLog } from '../types';

/** Met à jour le suivi d'un jour (crée la ligne si besoin). */
export async function patchDailyLog(date: string, patch: Partial<Omit<DailyLog, 'date'>>): Promise<void> {
  await db.transaction('rw', db.dailyLogs, async () => {
    const cur = (await db.dailyLogs.get(date)) ?? { date, waterGlasses: 0 };
    await db.dailyLogs.put({ ...cur, ...patch, date });
  });
}
