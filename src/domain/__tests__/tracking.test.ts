import { describe, it, expect } from 'vitest';
import { weekScore, waterGoalGlasses, scoreMessage } from '../tracking/score';
import { earnedBadges } from '../tracking/badges';
import { fitSize, photosToPurge, formatBytes } from '../tracking/photos';
import { buildWeek } from '../sport/week';
import { femme } from './fixtures';
import type { DailyLog, WorkoutLog } from '../../types';

const plan = buildWeek(femme);
const monday = '2026-11-30';

describe('Score de la semaine (§ G.3)', () => {
  it('objectif eau : 6 verres pour 1,5 L', () => {
    expect(waterGoalGlasses(1.5)).toBe(6);
  });
  it('semaine parfaite sans photo : 100', () => {
    const dates = ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06'];
    const l = dates.map((date) => ({ date, waterGlasses: 7, sleepHours: 5 }));
    const w: WorkoutLog[] = ['2026-11-30', '2026-12-02', '2026-12-04', '2026-12-05', '2026-12-06'].map((date) => ({ date, kind: 'A', minutes: 30 }));
    const s = weekScore({ monday, today: '2026-12-06', plan, logs: l, workouts: w, photos: [], waterGoal: 6 });
    expect(s.total).toBe(100);
    expect(s.meals).toBe(undefined);
  });
  it('mercredi matin, rien encore fait aujourd’hui : la journée en cours ne pénalise pas', () => {
    const l = ['2026-11-30', '2026-12-01'].map((date) => ({ date, waterGlasses: 6, sleepHours: 5 }));
    const w: WorkoutLog[] = [{ date: '2026-11-30', kind: 'A', minutes: 30 }];
    const s = weekScore({ monday, today: '2026-12-02', plan, logs: l, workouts: w, photos: [], waterGoal: 6 });
    expect(s.sessions).toEqual({ done: 1, planned: 1, points: 25 });
    expect(s.total).toBe(100);
  });
  it('profil créé un mercredi : lundi et mardi ne comptent pas', () => {
    const s = weekScore({ monday, today: '2026-12-02', since: '2026-12-02', plan, logs: [], workouts: [], photos: [], waterGoal: 6 });
    expect(s.total).toBe(null);
  });
  it('lundi matin : pas encore de score', () => {
    const s = weekScore({ monday, today: monday, plan, logs: [], workouts: [], photos: [], waterGoal: 6 });
    expect(s.total).toBe(null);
    expect(scoreMessage(null)).toContain('commence');
  });
  it('seuls les jours écoulés comptent (mercredi)', () => {
    const l = ['2026-11-30', '2026-12-01', '2026-12-02'].map((date) => ({ date, waterGlasses: 6, sleepHours: 5 }));
    const w: WorkoutLog[] = [{ date: '2026-11-30', kind: 'A', minutes: 30 }, { date: '2026-12-02', kind: 'B', minutes: 30 }];
    const s = weekScore({ monday, today: '2026-12-02', plan, logs: l, workouts: w, photos: [], waterGoal: 6 });
    expect(s.sessions).toEqual({ done: 2, planned: 2, points: 25 });
    expect(s.total).toBe(100);
  });
  it('un jour passé sans eau ni sommeil noté compte', () => {
    const s = weekScore({ monday, today: '2026-12-02', plan, logs: [{ date: monday, waterGlasses: 6, sleepHours: 5 }], workouts: [{ date: monday, kind: 'A', minutes: 30 }], photos: [], waterGoal: 6 });
    expect(s.water).toEqual({ days: 1, counted: 2, points: 13 });
    expect(s.total).toBe(Math.round(((25 + 12.5 + 12.5) / 75) * 100));
  });
  it('avec photos : seule la part repas compte un lundi matin', () => {
    const s = weekScore({
      monday, today: '2026-11-30', plan, logs: [{ date: monday, waterGlasses: 0 }], workouts: [],
      photos: [{ date: monday, meal: 'lunch', conformity: 'yes' }, { date: monday, meal: 'dinner', conformity: 'almost' }], waterGoal: 6
    });
    expect(s.meals?.pct).toBe(75);
    expect(s.total).toBe(75);
  });
  it('messages jamais culpabilisants', () => {
    expect(scoreMessage(10)).toContain('pas grave');
  });
});

describe('Badges', () => {
  const base = { today: '2026-12-20', startWeightKg: 82, plan, logs: [], measurements: [], photos: [], waterGoal: 6 };
  it('première séance et première mesure', () => {
    expect(earnedBadges({ ...base, workouts: [{ date: '2026-11-30', kind: 'A', minutes: 30 }], measurements: [{ date: '2026-11-24', weightKg: 82 }] }))
      .toEqual(['first-session', 'first-measure']);
  });
  it('semaine complète', () => {
    const w: WorkoutLog[] = ['2026-11-30', '2026-12-02', '2026-12-04', '2026-12-05', '2026-12-06'].map((date) => ({ date, kind: 'A', minutes: 30 }));
    expect(earnedBadges({ ...base, workouts: w })).toContain('full-week');
  });
  it('palier −5 % et reprise après une pause', () => {
    const b = earnedBadges({ ...base, measurements: [{ date: '2026-12-14', weightKg: 77.9 }], workouts: [{ date: '2026-11-30', kind: 'A', minutes: 30 }, { date: '2026-12-10', kind: 'B', minutes: 30 }] });
    expect(b).toContain('milestone-5');
    expect(b).toContain('comeback');
  });
  it('4 semaines d’eau consécutives', () => {
    const logs: DailyLog[] = [];
    for (let wk = 0; wk < 4; wk++) for (let d = 0; d < 5; d++) {
      const dt = new Date('2026-11-30T12:00:00'); dt.setDate(dt.getDate() + wk * 7 + d);
      logs.push({ date: dt.toISOString().slice(0, 10), waterGlasses: 6 });
    }
    expect(earnedBadges({ ...base, workouts: [], logs })).toContain('water-4w');
  });
});

describe('Photos (§ G.2)', () => {
  it('redimensionnement à 1280 px, sans agrandir', () => {
    expect(fitSize(4032, 3024)).toEqual({ width: 1280, height: 960 });
    expect(fitSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('au-delà de 8 semaines : proposé à la suppression', () => {
    const ph = [{ date: '2026-09-01' }, { date: '2026-10-05' }, { date: '2026-11-20' }];
    expect(photosToPurge(ph, '2026-11-30').map((p) => p.date)).toEqual(['2026-09-01']);
  });
  it('taille lisible', () => {
    expect(formatBytes(200 * 1024)).toBe('200 Ko');
    expect(formatBytes(3.5 * 1024 * 1024)).toBe('3,5 Mo');
  });
});
