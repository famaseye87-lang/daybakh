import { C } from './conventions';
import type { Breastfeeding } from '../types';

export type BlockReason = 'minor' | 'lowBmi' | 'pregnant';

export interface EligibilityInput {
  age: number;
  bmi: number;
  pregnant: boolean;
  breastfeeding: Breastfeeding;
}

export interface Eligibility {
  /** Un déficit automatique peut-il être proposé ? */
  deficitAllowed: boolean;
  /** Raisons de blocage (aucun déficit, orientation vers un professionnel) */
  blocked: BlockReason[];
  /** Mode allaitement actif */
  breastfeedingMode: boolean;
  /** Programme sportif désactivé (grossesse) */
  sportDisabled: boolean;
}

/** Garde-fous § I : âge < 18, IMC < 18,5, grossesse → aucun déficit ; allaitement → mode allaitement. */
export function deficitEligibility(i: EligibilityInput): Eligibility {
  const blocked: BlockReason[] = [];
  if (i.age < C.minAge) blocked.push('minor');
  if (i.bmi < 18.5) blocked.push('lowBmi');
  if (i.pregnant) blocked.push('pregnant');
  const breastfeedingMode = i.breastfeeding !== 'no';
  return {
    deficitAllowed: blocked.length === 0 && !breastfeedingMode,
    blocked,
    breastfeedingMode,
    sportDisabled: i.pregnant
  };
}

export function isMinor(age: number): boolean {
  return age < C.minAge;
}
