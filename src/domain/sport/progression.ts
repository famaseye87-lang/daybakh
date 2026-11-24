import workouts from '../../content/workouts.json';
import type { Level } from './types';

export type Block = (typeof workouts.blocks)[number];

/** Bloc de progression pour une semaine de programme (1 = première semaine ; > 24 = entretien). */
export function blockForWeek(week: number): Block {
  return workouts.blocks.find((b) => week >= b.fromWeek && week <= b.toWeek) ?? workouts.blocks[workouts.blocks.length - 1];
}

/** Semaine allégée toutes les 4 semaines (−1 tour), jamais pendant le bloc de démarrage. */
export function isDeloadWeek(week: number): boolean {
  return week > 4 && week <= 24 && week % workouts.deloadEveryWeeks === 0;
}

export interface CircuitParams {
  block: number;
  rounds: number;
  work: number;
  rest: number;
  level: Level;
  advancedShare: number;
  deload: boolean;
  note: string;
}

export function circuitParams(week: number): CircuitParams {
  const b = blockForWeek(week);
  const deload = isDeloadWeek(week);
  return {
    block: b.block,
    rounds: Math.max(1, b.rounds - (deload ? 1 : 0)),
    work: b.work,
    rest: b.rest,
    level: b.level as Level,
    advancedShare: b.advancedShare,
    deload,
    note: b.note
  };
}

/** HIIT léger : à partir de la phase 2 (semaine 5), uniquement après une nuit d'au moins 6 h (§ F, § J). */
export function hiitAllowed(week: number, lastNightHours: number | undefined): boolean {
  return week >= workouts.hiit.fromWeek && lastNightHours !== undefined && lastNightHours >= workouts.hiit.minSleepHours;
}
