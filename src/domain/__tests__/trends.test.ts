import { describe, it, expect } from 'vitest';
import { weeklyMeasure, weeklyChanges, fastLossAlert, plateauAlert, weeklySleep, weeklyMealConformity, lastWeeks, weeklySessions } from '../calc/trends';
import type { Measurement, MealPhoto } from '../../types';

const m = (date: string, weightKg: number, extra: Partial<Measurement> = {}): Measurement => ({ date, weightKg, ...extra });

describe('Séries hebdomadaires', () => {
  it('garde la dernière mesure de chaque semaine', () => {
    const w = weeklyMeasure([m('2026-11-30', 82), m('2026-12-03', 81.6), m('2026-12-07', 81)], 'weightKg');
    expect(w).toEqual([{ week: '2026-11-30', value: 81.6 }, { week: '2026-12-07', value: 81 }]);
  });
  it('variation ramenée à 1 semaine en cas de trou', () => {
    const ch = weeklyChanges([{ week: '2026-11-30', value: 80 }, { week: '2026-12-14', value: 79.2 }]);
    expect(ch[0].change).toBeCloseTo(-0.005, 5);
  });
});

describe('Alertes (§ D)', () => {
  it('perte rapide : > 1 %/semaine pendant 2 semaines', () => {
    const w = weeklyMeasure([m('2026-11-30', 82), m('2026-12-07', 81), m('2026-12-14', 80)], 'weightKg');
    expect(fastLossAlert(w)).toBe(true);
    const w2 = weeklyMeasure([m('2026-11-30', 82), m('2026-12-07', 81), m('2026-12-14', 80.5)], 'weightKg');
    expect(fastLossAlert(w2)).toBe(false);
  });
  it('stagnation : ± 0,2 %/semaine pendant 3 semaines consécutives', () => {
    const w = weeklyMeasure([m('2026-11-30', 80), m('2026-12-07', 80.1), m('2026-12-14', 80), m('2026-12-21', 79.95)], 'weightKg');
    expect(plateauAlert(w)).toBe(true);
    const w2 = weeklyMeasure([m('2026-11-30', 80), m('2026-12-07', 79.5), m('2026-12-14', 79.5), m('2026-12-21', 79.45)], 'weightKg');
    expect(plateauAlert(w2)).toBe(false);
    const gap = weeklyMeasure([m('2026-11-30', 80), m('2026-12-14', 80), m('2026-12-21', 80), m('2026-12-28', 80)], 'weightKg');
    expect(plateauAlert(gap)).toBe(false); // 4 semaines, pas 3 consécutives
  });
});

describe('Sommeil, séances, repas', () => {
  it('sommeil moyen par semaine', () => {
    expect(weeklySleep([
      { date: '2026-11-30', waterGlasses: 0, sleepHours: 5 },
      { date: '2026-12-01', waterGlasses: 0, sleepHours: 6 },
      { date: '2026-12-02', waterGlasses: 0 }
    ])).toEqual([{ week: '2026-11-30', value: 5.5 }]);
  });
  it('séances par semaine', () => {
    expect(weeklySessions([{ date: '2026-11-30', kind: 'A', minutes: 35 }, { date: '2026-12-04', kind: 'swim', minutes: 120 }])).toEqual([{ week: '2026-11-30', value: 2 }]);
  });
  it('repas conformes : oui 1, à peu près ½, repas libre exclu', () => {
    const p = (meal: MealPhoto['meal'], conformity: MealPhoto['conformity']) =>
      ({ date: '2026-12-01', meal, conformity } as MealPhoto);
    expect(weeklyMealConformity([p('lunch', 'yes'), p('dinner', 'almost'), p('breakfast', 'no'), p('free', 'no')])).toEqual([{ week: '2026-11-30', value: 50 }]);
  });
  it('filtre sur les N dernières semaines', () => {
    const pts = [{ week: '2026-11-02', value: 1 }, { week: '2026-11-30', value: 2 }, { week: '2026-12-07', value: 3 }];
    expect(lastWeeks(pts, 4, '2026-12-09').map((x) => x.value)).toEqual([2, 3]);
    expect(lastWeeks(pts, 'all', '2026-12-09').length).toBe(3);
  });
});
