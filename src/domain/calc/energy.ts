import { C } from '../conventions';
import type { DeficitLevel, Goal, Breastfeeding, Sex, IntakeMode } from '../../types';
import type { Eligibility } from '../guards';

/**
 * Métabolisme de base — Mifflin-St Jeor (1990).
 * Femme : 10 × poids + 6,25 × taille − 5 × âge − 161
 * Homme : 10 × poids + 6,25 × taille − 5 × âge + 5
 */
export function bmrMifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'F' ? base - 161 : base + 5;
}

/** Minutes d'activité prévues par semaine (séances maison + activités fixes). */
export function weeklyActivityMinutes(p: {
  homeWorkoutDays: unknown[];
  sessionMinutes: number;
  fixedActivities: { minutes: number }[];
}): number {
  return (
    p.homeWorkoutDays.length * p.sessionMinutes +
    p.fixedActivities.reduce((s, a) => s + a.minutes, 0)
  );
}

/**
 * Niveau d'activité physique (NAP) déduit des minutes prévues.
 * Valeurs EFSA 2013 (1,4 / 1,6 / 1,8 / 2,0) ; seuils en minutes : convention Daybakh.
 */
export function napFromMinutes(minutesPerWeek: number): number {
  const t = C.nap.thresholdsMinutesPerWeek;
  const v = C.nap.values;
  if (minutesPerWeek < t[0]) return v[0];
  if (minutesPerWeek <= t[1]) return v[1];
  if (minutesPerWeek <= t[2]) return v[2];
  return v[3];
}

/** Dépense journalière = MB × NAP */
export function tdee(bmr: number, nap: number): number {
  return bmr * nap;
}

export type Phase = 'start' | 'loss' | 'consolidation' | 'maintenance';

/** Phase du programme selon la semaine (1 = première semaine). */
export function phaseForWeek(week: number): Phase {
  if (week <= C.phases.startEndWeek) return 'start';
  if (week <= C.phases.lossEndWeek) return 'loss';
  if (week <= C.phases.consolidationEndWeek) return 'consolidation';
  return 'maintenance';
}

/** Taux de déficit appliqué : S1-4 doux, S5-12 selon le choix, S13-24 doux, ensuite 0. */
export function deficitRate(level: DeficitLevel, week: number): number {
  switch (phaseForWeek(week)) {
    case 'start':
      return C.deficit.startPhase;
    case 'loss':
      return level === 'normal' ? C.deficit.normal : C.deficit.soft;
    case 'consolidation':
      return C.deficit.consolidationPhase;
    default:
      return 0;
  }
}

export function kcalFloor(sex: Sex): number {
  return C.kcalFloor[sex];
}

const roundKcal = (v: number) => Math.round(v / C.kcalRounding) * C.kcalRounding;

export interface IntakeInput {
  sex: Sex;
  tdee: number;
  goal: Goal;
  deficitLevel: DeficitLevel;
  week: number;
  eligibility: Eligibility;
  breastfeeding: Breastfeeding;
  babyAgeMonths?: number;
  proTargetKcal?: number;
  goalReached?: boolean;
}

export interface IntakeResult {
  kcal: number;
  mode: IntakeMode;
  deficit: number;
  floorApplied: boolean;
  /** Explication courte, affichable */
  explanation: string;
}

/** Apport calorique cible (§ C.5 et C.7). */
export function targetIntake(i: IntakeInput): IntakeResult {
  const floor = kcalFloor(i.sex);
  const el = i.eligibility;

  if (el.blocked.length > 0) {
    return {
      kcal: roundKcal(i.tdee),
      mode: 'blocked',
      deficit: 0,
      floorApplied: false,
      explanation: 'Aucun déficit proposé : apport = dépense journalière.'
    };
  }

  if (el.breastfeedingMode) {
    if (i.proTargetKcal && i.proTargetKcal > 0) {
      const kcal = Math.max(roundKcal(i.proTargetKcal), floor);
      return {
        kcal,
        mode: 'breastfeeding',
        deficit: 0,
        floorApplied: kcal === floor && i.proTargetKcal < floor,
        explanation: 'Cible fixée par ton professionnel de santé.'
      };
    }
    const exclusiveYoung =
      i.breastfeeding === 'exclusive' &&
      i.babyAgeMonths !== undefined &&
      i.babyAgeMonths < C.breastfeeding.exclusiveMonths;
    const extra = exclusiveYoung ? C.breastfeeding.exclusiveExtraKcal : 0;
    return {
      kcal: roundKcal(i.tdee + extra),
      mode: 'breastfeeding',
      deficit: 0,
      floorApplied: false,
      explanation: exclusiveYoung
        ? 'Dépense journalière + 500 kcal (allaitement exclusif, EFSA 2013).'
        : 'Apport = dépense journalière, sans déficit pendant l’allaitement.'
    };
  }

  if (i.goal !== 'lose' || i.goalReached) {
    return {
      kcal: roundKcal(i.tdee),
      mode: 'maintenance',
      deficit: 0,
      floorApplied: false,
      explanation: 'Maintien : apport = dépense journalière.'
    };
  }

  const d = deficitRate(i.deficitLevel, i.week);
  if (d === 0) {
    return {
      kcal: roundKcal(i.tdee),
      mode: 'maintenance',
      deficit: 0,
      floorApplied: false,
      explanation: 'Phase de maintien : apport = dépense journalière.'
    };
  }
  const raw = i.tdee * (1 - d);
  const floorApplied = raw < floor;
  return {
    kcal: floorApplied ? floor : roundKcal(raw),
    mode: 'loss',
    deficit: d,
    floorApplied,
    explanation: floorApplied
      ? `Le calcul donne moins que le minimum de sécurité : on garde ${floor} kcal (repère NHLBI).`
      : `Dépense journalière − ${Math.round(d * 100)} %.`
  };
}

/** Objectif d'hydratation en litres de boissons par jour. */
export function waterTargetL(breastfeeding: Breastfeeding): { min: number; max: number } {
  const extra = breastfeeding !== 'no' ? C.water.breastfeedingExtraL : 0;
  return { min: C.water.minL + extra, max: C.water.maxL + extra };
}
