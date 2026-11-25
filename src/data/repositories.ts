import { db } from './db';
import type { Profile, Measurement, CalcSnapshot } from '../types';

export async function getProfile(): Promise<Profile | null> {
  try {
    return (await db.profile.get('me')) ?? null;
  } catch {
    // Base indisponible (navigation privée stricte, données de sites bloquées) : on affiche l'accueil avec un avertissement.
    return null;
  }
}

export async function saveProfile(p: Profile): Promise<void> {
  await db.profile.put({ ...p, updatedAt: new Date().toISOString() });
}

export async function listMeasurements(): Promise<Measurement[]> {
  return db.measurements.orderBy('date').toArray();
}

export async function saveMeasurement(m: Measurement): Promise<number> {
  return db.measurements.put(m);
}

export async function deleteMeasurement(id: number): Promise<void> {
  await db.measurements.delete(id);
}

export async function listSnapshots(): Promise<CalcSnapshot[]> {
  return db.calcSnapshots.orderBy('date').toArray();
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const e = await db.meta.get(key);
  return e ? (e.value as T) : fallback;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}

export async function deleteMeta(key: string): Promise<void> {
  await db.meta.delete(key);
}

/** Demande au navigateur de ne pas effacer les données (utile sur iPhone). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* navigateur sans support : sans conséquence */
  }
  return false;
}

/** Enregistre le profil, la première mesure et le premier calcul en une transaction. */
export async function completeOnboarding(p: Profile, first: Measurement, snapshot: CalcSnapshot): Promise<void> {
  await db.transaction('rw', db.profile, db.measurements, db.calcSnapshots, db.meta, async () => {
    await db.profile.put(p);
    await db.measurements.add(first);
    await db.calcSnapshots.add(snapshot);
    await db.meta.put({ key: 'onboardedAt', value: new Date().toISOString() });
  });
}

/** Efface toutes les données Daybakh de ce téléphone. */
export async function resetAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
}
