import type { Profile } from '../types';
import { ageOn, bmi, bmiCategory, healthyRange, firstMilestone, monthsBetween, whtr, whtrApplicable } from './calc/body';
import { bmrMifflin, napFromMinutes, phaseForWeek, targetIntake, tdee, waterTargetL, weeklyActivityMinutes, type Phase, type IntakeResult } from './calc/energy';
import { proteinRange } from './calc/protein';
import { etaRange, expectedWeeklyRate, addWeeksISO } from './calc/rate';
import { deficitEligibility, type Eligibility } from './guards';

export interface Summary {
  age: number;
  weightKg: number;
  bmi: number;
  bmiCategory: { key: string; label: string };
  healthyRange: { min: number; max: number };
  milestone: { from: number; to: number };
  whtr?: { value: number; status: string };
  bmr: number;
  activityMinutes: number;
  nap: number;
  tdee: number;
  week: number;
  phase: Phase;
  intake: IntakeResult;
  protein: ReturnType<typeof proteinRange>;
  water: { min: number; max: number };
  rate: ReturnType<typeof expectedWeeklyRate>;
  eta?: { minWeeks: number; maxWeeks: number; fromDate: string; toDate: string };
  milestoneEta?: { minWeeks: number; maxWeeks: number; fromDate: string; toDate: string };
  eligibility: Eligibility;
  shortSleep: boolean;
}

/** Semaine du programme (1 = semaine de démarrage). */
export function programWeek(startISO: string, todayISO: string): number {
  const a = new Date(startISO.slice(0, 10) + 'T12:00:00').getTime();
  const b = new Date(todayISO.slice(0, 10) + 'T12:00:00').getTime();
  return Math.max(1, Math.floor((b - a) / (7 * 86400000)) + 1);
}

/** Calcule tous les indicateurs à partir du profil et du poids courant. */
export function computeSummary(
  p: Profile,
  todayISO: string,
  opts: { weightKg?: number; waistCm?: number; goalReached?: boolean } = {}
): Summary {
  const weightKg = opts.weightKg ?? p.startWeightKg;
  const age = ageOn(p.birthDate, todayISO);
  const b = bmi(weightKg, p.heightCm);
  const eligibility = deficitEligibility({ age, bmi: b, pregnant: p.pregnant, breastfeeding: p.breastfeeding });
  const bmr = bmrMifflin(p.sex, weightKg, p.heightCm, age);
  const activityMinutes = weeklyActivityMinutes(p);
  const nap = p.napOverride ?? napFromMinutes(activityMinutes);
  const dej = tdee(bmr, nap);
  const week = programWeek(p.programStartDate, todayISO);
  const intake = targetIntake({
    sex: p.sex,
    tdee: dej,
    goal: p.goal,
    deficitLevel: p.deficitLevel,
    week,
    eligibility,
    breastfeeding: p.breastfeeding,
    babyAgeMonths: p.babyBirthDate ? monthsBetween(p.babyBirthDate, todayISO) : undefined,
    proTargetKcal: p.proTargetKcal,
    goalReached: opts.goalReached
  });
  const rate = expectedWeeklyRate(p.sleepHours);
  const withDates = (r: { minWeeks: number; maxWeeks: number }) => ({
    ...r,
    fromDate: addWeeksISO(todayISO, r.minWeeks),
    toDate: addWeeksISO(todayISO, r.maxWeeks)
  });
  const milestone = firstMilestone(p.startWeightKg);
  let eta: Summary['eta'];
  let milestoneEta: Summary['milestoneEta'];
  if (intake.mode === 'loss' && p.targetWeightKg && p.targetWeightKg < weightKg) {
    eta = withDates(etaRange(weightKg, p.targetWeightKg, p.sleepHours));
    if (milestone.from < weightKg && milestone.from > p.targetWeightKg) {
      milestoneEta = withDates(etaRange(weightKg, milestone.from, p.sleepHours));
    }
  }
  return {
    age,
    weightKg,
    bmi: b,
    bmiCategory: bmiCategory(b),
    healthyRange: healthyRange(p.heightCm),
    milestone,
    whtr: opts.waistCm && whtrApplicable(b) ? whtr(opts.waistCm, p.heightCm) : undefined,
    bmr,
    activityMinutes,
    nap,
    tdee: dej,
    week,
    phase: phaseForWeek(week),
    intake,
    protein: proteinRange(weightKg, p.heightCm),
    water: waterTargetL(p.breastfeeding),
    rate,
    eta,
    milestoneEta,
    eligibility,
    shortSleep: rate.shortSleep
  };
}

/** Instantané de calcul (historique des recalculs). */
export function toSnapshot(sm: Summary, dateISO: string): import('../types').CalcSnapshot {
  return {
    date: dateISO,
    weekIndex: sm.week,
    refWeightKg: sm.weightKg,
    bmi: sm.bmi,
    bmr: sm.bmr,
    nap: sm.nap,
    tdee: sm.tdee,
    targetKcal: sm.intake.kcal,
    floorApplied: sm.intake.floorApplied,
    proteinMinG: sm.protein.min,
    proteinMaxG: sm.protein.max,
    mode: sm.intake.mode
  };
}

/**
 * Repères du jour : poids de référence = dernier recalcul (stable 4 semaines),
 * maintien si l'objectif a été atteint.
 */
export function currentSummary(
  p: Profile,
  todayISO: string,
  opts: { lastSnapshotWeight?: number; goalReached?: boolean; waistCm?: number } = {}
): Summary {
  const day = todayISO < p.programStartDate ? p.programStartDate : todayISO;
  return computeSummary(p, day, {
    weightKg: opts.lastSnapshotWeight ?? p.startWeightKg,
    goalReached: opts.goalReached,
    waistCm: opts.waistCm
  });
}

export interface ChangeLine {
  label: string;
  before: string;
  after: string;
}

/** Ce qui a changé entre deux calculs (affiché après un recalcul ou une modification du profil). */
export function summaryChanges(a: Summary, b: Summary): ChangeLine[] {
  const n = (v: number, d = 0) => v.toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d });
  const lines: ChangeLine[] = [];
  const push = (label: string, x: string, y: string) => {
    if (x !== y) lines.push({ label, before: x, after: y });
  };
  push('Poids de référence', `${n(a.weightKg, 1)} kg`, `${n(b.weightKg, 1)} kg`);
  push('Niveau d’activité', n(a.nap, 1), n(b.nap, 1));
  push('Dépense journalière', `${n(a.tdee)} kcal`, `${n(b.tdee)} kcal`);
  push('Repère calorique', `${n(a.intake.kcal)} kcal`, `${n(b.intake.kcal)} kcal`);
  push('Protéines', `${a.protein.min}–${a.protein.max} g`, `${b.protein.min}–${b.protein.max} g`);
  push('Boissons', `${n(a.water.min, 1)}–${n(a.water.max, 1)} L`, `${n(b.water.min, 1)}–${n(b.water.max, 1)} L`);
  return lines;
}
