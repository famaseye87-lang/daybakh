import { db } from './db';
import type { Profile, Measurement, CalcSnapshot } from '../types';

export async function getProfile(): Promise<Profile | null> {
  return (await db.profile.get('me')) ?? null;
}

export async function saveProfile(p: Profile): Promise<void> {
  await db.profile.put({ ...p, updatedAt: new Date().toISOString() });
}

export async function addMeasurement(m: Measurement): Promise<number> {
  return db.measurements.add(m);
}

export async function listMeasurements(): Promise<Measurement[]> {
  return db.measurements.orderBy('date').toArray();
}

export async function addSnapshot(s: CalcSnapshot): Promise<number> {
  return db.calcSnapshots.add(s);
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const e = await db.meta.get(key);
  return e ? (e.value as T) : fallback;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
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
export async function completeOnboarding(
  p: Profile,
  first: Measurement,
  snapshot: CalcSnapshot
): Promise<void> {
  await db.transaction('rw', db.profile, db.measurements, db.calcSnapshots, db.meta, async () => {
    await db.profile.put(p);
    await db.measurements.add(first);
    await db.calcSnapshots.add(snapshot);
    await db.meta.put({ key: 'onboardedAt', value: new Date().toISOString() });
  });
}
