import { describe, it, expect } from 'vitest';
import { buildBackup, parseBackup } from '../export/backup';
import { measurementsCsv, dailyCsv } from '../export/csv';
import { buildIcs } from '../export/ics';
import { femme } from './fixtures';

const parts = {
  profile: femme,
  measurements: [{ id: 1, date: '2026-11-24', weightKg: 82, waistCm: 95.5 }, { id: 2, date: '2026-12-07', weightKg: 81.2 }],
  dailyLogs: [{ date: '2026-12-01', waterGlasses: 6, sleepHours: 5.5, sleepQuality: 'interrupted' as const, energy: 3 as const }],
  workoutLogs: [{ id: 1, date: '2026-11-30', kind: 'A' as const, minutes: 32 }],
  calcSnapshots: [],
  shoppingLists: [],
  badges: [{ id: 'first-session', earnedAt: '2026-11-30' }],
  meta: [{ key: 'weekPlan', value: { 2: [] } }]
};

describe('Sauvegarde JSON', () => {
  it('aller-retour', () => {
    const text = JSON.stringify(buildBackup(parts, '2026-12-10T10:00:00Z'));
    const r = parseBackup(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary).toEqual({ exportedAt: '2026-12-10T10:00:00Z', from: '2026-11-24', to: '2026-12-07', measurements: 2, days: 1, workouts: 1 });
      expect(r.backup.profile.heightCm).toBe(165);
      expect(r.backup.meta[0].key).toBe('weekPlan');
    }
  });
  it('fichiers refusés avec un message clair', () => {
    expect(parseBackup('pas du json')).toEqual({ ok: false, error: 'Ce fichier n’est pas une sauvegarde Daybakh (format illisible).' });
    const other = parseBackup(JSON.stringify({ app: 'autre' }));
    expect(other.ok).toBe(false);
    const future = parseBackup(JSON.stringify({ ...buildBackup(parts, 'x'), exportVersion: 99 }));
    expect(future.ok === false && future.error.includes('plus récente')).toBe(true);
    const broken = parseBackup(JSON.stringify({ ...buildBackup(parts, 'x'), measurements: [{ date: '2026-12-01', weightKg: 'beaucoup' }] }));
    expect(broken.ok === false && broken.error.includes('measurements')).toBe(true);
  });
});

describe('CSV (Excel français)', () => {
  it('mesures : « ; », virgule décimale, BOM', () => {
    const csv = measurementsCsv(parts.measurements);
    expect(csv.startsWith('\uFEFFDate;Poids (kg)')).toBe(true);
    expect(csv).toContain('2026-11-24;82;95,5;');
    expect(csv.split('\r\n').length).toBe(4);
  });
  it('suivi quotidien avec séances', () => {
    const csv = dailyCsv(parts.dailyLogs, new Map([['2026-11-30', ['A']]]));
    expect(csv).toContain('2026-11-30;A;;;;;;');
    expect(csv).toContain('2026-12-01;;6;5,5;interrompue;3;;');
  });
});

describe('Rappels .ics', () => {
  const ics = buildIcs(
    [
      { id: 'pesee', title: 'Daybakh · ma mesure', description: 'Le matin, à jeun.', repeat: [1], time: '07:00', minutes: 10 },
      { id: 'seances', title: 'Daybakh · séance', description: 'Ta séance du jour', repeat: [1, 3, 6], time: '18:30', minutes: 40 },
      { id: 'export', title: 'Daybakh · sauvegarde', description: 'Exporte tes données', repeat: 'monthly', time: '10:00', minutes: 5 }
    ],
    '2026-11-25',
    new Date('2026-11-25T09:00:00Z')
  );
  it('format agenda valide', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(3);
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
  it('premières dates et répétitions', () => {
    expect(ics).toContain('DTSTART:20261130T070000'); // lundi suivant
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,SA');
    expect(ics).toContain('DTSTART:20261125T183000'); // mercredi = jour de séance
    expect(ics).toContain('DTSTART:20261201T100000');
    expect(ics).toContain('RRULE:FREQ=MONTHLY;BYMONTHDAY=1');
    expect(ics).toContain('DTEND:20261125T191000');
  });
});

import { parseMeasurementsCsv } from '../export/csv';
describe('Import CSV des mesures', () => {
  it('aller-retour avec l’export', () => {
    const r = parseMeasurementsCsv(measurementsCsv(parts.measurements));
    expect('measurements' in r && r.measurements).toEqual([
      { date: '2026-11-24', weightKg: 82, waistCm: 95.5, bellyCm: undefined, hipsCm: undefined, armRightCm: undefined, armLeftCm: undefined, thighCm: undefined },
      { date: '2026-12-07', weightKg: 81.2, waistCm: undefined, bellyCm: undefined, hipsCm: undefined, armRightCm: undefined, armLeftCm: undefined, thighCm: undefined }
    ]);
  });
  it('lignes invalides ignorées, mauvais format refusé', () => {
    const r = parseMeasurementsCsv('Date;Poids (kg)\n2026-12-01;80,5\n01/12/2026;80\n2026-12-08;beaucoup\n');
    expect('measurements' in r && r.measurements.length).toBe(1);
    expect('skipped' in r && r.skipped).toBe(2);
    expect(parseMeasurementsCsv('Nom;Age\nA;3')).toEqual({ error: 'Ce CSV n’a pas le format des mesures Daybakh (colonnes « Date » et « Poids (kg) »).' });
  });
});
