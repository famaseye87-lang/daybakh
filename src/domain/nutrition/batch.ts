import { C } from '../conventions';
import { recipeById } from './recipes';
import type { DayMenu } from './menu';
import type { Weekday } from '../sport/types';

export interface BatchDish {
  recipeId: string;
  name: string;
  forDays: Weekday[];
  portions: number;
  /** À congeler puis décongeler la veille (au-delà de la durée de conservation au frais) */
  freeze: boolean;
}

/** Jours écoulés entre le jour de préparation et le jour du repas (semaine lun → dim, préparation le samedi). */
const daysAfter = (prep: Weekday, eat: Weekday) => (eat - prep + 7) % 7;

/**
 * Plan de cuisine en avance (§ E.4) : plats du samedi matin (ou du mercredi soir) avec le nombre de portions,
 * y compris les restes prévus pour le déjeuner du lendemain.
 */
export function batchPlan(menu: DayMenu[], kind: 'batch' | 'miniBatch', family: number): BatchDish[] {
  const prep: Weekday = kind === 'batch' ? 6 : 3;
  const out: BatchDish[] = [];
  for (const d of menu.filter((x) => x.cookedOn === kind && x.dinner.recipeId)) {
    const r = recipeById(d.dinner.recipeId!)!;
    const leftover = menu.find((x) => x.lunch.leftoverFrom === d.day);
    const forDays: Weekday[] = leftover ? [d.day, leftover.day] : [d.day];
    const lastDay = forDays[forDays.length - 1];
    out.push({
      recipeId: r.id,
      name: r.name,
      forDays,
      portions: Math.ceil(family * forDays.length),
      freeze: daysAfter(prep, lastDay) > C.foodSafety.fridgeDays
    });
  }
  return out.sort((a, b) => daysAfter(prep, a.forDays[0]) - daysAfter(prep, b.forDays[0]));
}
