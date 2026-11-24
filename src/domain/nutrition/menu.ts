import { RECIPES, allowed, type Recipe } from './recipes';
import { phaseForWeek } from '../calc/energy';
import type { DayPlan, Weekday } from '../sport/types';
import { isSportDay } from '../sport/week';

export type PlateType = 'sport' | 'light';

export interface MealEntry {
  recipeId?: string;
  /** Restes du dîner de la veille */
  leftoverFrom?: Weekday;
  free?: boolean;
}

export interface DayMenu {
  day: Weekday;
  plate: PlateType;
  breakfast: MealEntry;
  lunch: MealEntry;
  snack: MealEntry;
  dinner: MealEntry;
  /** Qui cuisine ce dîner : batch du samedi, mini-batch du mercredi, ou le jour même */
  cookedOn: 'batch' | 'miniBatch' | 'sameDay' | 'none';
}

export interface MenuOptions {
  week: number;
  plan: DayPlan[];
  constraints: string[];
  breakfastPref: 'sweet' | 'savory' | 'both';
  freeMeal: { day: Weekday; meal: 'lunch' | 'dinner' };
  smoothie: boolean;
}

const rotate = <T,>(xs: T[], n: number) => (xs.length ? xs.map((_, i) => xs[(i + n) % xs.length]) : xs);

/** Dîners cuisinés au batch du samedi (sam, dim, lun, mar) et au mini-batch du mercredi (mer, jeu). Convention Daybakh. */
export const BATCH_DAYS: Weekday[] = [6, 7, 1, 2];
export const MINI_BATCH_DAYS: Weekday[] = [3, 4];

/**
 * Menu de la semaine (§ E.3) :
 * - dîners variés, en alternant cuisine sénégalaise allégée et cuisine française ;
 * - déjeuner = restes du dîner de la veille (on cuisine une fois, on mange deux fois) ;
 * - dîners de samedi à mardi issus du batch du samedi, mercredi et jeudi du mini-batch ;
 * - petit-déjeuner surtout sucré (un salé par semaine), collation à 15 h, smoothie vert optionnel 2-3 fois ;
 * - 3 variantes qui tournent d'une semaine à l'autre ; recettes les plus simples en phase de démarrage.
 */
export function buildWeekMenu(o: MenuOptions): DayMenu[] {
  const variant = o.week % 3;
  const start = phaseForWeek(o.week) === 'start';
  const ok = (r: Recipe) => allowed(r, o.constraints);
  let mains = RECIPES.filter((r) => r.type === 'main' && ok(r));
  if (start && mains.filter((r) => r.simple).length >= 7) mains = mains.filter((r) => r.simple || r.batch);

  const pick = (pool: Recipe[], used: Set<string>, cuisine: Recipe['cuisine']) =>
    pool.find((r) => !used.has(r.id) && r.cuisine === cuisine) ?? pool.find((r) => !used.has(r.id)) ?? pool[0];

  const batchPool = rotate(mains.filter((r) => r.batch), variant * 2);
  const quickPool = rotate(mains.filter((r) => !r.batch), variant * 3);
  const anyPool = rotate(mains, variant * 4);

  const dinners = new Map<Weekday, string>();
  const used = new Set<string>();
  let cuisine: Recipe['cuisine'] = variant % 2 === 0 ? 'senegalaise' : 'francaise';
  const order: Weekday[] = [6, 7, 1, 2, 3, 4, 5];
  for (const d of order) {
    const pool = BATCH_DAYS.includes(d) ? (batchPool.length ? batchPool : anyPool) : d === 5 ? (quickPool.length ? quickPool : anyPool) : anyPool;
    const r = pick(pool, used, cuisine) ?? pick(anyPool, used, cuisine);
    if (r) {
      dinners.set(d, r.id);
      used.add(r.id);
    }
    cuisine = cuisine === 'senegalaise' ? 'francaise' : 'senegalaise';
  }

  const breakfasts = RECIPES.filter((r) => r.type === 'breakfast' && ok(r));
  const sweet = rotate(breakfasts.filter((r) => r.sweet), variant);
  const savory = breakfasts.filter((r) => !r.sweet);
  const snacks = rotate(RECIPES.filter((r) => r.type === 'snack' && !r.smoothie && ok(r)), variant);
  const smoothie = RECIPES.find((r) => r.smoothie && ok(r));
  const smoothieDays: Weekday[] = [1, 3, 6];

  const prev = (d: Weekday): Weekday => (d === 1 ? 7 : ((d - 1) as Weekday));
  const isFree = (d: Weekday, m: 'lunch' | 'dinner') => o.freeMeal.day === d && o.freeMeal.meal === m;
  const quickLunch = rotate(mains.filter((r) => !r.batch && r.minutes <= 15), variant);

  return o.plan.map((p, i) => {
    const d = p.day;
    const bfSavory = o.breakfastPref === 'savory' ? d !== 7 : o.breakfastPref === 'both' ? d % 2 === 0 : d === 7;
    const breakfast = bfSavory && savory.length ? savory[i % savory.length] : sweet[i % Math.max(1, sweet.length)];
    const snack = o.smoothie && smoothie && smoothieDays.includes(d) ? smoothie : snacks[i % Math.max(1, snacks.length)];
    const dinnerFree = isFree(d, 'dinner');
    const prevDinnerFree = isFree(prev(d), 'dinner');
    const lunch: MealEntry = isFree(d, 'lunch')
      ? { free: true }
      : prevDinnerFree || !dinners.get(prev(d))
        ? { recipeId: (quickLunch[i % Math.max(1, quickLunch.length)] ?? anyPool[0])?.id }
        : { recipeId: dinners.get(prev(d)), leftoverFrom: prev(d) };
    return {
      day: d,
      plate: isSportDay(p) ? 'sport' : 'light',
      breakfast: { recipeId: breakfast?.id },
      lunch,
      snack: { recipeId: snack?.id },
      dinner: dinnerFree ? { free: true } : { recipeId: dinners.get(d) },
      cookedOn: dinnerFree ? 'none' : BATCH_DAYS.includes(d) ? 'batch' : MINI_BATCH_DAYS.includes(d) ? 'miniBatch' : 'sameDay'
    };
  });
}
