import { z } from 'zod';
import type { Profile, Measurement, DailyLog, WorkoutLog, CalcSnapshot, MetaEntry } from '../../types';

export const EXPORT_VERSION = 1;

/** Contenu d'une sauvegarde (photos exclues : elles ont leur propre export ZIP). */
export interface Backup {
  app: 'daybakh';
  exportVersion: number;
  exportedAt: string;
  profile: Profile;
  measurements: Measurement[];
  dailyLogs: DailyLog[];
  workoutLogs: WorkoutLog[];
  calcSnapshots: CalcSnapshot[];
  shoppingLists: unknown[];
  badges: { id: string; earnedAt: string }[];
  meta: MetaEntry[];
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'date attendue au format AAAA-MM-JJ');

/** Schéma de validation à l'import : souple sur les champs, strict sur l'essentiel. */
const schema = z.object({
  app: z.literal('daybakh'),
  exportVersion: z.number().int().min(1).max(EXPORT_VERSION),
  exportedAt: z.string(),
  profile: z.object({
    id: z.literal('me'),
    sex: z.enum(['F', 'M']),
    birthDate: date,
    heightCm: z.number().min(100).max(250),
    startWeightKg: z.number().min(25).max(350),
    programStartDate: date
  }).passthrough(),
  measurements: z.array(z.object({ date, weightKg: z.number().min(25).max(350) }).passthrough()),
  dailyLogs: z.array(z.object({ date, waterGlasses: z.number().min(0) }).passthrough()),
  workoutLogs: z.array(z.object({ date, kind: z.string(), minutes: z.number().min(0) }).passthrough()),
  calcSnapshots: z.array(z.object({ date }).passthrough()),
  shoppingLists: z.array(z.unknown()),
  badges: z.array(z.object({ id: z.string(), earnedAt: z.string() })),
  meta: z.array(z.object({ key: z.string(), value: z.unknown() }))
});

export function buildBackup(parts: Omit<Backup, 'app' | 'exportVersion' | 'exportedAt'>, now: string): Backup {
  return { app: 'daybakh', exportVersion: EXPORT_VERSION, exportedAt: now, ...parts };
}

export interface BackupSummary {
  exportedAt: string;
  from?: string;
  to?: string;
  measurements: number;
  days: number;
  workouts: number;
}

/** Lit et vérifie un fichier de sauvegarde. Renvoie un message clair si le fichier n'est pas valide. */
export function parseBackup(text: string): { ok: true; backup: Backup; summary: BackupSummary } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Ce fichier n’est pas une sauvegarde Daybakh (format illisible).' };
  }
  const r = schema.safeParse(raw);
  if (!r.success) {
    const first = r.error.issues[0];
    if (first?.path[0] === 'app') return { ok: false, error: 'Ce fichier ne vient pas de Daybakh.' };
    if (first?.path[0] === 'exportVersion') return { ok: false, error: 'Cette sauvegarde vient d’une version plus récente de Daybakh : mets l’application à jour avant d’importer.' };
    return { ok: false, error: `Sauvegarde incomplète ou abîmée (${first?.path.join('.') || 'contenu'}).` };
  }
  const b = r.data as unknown as Backup;
  const dates = [...b.measurements.map((m) => m.date), ...b.dailyLogs.map((l) => l.date), ...b.workoutLogs.map((w) => w.date)].sort();
  return {
    ok: true,
    backup: b,
    summary: {
      exportedAt: b.exportedAt,
      from: dates[0],
      to: dates[dates.length - 1],
      measurements: b.measurements.length,
      days: b.dailyLogs.length,
      workouts: b.workoutLogs.length
    }
  };
}
