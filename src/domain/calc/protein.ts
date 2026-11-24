import { C } from '../conventions';
import { bmi, weightForBmi } from './body';

/** Poids de référence : poids actuel, ou poids à IMC 25 si IMC > 30 (décision I8). */
export function proteinReferenceWeight(weightKg: number, heightCm: number): number {
  return bmi(weightKg, heightCm) > C.protein.obesityBmi
    ? weightForBmi(C.protein.referenceBmi, heightCm)
    : weightKg;
}

/** Protéines : 1,2 à 1,6 g × poids de référence (Leidy et al., 2015). */
export function proteinRange(
  weightKg: number,
  heightCm: number
): { min: number; max: number; target: number; refWeight: number } {
  const ref = proteinReferenceWeight(weightKg, heightCm);
  return {
    min: Math.round(ref * C.protein.minPerKg),
    max: Math.round(ref * C.protein.maxPerKg),
    target: Math.round(ref * C.protein.targetPerKg),
    refWeight: Math.round(ref * 10) / 10
  };
}
