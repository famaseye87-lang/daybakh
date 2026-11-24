import { describe, it, expect } from 'vitest';
import { referenceWeight, isRecalcDue, goalReached, mondayOf, measuredThisWeek } from '../calc/recalc';
import { deltas, goalProgress } from '../calc/progress';
import type { Measurement } from '../../types';

const ms: Measurement[] = [
  { id: 1, date: '2026-11-24', weightKg: 82, waistCm: 95 },
  { id: 2, date: '2026-12-07', weightKg: 81.2 },
  { id: 3, date: '2026-12-14', weightKg: 80.6, waistCm: 93 }
];

describe('Recalcul toutes les 4 semaines', () => {
  it('poids de référence = moyenne des 2 dernières pesées', () => {
    expect(referenceWeight(ms)).toBe(80.9);
    expect(referenceWeight([ms[0]])).toBe(82);
    expect(referenceWeight([])).toBe(undefined);
  });
  it('dû en semaine 5 après le calcul de la semaine 1, si pesée récente', () => {
    const last = { weekIndex: 1, date: '2026-11-24' };
    expect(isRecalcDue(4, last, ms)).toBe(false);
    expect(isRecalcDue(5, last, ms)).toBe(true);
    expect(isRecalcDue(5, last, [ms[0]])).toBe(false); // aucune pesée depuis
  });
  it('objectif atteint sur 2 pesées consécutives', () => {
    expect(goalReached(ms, 80.6)).toBe(false);
    expect(goalReached(ms, 81.2)).toBe(true);
    expect(goalReached(ms, undefined)).toBe(false);
  });
});

describe('Semaine de mesure', () => {
  it('lundi de la semaine', () => {
    expect(mondayOf('2026-11-24')).toBe('2026-11-23');
    expect(mondayOf('2026-11-30')).toBe('2026-11-30');
    expect(mondayOf('2026-12-06')).toBe('2026-11-30');
  });
  it('mesure faite cette semaine', () => {
    expect(measuredThisWeek(ms, '2026-12-16')).toBe(true);
    expect(measuredThisWeek(ms, '2026-12-21')).toBe(false);
  });
});

describe('Écarts', () => {
  it('poids et tour de taille vs précédente et départ', () => {
    const d = deltas(ms);
    const w = d.find((x) => x.key === 'weightKg')!;
    expect(w.current).toBe(80.6);
    expect(w.vsPrevious).toBe(-0.6);
    expect(w.vsStart).toBe(-1.4);
    expect(w.vsStartPct).toBe(-1.7);
    const t = d.find((x) => x.key === 'waistCm')!;
    expect(t.vsPrevious).toBe(-2); // vs la dernière mesure de taille, pas la pesée précédente
    expect(d.find((x) => x.key === 'hipsCm')).toBe(undefined);
  });
  it('progression vers l’objectif', () => {
    expect(goalProgress(82, 82, 66)).toBe(0);
    expect(goalProgress(82, 74, 66)).toBe(0.5);
    expect(goalProgress(82, 60, 66)).toBe(1);
  });
});

import { currentSummary, summaryChanges, toSnapshot } from '../summary';
import { femme } from './fixtures';
describe('Repères courants', () => {
  it('utilise le poids du dernier recalcul', () => {
    const s = currentSummary(femme, '2026-12-28', { lastSnapshotWeight: 79 });
    expect(s.weightKg).toBe(79);
    expect(s.week).toBe(5);
  });
  it('avant le démarrage : calcule comme en semaine 1', () => {
    expect(currentSummary(femme, '2026-11-24').week).toBe(1);
  });
  it('maintien après objectif atteint', () => {
    expect(currentSummary(femme, '2027-03-01', { goalReached: true }).intake.mode).toBe('maintenance');
  });
  it('liste uniquement ce qui change', () => {
    const a = currentSummary(femme, '2026-12-28');
    const b = currentSummary(femme, '2026-12-28', { lastSnapshotWeight: 79 });
    const labels = summaryChanges(a, b).map((l) => l.label);
    expect(labels).toContain('Repère calorique');
    expect(labels.includes('Niveau d’activité')).toBe(false);
    expect(summaryChanges(a, a).length).toBe(0);
  });
  it('instantané', () => {
    const snap = toSnapshot(currentSummary(femme, '2026-12-28'), '2026-12-28');
    expect(snap.weekIndex).toBe(5);
    expect(snap.targetKcal).toBe(1910);
  });
});
