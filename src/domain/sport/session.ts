import workouts from '../../content/workouts.json';
import exercisesData from '../../content/exercises.json';
import type { CircuitParams } from './progression';
import type { Level } from './types';

export type Exercise = (typeof exercisesData.exercises)[number] & {
  intenseFrom?: Level;
  substitute?: string;
  unilateral?: boolean;
};
export const EXERCISES = exercisesData.exercises as Exercise[];
export const exerciseById = (id: string) => EXERCISES.find((e) => e.id === id);

const ORDER: Level[] = ['easy', 'intermediate', 'advanced'];
const lower = (l: Level): Level => ORDER[Math.max(0, ORDER.indexOf(l) - 1)];

export interface PlannedExercise {
  exercise: Exercise;
  level: Level;
  /** Remplacé à cause du verrou post-partum */
  replacedFrom?: string;
}

/**
 * Applique le verrou post-partum (§ F.3 / § I) : si l'exercice devient intense au niveau demandé,
 * on baisse le niveau ; si même la version facile est intense, on le remplace par l'exercice de substitution.
 */
export function applyPostpartumLock(ex: Exercise, level: Level, locked: boolean): PlannedExercise {
  if (!locked || !ex.intenseFrom) return { exercise: ex, level };
  const limit = ORDER.indexOf(ex.intenseFrom as Level);
  if (limit === 0) {
    const sub = exerciseById(ex.substitute ?? 'birddog')!;
    return { exercise: sub, level: 'easy', replacedFrom: ex.name };
  }
  let l = level;
  while (ORDER.indexOf(l) >= limit) l = lower(l);
  return { exercise: ex, level: l };
}

/** Exercices d'une séance avec leur niveau (versions avancées sur une partie des exercices selon le bloc). */
export function planExercises(kind: 'A' | 'B' | 'C' | 'hiit', p: CircuitParams, postpartumLocked: boolean): PlannedExercise[] {
  const ids = workouts.sessions[kind].exercises;
  const nAdvanced = Math.floor(ids.length * p.advancedShare);
  return ids.map((id, i) => {
    const ex = exerciseById(id)!;
    const level: Level = i < nAdvanced ? 'advanced' : p.level;
    return applyPostpartumLock(ex, level, postpartumLocked);
  });
}

export type StepType = 'warmup' | 'work' | 'rest' | 'roundRest' | 'cooldown';

export interface TimelineStep {
  type: StepType;
  seconds: number;
  label: string;
  exerciseId?: string;
  level?: Level;
  round?: number;
  rounds?: number;
}

const sum = (xs: { seconds: number }[]) => xs.reduce((s, x) => s + x.seconds, 0);

/**
 * Déroulé minute par minute : échauffement → tours (effort / repos) → retour au calme.
 * Le nombre de tours est réduit si la séance dépasse la durée choisie (ou 25 min en « séance courte »).
 */
export function buildTimeline(
  planned: PlannedExercise[],
  p: CircuitParams,
  targetMinutes: number,
  opts: { short?: boolean } = {}
): { steps: TimelineStep[]; rounds: number; totalSeconds: number } {
  const warm = opts.short ? workouts.warmup.slice(0, 4) : workouts.warmup;
  const cool = opts.short ? workouts.cooldown.slice(-3) : workouts.cooldown;
  const target = (opts.short ? Math.min(targetMinutes, 25) : targetMinutes) * 60;
  const perRound = planned.length * (p.work + p.rest);
  let rounds = p.rounds;
  const total = (r: number) => sum(warm) + sum(cool) + r * perRound + (r - 1) * workouts.roundRestSeconds;
  while (rounds > 1 && total(rounds) > target) rounds--;

  const steps: TimelineStep[] = warm.map((w) => ({ type: 'warmup', seconds: w.seconds, label: w.label }));
  for (let r = 1; r <= rounds; r++) {
    planned.forEach((pe, i) => {
      steps.push({ type: 'work', seconds: p.work, label: pe.exercise.name, exerciseId: pe.exercise.id, level: pe.level, round: r, rounds });
      const lastOfRound = i === planned.length - 1;
      if (!lastOfRound) steps.push({ type: 'rest', seconds: p.rest, label: 'Récupération', round: r, rounds });
    });
    if (r < rounds) steps.push({ type: 'roundRest', seconds: workouts.roundRestSeconds, label: 'Pause entre les tours : bois un peu', round: r, rounds });
  }
  cool.forEach((c) => steps.push({ type: 'cooldown', seconds: c.seconds, label: c.label }));
  return { steps, rounds, totalSeconds: sum(steps) };
}

/** HIIT léger sur tapis de course : intervalles marche rapide / marche tranquille. */
export function hiitTreadmillTimeline(): { steps: TimelineStep[]; totalSeconds: number } {
  const h = workouts.hiit.treadmill;
  const steps: TimelineStep[] = [{ type: 'warmup', seconds: 300, label: 'Échauffement : marche tranquille' }];
  for (let r = 1; r <= h.rounds; r++) {
    steps.push({ type: 'work', seconds: h.work, label: h.workLabel, round: r, rounds: h.rounds });
    steps.push({ type: 'rest', seconds: h.rest, label: h.restLabel, round: r, rounds: h.rounds });
  }
  steps.push({ type: 'cooldown', seconds: 180, label: 'Retour au calme : marche lente' });
  return { steps, totalSeconds: sum(steps) };
}
