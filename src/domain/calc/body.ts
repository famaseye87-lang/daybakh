import { C } from '../conventions';

const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/** IMC = poids (kg) / taille (m)². Source : OMS. */
export function bmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export type BmiCategoryKey =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obesity1'
  | 'obesity2'
  | 'obesity3';

const BMI_LABELS: Record<BmiCategoryKey, string> = {
  underweight: 'Insuffisance pondérale',
  normal: 'Corpulence normale',
  overweight: 'Surpoids',
  obesity1: 'Obésité modérée (classe I)',
  obesity2: 'Obésité sévère (classe II)',
  obesity3: 'Obésité morbide (classe III)'
};

/** Catégories OMS : < 18,5 / 18,5–24,9 / 25–29,9 / 30–34,9 / 35–39,9 / ≥ 40 */
export function bmiCategory(value: number): { key: BmiCategoryKey; label: string } {
  let key: BmiCategoryKey;
  if (value < 18.5) key = 'underweight';
  else if (value < 25) key = 'normal';
  else if (value < 30) key = 'overweight';
  else if (value < 35) key = 'obesity1';
  else if (value < 40) key = 'obesity2';
  else key = 'obesity3';
  return { key, label: BMI_LABELS[key] };
}

/** Poids pour un IMC donné : IMC × taille² */
export function weightForBmi(targetBmi: number, heightCm: number): number {
  const h = heightCm / 100;
  return targetBmi * h * h;
}

/** Plage de poids santé : IMC 18,5 à 24,9 (OMS). */
export function healthyRange(heightCm: number): { min: number; max: number } {
  return { min: round(weightForBmi(18.5, heightCm)), max: round(weightForBmi(24.9, heightCm)) };
}

export function isTargetInHealthyRange(targetKg: number, heightCm: number): boolean {
  const r = healthyRange(heightCm);
  return targetKg >= r.min && targetKg <= r.max;
}

/** Premier palier conseillé : −5 à −10 % du poids initial. */
export function firstMilestone(startWeightKg: number): { from: number; to: number } {
  return {
    from: round(startWeightKg * (1 - C.milestone.minLoss)),
    to: round(startWeightKg * (1 - C.milestone.maxLoss))
  };
}

export type WhtrStatus = 'healthy' | 'watch' | 'takeAction';

/** Rapport tour de taille / taille. Repère < 0,5 (NICE NG246), indicateur pour IMC < 35. */
export function whtr(
  waistCm: number,
  heightCm: number
): { value: number; status: WhtrStatus } {
  const value = waistCm / heightCm;
  const status: WhtrStatus =
    value < C.whtr.healthy ? 'healthy' : value < C.whtr.takeAction ? 'watch' : 'takeAction';
  return { value, status };
}

export function whtrApplicable(bmiValue: number): boolean {
  return bmiValue < C.whtr.maxBmi;
}

/** Âge en années révolues à une date donnée (ISO AAAA-MM-JJ). */
export function ageOn(birthDateISO: string, onISO: string): number {
  const [by, bm, bd] = birthDateISO.slice(0, 10).split('-').map(Number);
  const [y, m, d] = onISO.slice(0, 10).split('-').map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

/** Âge en mois révolus. */
export function monthsBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.slice(0, 10).split('-').map(Number);
  const [ty, tm, td] = toISO.slice(0, 10).split('-').map(Number);
  let months = (ty - fy) * 12 + (tm - fm);
  if (td < fd) months -= 1;
  return months;
}
