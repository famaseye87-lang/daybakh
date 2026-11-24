import { describe, it, expect } from 'vitest';
import { bmi, bmiCategory, healthyRange, firstMilestone, whtr, ageOn, monthsBetween, isTargetInHealthyRange } from '../calc/body';
import { bmrMifflin, napFromMinutes, deficitRate, phaseForWeek, waterTargetL } from '../calc/energy';
import { proteinRange } from '../calc/protein';
import { etaWeeks, expectedWeeklyRate } from '../calc/rate';
import { deficitEligibility } from '../guards';
import { computeSummary, programWeek } from '../summary';
import { femme, homme, limite, plancher, make } from './fixtures';

const S1 = '2026-11-30'; // semaine 1 du programme
const S5 = '2026-12-28'; // semaine 5

describe('Formules de base', () => {
  it('IMC = poids / taille²', () => {
    expect(bmi(82, 165)).toBeCloseTo(30.12, 2);
    expect(bmi(95, 180)).toBeCloseTo(29.32, 2);
  });
  it('catégories OMS aux bornes', () => {
    expect(bmiCategory(18.49).key).toBe('underweight');
    expect(bmiCategory(18.5).key).toBe('normal');
    expect(bmiCategory(24.99).key).toBe('normal');
    expect(bmiCategory(25).key).toBe('overweight');
    expect(bmiCategory(30).key).toBe('obesity1');
    expect(bmiCategory(35).key).toBe('obesity2');
    expect(bmiCategory(40).key).toBe('obesity3');
  });
  it('plage de poids santé (IMC 18,5–24,9)', () => {
    expect(healthyRange(165)).toEqual({ min: 50.4, max: 67.8 });
    expect(isTargetInHealthyRange(68, 165)).toBe(false);
    expect(isTargetInHealthyRange(67, 165)).toBe(true);
  });
  it('premier palier −5 à −10 %', () => {
    expect(firstMilestone(82)).toEqual({ from: 77.9, to: 73.8 });
  });
  it('rapport tour de taille / taille', () => {
    expect(whtr(80, 165).status).toBe('healthy');
    expect(whtr(90, 165).status).toBe('watch');
    expect(whtr(100, 165).status).toBe('takeAction');
  });
  it('Mifflin-St Jeor femme et homme', () => {
    expect(bmrMifflin('F', 82, 165, 39)).toBeCloseTo(1495.25, 2);
    expect(bmrMifflin('M', 95, 180, 45)).toBeCloseTo(1855, 2);
  });
  it('NAP depuis les minutes (EFSA + convention)', () => {
    expect(napFromMinutes(60)).toBe(1.4);
    expect(napFromMinutes(275)).toBe(1.6);
    expect(napFromMinutes(400)).toBe(1.8);
    expect(napFromMinutes(600)).toBe(2.0);
  });
  it('phases et déficits', () => {
    expect(phaseForWeek(1)).toBe('start');
    expect(phaseForWeek(5)).toBe('loss');
    expect(phaseForWeek(13)).toBe('consolidation');
    expect(phaseForWeek(25)).toBe('maintenance');
    expect(deficitRate('normal', 2)).toBe(0.15);
    expect(deficitRate('normal', 6)).toBe(0.2);
    expect(deficitRate('soft', 6)).toBe(0.15);
    expect(deficitRate('normal', 30)).toBe(0);
  });
  it('âges', () => {
    expect(ageOn('1987-03-10', '2026-11-24')).toBe(39);
    expect(ageOn('2009-11-25', '2026-11-24')).toBe(16);
    expect(monthsBetween('2026-01-14', '2026-11-24')).toBe(10);
  });
  it('rythme et date estimée', () => {
    expect(expectedWeeklyRate(5)).toEqual({ min: 0.005, max: 0.005, shortSleep: true });
    expect(expectedWeeklyRate(7).max).toBe(0.01);
    expect(etaWeeks(82, 68, 0.005)).toBeCloseTo(37.35, 1);
    expect(etaWeeks(70, 72, 0.005)).toBe(0);
  });
  it('hydratation', () => {
    expect(waterTargetL('no')).toEqual({ min: 1.5, max: 2 });
    expect(waterTargetL('partial').min).toBeCloseTo(2.2, 5);
  });
});

