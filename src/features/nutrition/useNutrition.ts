import type { AppData } from '../../hooks/useAppData';
import { buildWeekMenu } from '../../domain/nutrition/menu';
import { householdFactor } from '../../domain/nutrition/shopping';
import { buildWeek, isoWeekday } from '../../domain/sport/week';
import { programWeek } from '../../domain/summary';
import { mondayOf } from '../../domain/calc/recalc';

/** Menu de la semaine en cours et données associées. */
export function nutritionContext(data: AppData) {
  const p = data.profile;
  const day = data.today < p.programStartDate ? p.programStartDate : data.today;
  const week = programWeek(p.programStartDate, day);
  const plan = buildWeek(p, data.weekOverride);
  const menu = buildWeekMenu({
    week,
    plan,
    constraints: p.foodConstraints,
    breakfastPref: p.breakfastPref,
    freeMeal: data.nutritionPrefs.freeMeal,
    smoothie: data.nutritionPrefs.smoothie
  });
  const computedFamily = householdFactor(p.household);
  const family = data.nutritionPrefs.servings ?? computedFamily;
  const todayMenu = menu.find((d) => d.day === isoWeekday(data.today))!;
  return { week, menu, family, computedFamily, todayMenu, weekStart: mondayOf(day), prefs: data.nutritionPrefs };
}
