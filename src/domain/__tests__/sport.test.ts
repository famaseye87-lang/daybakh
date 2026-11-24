import { describe, it, expect } from 'vitest';
import { buildWeek, isoWeekday, isSportDay } from '../sport/week';
import { blockForWeek, circuitParams, isDeloadWeek, hiitAllowed } from '../sport/progression';
import { planExercises, buildTimeline, applyPostpartumLock, exerciseById, EXERCISES, hiitTreadmillTimeline } from '../sport/session';
import { walkTarget, swimPlan } from '../sport/walkswim';
import { femme } from './fixtures';

describe('Semaine type (§ F.1)', () => {
  const w = buildWeek(femme);
  it('lundi A, mercredi B, samedi C, vendredi natation, dimanche marche, mardi/jeudi repos', () => {
    expect(w.map((d) => d.items.map((i) => i.kind).join('+'))).toEqual(['A', 'rest', 'B', 'rest', 'swim', 'C', 'walk']);
    expect(w[4].items[0].minutes).toBe(120);
  });
  it('jours de sport : 5 (dont natation et marche)', () => {
    expect(w.filter(isSportDay).length).toBe(5);
  });
  it('semaine modifiée par l’utilisatrice', () => {
    const o = buildWeek(femme, { 2: [{ kind: 'walk', minutes: 30 }], 6: [] });
    expect(o[1].items[0].kind).toBe('walk');
    expect(o[5].items[0].kind).toBe('rest');
  });
  it('jour ISO', () => {
    expect(isoWeekday('2026-11-30')).toBe(1);
    expect(isoWeekday('2026-12-06')).toBe(7);
  });
});

describe('Progression sur 24 semaines (§ F.4)', () => {
  it('blocs', () => {
    expect(blockForWeek(1).block).toBe(1);
    expect(blockForWeek(9).level).toBe('intermediate');
    expect(blockForWeek(30).block).toBe(7);
  });
  it('semaine allégée toutes les 4 semaines (hors démarrage)', () => {
    expect(isDeloadWeek(4)).toBe(false);
    expect(isDeloadWeek(8)).toBe(true);
    expect(circuitParams(8).rounds).toBe(2);
    expect(circuitParams(7).rounds).toBe(3);
  });
  it('HIIT : dès la semaine 5 et seulement après une nuit ≥ 6 h', () => {
    expect(hiitAllowed(4, 7)).toBe(false);
    expect(hiitAllowed(5, 5)).toBe(false);
    expect(hiitAllowed(5, 6)).toBe(true);
    expect(hiitAllowed(5, undefined)).toBe(false);
  });
});

describe('Séances', () => {
  it('toutes les références d’exercices existent', () => {
    for (const k of ['A', 'B', 'C', 'hiit'] as const) {
      expect(planExercises(k, circuitParams(1), false).every((p) => !!p.exercise)).toBe(true);
    }
    for (const e of EXERCISES) if (e.substitute) expect(!!exerciseById(e.substitute)).toBe(true);
  });
  it('bloc 5 : versions avancées sur la moitié des exercices', () => {
    const p = planExercises('B', circuitParams(17), false);
    expect(p.filter((x) => x.level === 'advanced').length).toBe(3);
  });
  it('verrou post-partum : hollow body remplacé, planche limitée à la version facile', () => {
    const h = applyPostpartumLock(exerciseById('hollow')!, 'intermediate', true);
    expect(h.exercise.id).toBe('deadbug');
    expect(h.replacedFrom).toBe('Hollow body adapté');
    expect(applyPostpartumLock(exerciseById('planche')!, 'advanced', true).level).toBe('easy');
    expect(applyPostpartumLock(exerciseById('planche')!, 'advanced', false).level).toBe('advanced');
  });
  it('déroulé : semaine 1, 35 min → 2 tours, durée ≤ 35 min', () => {
    const p = circuitParams(1);
    const t = buildTimeline(planExercises('A', p, false), p, 35);
    expect(t.rounds).toBe(2);
    expect(t.totalSeconds).toBeLessThan(35 * 60 + 1);
    expect(t.steps[0].type).toBe('warmup');
    expect(t.steps[t.steps.length - 1].type).toBe('cooldown');
    expect(t.steps.filter((s) => s.type === 'work').length).toBe(12);
  });
  it('séance courte : 25 min maximum', () => {
    const p = circuitParams(21);
    const t = buildTimeline(planExercises('C', p, false), p, 40, { short: true });
    expect(t.totalSeconds).toBeLessThan(25 * 60 + 1);
  });
  it('HIIT tapis : 8 intervalles', () => {
    expect(hiitTreadmillTimeline().steps.filter((s) => s.type === 'work').length).toBe(8);
  });
});

describe('Marche et natation', () => {
  it('marche : durée puis allure puis pente', () => {
    expect(walkTarget(1)).toMatchObject({ focus: 'durée', minutes: 45 });
    expect(walkTarget(4).minutes).toBe(60);
    expect(walkTarget(7)).toMatchObject({ focus: 'allure', speedKmh: 4.9 });
    expect(walkTarget(13)).toMatchObject({ focus: 'pente', inclinePct: 1 });
    expect(walkTarget(40).inclinePct).toBe(6);
  });
  it('natation : 2 h, brasse/dos en alternance', () => {
    const s1 = swimPlan(1);
    expect(s1.totalMinutes).toBe(120);
    expect(s1.parts[2].content.startsWith('Brasse')).toBe(true);
    expect(swimPlan(2).parts[2].content.startsWith('Dos')).toBe(true);
  });
});