describe('Profil 1 — femme 39 ans, 165 cm, 82 kg, sommeil 5 h', () => {
  it('semaine 1 : déficit doux 15 %', () => {
    const s = computeSummary(femme, S1);
    expect(s.week).toBe(1);
    expect(s.activityMinutes).toBe(275);
    expect(s.nap).toBe(1.6);
    expect(s.tdee).toBeCloseTo(2392.4, 1);
    expect(s.intake.mode).toBe('loss');
    expect(s.intake.deficit).toBe(0.15);
    expect(s.intake.kcal).toBe(2030); // 2392,4 × 0,85 = 2033,5 → 2030
  });
  it('semaine 5 : déficit normal 20 %', () => {
    const s = computeSummary(femme, S5);
    expect(s.week).toBe(5);
    expect(s.intake.kcal).toBe(1910); // 2392,4 × 0,8 = 1913,9 → 1910
  });
  it('protéines sur le poids à IMC 25 (IMC > 30)', () => {
    const s = computeSummary(femme, S1);
    expect(s.protein.refWeight).toBeCloseTo(68.1, 1);
    expect(s.protein.min).toBe(82);
    expect(s.protein.max).toBe(109);
  });
  it('sommeil court : date estimée au rythme 0,5 %', () => {
    const s = computeSummary(femme, S1);
    expect(s.shortSleep).toBe(true);
    expect(s.eta?.minWeeks).toBe(38);
    expect(s.eta?.maxWeeks).toBe(38);
  });
});

describe('Profil 2 — homme 45 ans, 180 cm, 95 kg', () => {
  it('surpoids, NAP 1,4, déficit 20 % en semaine 5', () => {
    const s = computeSummary(homme, S5);
    expect(s.bmiCategory.key).toBe('overweight');
    expect(s.nap).toBe(1.4);
    expect(s.tdee).toBeCloseTo(2597, 1);
    expect(s.intake.kcal).toBe(2080);
    expect(s.intake.floorApplied).toBe(false);
  });
  it('protéines sur le poids actuel (IMC < 30)', () => {
    expect(proteinRange(95, 180)).toEqual({ min: 114, max: 152, target: 133, refWeight: 95 });
  });
  it('fourchette de date (sommeil 7 h)', () => {
    const s = computeSummary(homme, S5);
    expect(s.eta?.minWeeks).toBe(18); // 1 %/sem
    expect(s.eta?.maxWeeks).toBe(35); // 0,5 %/sem
  });
});

describe('Profil 3 — IMC en limite de plage (160 cm)', () => {
  it('47,5 kg → IMC 18,55 : déficit autorisé', () => {
    const s = computeSummary(limite(47.5), S5);
    expect(s.bmi).toBeCloseTo(18.55, 2);
    expect(s.eligibility.deficitAllowed).toBe(true);
    expect(s.intake.mode).toBe('loss');
  });
  it('47 kg → IMC 18,36 : aucun déficit', () => {
    const s = computeSummary(limite(47), S5);
    expect(s.bmi).toBeCloseTo(18.36, 2);
    expect(s.eligibility.blocked).toContain('lowBmi');
    expect(s.intake.mode).toBe('blocked');
    expect(s.intake.deficit).toBe(0);
  });
});

describe('Garde-fous', () => {
  it('plancher 1 200 kcal pour une femme', () => {
    const s = computeSummary(plancher, S5);
    expect(s.tdee).toBeCloseTo(1437.1, 1);
    expect(s.intake.kcal).toBe(1200);
    expect(s.intake.floorApplied).toBe(true);
  });
  it('plancher 1 500 kcal pour un homme', () => {
    const s = computeSummary(make({ sex: 'M', birthDate: '1950-01-01', heightCm: 155, startWeightKg: 60, homeWorkoutDays: [], fixedActivities: [] }), S5);
    expect(s.intake.kcal).toBe(1500);
    expect(s.intake.floorApplied).toBe(true);
  });
  it('moins de 18 ans : bloqué', () => {
    const e = deficitEligibility({ age: 17, bmi: 27, pregnant: false, breastfeeding: 'no' });
    expect(e.deficitAllowed).toBe(false);
    expect(e.blocked).toContain('minor');
  });
  it('grossesse : bloqué + sport désactivé', () => {
    const s = computeSummary(make({ pregnant: true }), S5);
    expect(s.intake.mode).toBe('blocked');
    expect(s.eligibility.sportDisabled).toBe(true);
  });
  it('allaitement exclusif bébé < 6 mois : dépense + 500 kcal', () => {
    const s = computeSummary(make({ breastfeeding: 'exclusive', babyBirthDate: '2026-09-01' }), S5);
    expect(s.intake.mode).toBe('breastfeeding');
    expect(s.intake.kcal).toBe(Math.round((s.tdee + 500) / 10) * 10);
  });
  it('allaitement partiel : apport = dépense', () => {
    const s = computeSummary(make({ breastfeeding: 'partial', babyBirthDate: '2026-01-14' }), S5);
    expect(s.intake.kcal).toBe(Math.round(s.tdee / 10) * 10);
    expect(s.intake.deficit).toBe(0);
  });
  it('allaitement + cible du professionnel, plancher respecté', () => {
    const s = computeSummary(make({ breastfeeding: 'partial', proTargetKcal: 1100 }), S5);
    expect(s.intake.kcal).toBe(1200);
  });
  it('objectif atteint : maintien', () => {
    const s = computeSummary(femme, S5, { goalReached: true });
    expect(s.intake.mode).toBe('maintenance');
    expect(s.intake.kcal).toBe(2390);
  });
  it('semaine du programme', () => {
    expect(programWeek('2026-11-30', '2026-11-30')).toBe(1);
    expect(programWeek('2026-11-30', '2026-12-06')).toBe(1);
    expect(programWeek('2026-11-30', '2026-12-07')).toBe(2);
    expect(programWeek('2026-11-30', '2026-11-20')).toBe(1);
  });
});

import { nextMondayISO, formatDateFR } from '../dates';
describe('Dates', () => {
  it('lundi suivant', () => {
    expect(nextMondayISO('2026-11-24')).toBe('2026-11-30'); // mardi → lundi suivant
    expect(nextMondayISO('2026-11-30')).toBe('2026-11-30'); // lundi → même jour
    expect(nextMondayISO('2026-11-29')).toBe('2026-11-30'); // dimanche → lendemain
  });
  it('format FR', () => {
    expect(formatDateFR('2026-12-07')).toBe('7 décembre 2026');
  });
});

import { validateStep, draftToProfile, emptyDraft, initialDraft } from '../../features/onboarding/draft';
describe('Création du profil', () => {
  const today = '2026-11-24';
  it('refuse un poids cible hors plage santé', () => {
    const d = { ...emptyDraft(), sex: 'F' as const, heightCm: 165, startWeightKg: 82, goal: 'lose' as const, targetWeightKg: 70 };
    expect(Object.keys(validateStep('objectif', d, today))).toEqual(['targetWeightKg']);
    expect(Object.keys(validateStep('objectif', { ...d, targetWeightKg: 66 }, today))).toEqual([]);
  });
  it('demande les infos de base', () => {
    expect(Object.keys(validateStep('toi', emptyDraft(), today)).sort()).toEqual(['birthDate', 'heightCm', 'sex', 'startWeightKg']);
  });
  it('profil d’exemple via ?exemple=1', () => {
    const d = initialDraft('?exemple=1');
    expect(d.batchCooking?.day).toBe(6);
    expect(d.breakfastPref).toBe('sweet');
    expect(d.sleepHours).toBe(5);
  });
  it('un homme ne peut pas être marqué enceinte/allaitant', () => {
    const d = { ...emptyDraft(), sex: 'M' as const, birthDate: '1980-01-01', heightCm: 180, startWeightKg: 90, pregnant: true, breastfeeding: 'partial' as const };
    const p = draftToProfile(d, today, '2026-11-30', today);
    expect(p.pregnant).toBe(false);
    expect(p.breastfeeding).toBe('no');
  });
});

describe('Premier palier', () => {
  it('date estimée du palier −5 % (sommeil 5 h)', () => {
    const s = computeSummary(make({ targetWeightKg: 66 }), '2026-11-30');
    expect(s.milestone.from).toBe(77.9);
    // ln(77,9/82)/ln(0,995) = 10,24 → 11 semaines
    expect(s.milestoneEta?.maxWeeks).toBe(11);
  });
});
