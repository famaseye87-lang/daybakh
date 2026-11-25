import { describe, it, expect } from 'vitest';
import { buildWeekMenu, type MenuOptions } from '../nutrition/menu';
import { RECIPES, recipeById, allowed } from '../nutrition/recipes';
import { buildShoppingList, householdFactor, portionCoef, shoppingText } from '../nutrition/shopping';
import { batchPlan } from '../nutrition/batch';
import { buildWeek } from '../sport/week';
import { femme } from './fixtures';

const opts = (o: Partial<MenuOptions> = {}): MenuOptions => ({
  week: 1,
  plan: buildWeek(femme),
  constraints: [],
  breakfastPref: 'sweet',
  freeMeal: { day: 6, meal: 'dinner' },
  smoothie: true,
  ...o
});

describe('Recettes', () => {
  it('30 min maximum, références valides', () => {
    expect(RECIPES.every((r) => r.minutes <= 30)).toBe(true);
    expect(RECIPES.filter((r) => r.type === 'main').length).toBeGreaterThan(12);
  });
  it('filtrage des contraintes', () => {
    expect(allowed(recipeById('yassa-poulet')!, ['Végétarien'])).toBe(false);
    expect(allowed(recipeById('ndambe')!, ['Végétarien'])).toBe(true);
  });
});

describe('Menu de la semaine (§ E.3)', () => {
  const m = buildWeekMenu(opts());
  it('assiette sport 5 jours, légère mardi et jeudi', () => {
    expect(m.map((d) => d.plate)).toEqual(['sport', 'light', 'sport', 'light', 'sport', 'sport', 'sport']);
  });
  it('aucun repas sauté : 4 repas chaque jour (le repas libre compte)', () => {
    for (const d of m) for (const k of ['breakfast', 'lunch', 'snack', 'dinner'] as const) expect(!!(d[k].recipeId || d[k].free)).toBe(true);
  });
  it('repas libre : samedi soir, une seule fois', () => {
    expect(m.filter((d) => d.dinner.free || d.lunch.free).length).toBe(1);
    expect(m[5].dinner.free).toBe(true);
  });
  it('déjeuner = restes du dîner de la veille', () => {
    expect(m[1].lunch.leftoverFrom).toBe(1);
    expect(m[1].lunch.recipeId).toBe(m[0].dinner.recipeId);
    expect(m[6].lunch.leftoverFrom).toBe(undefined); // le samedi soir est libre
  });
  it('petit-déjeuner sucré 6 jours, salé le dimanche', () => {
    const sweetDays = m.filter((d) => recipeById(d.breakfast.recipeId!)!.sweet).length;
    expect(sweetDays).toBe(6);
  });
  it('smoothie vert 3 fois, jamais à la place d’un repas', () => {
    expect(m.filter((d) => d.snack.recipeId === 'smoothie-vert').length).toBe(3);
    expect(m.every((d) => d.lunch.recipeId !== 'smoothie-vert' && d.dinner.recipeId !== 'smoothie-vert')).toBe(true);
    expect(buildWeekMenu(opts({ smoothie: false })).some((d) => d.snack.recipeId === 'smoothie-vert')).toBe(false);
  });
  it('dîners variés, moitié sénégalais / moitié français environ', () => {
    const ids = m.map((d) => d.dinner.recipeId).filter(Boolean) as string[];
    expect(new Set(ids).size).toBe(ids.length);
    const sn = ids.filter((id) => recipeById(id)!.cuisine === 'senegalaise').length;
    expect(Math.abs(sn - (ids.length - sn))).toBeLessThan(3);
  });
  it('les 3 variantes diffèrent', () => {
    const a = buildWeekMenu(opts({ week: 6 })).map((d) => d.dinner.recipeId).join();
    const b = buildWeekMenu(opts({ week: 7 })).map((d) => d.dinner.recipeId).join();
    expect(a === b).toBe(false);
  });
  it('végétarien : aucun plat avec viande ou poisson', () => {
    const v = buildWeekMenu(opts({ constraints: ['Végétarien'] }));
    const ids = v.flatMap((d) => [d.lunch.recipeId, d.dinner.recipeId]).filter(Boolean) as string[];
    expect(ids.every((id) => allowed(recipeById(id)!, ['Végétarien']))).toBe(true);
  });
});

describe('Portions et courses (§ E.4, E.5)', () => {
  it('coefficients par âge', () => {
    expect(portionCoef(0)).toBe(0);
    expect(portionCoef(5)).toBe(0.5);
    expect(portionCoef(10)).toBe(0.75);
    expect(portionCoef(39)).toBe(1);
    expect(householdFactor([{ age: 39 }, { age: 40 }, { age: 10 }, { age: 8 }, { age: 5 }, { age: 0 }])).toBe(4);
  });
  const m = buildWeekMenu(opts());
  const list = buildShoppingList(m, 4, 'me');
  it('liste regroupée par rayon, placard à part', () => {
    expect(list.length).toBeGreaterThan(15);
    expect(list.filter((i) => i.aisle === 'placard').every((i) => i.qty === undefined)).toBe(true);
    const order = list.map((i) => i.aisle);
    expect(order.indexOf('placard')).toBeGreaterThan(order.lastIndexOf('fruits-legumes'));
  });
  it('les restes ne sont pas achetés deux fois mais le dîner est cuisiné en double', () => {
    const one = buildShoppingList([{ ...m[0] }, { ...m[1], dinner: {}, breakfast: {}, snack: {} }].map((d, i) => i === 0 ? { ...d, breakfast: {}, snack: {} } : d), 4, 'me');
    const r = recipeById(m[0].dinner.recipeId!)!;
    const main = r.ingredients.find((x) => x.unit === 'g' && x.aisle === 'boucherie-poisson') ?? r.ingredients.find((x) => x.unit === 'g')!;
    const item = one.find((i) => i.label === main.name)!;
    const grams = item.qty!.endsWith('kg') ? parseFloat(item.qty!.replace(',', '.')) * 1000 : parseInt(item.qty!, 10);
    expect(grams).toBeGreaterThan(main.qty * 4 * 2 - 1);
  });
  it('texte à partager', () => {
    expect(shoppingText(list, 'Courses').startsWith('Courses')).toBe(true);
  });
});

describe('Batch cooking', () => {
  const m = buildWeekMenu(opts());
  it('samedi matin : dîners de dimanche, lundi, mardi (samedi soir libre), avec restes', () => {
    const b = batchPlan(m, 'batch', 4);
    expect(b.map((x) => x.forDays[0])).toEqual([7, 1, 2]);
    expect(b[0].portions).toBe(8);
  });
  it('au-delà de 3 jours au frais : à congeler', () => {
    const b = batchPlan(m, 'batch', 4);
    expect(b.find((x) => x.forDays.includes(3))?.freeze).toBe(true); // mardi soir + restes mercredi midi
  });
  it('mini-batch du mercredi : mercredi et jeudi', () => {
    expect(batchPlan(m, 'miniBatch', 4).map((x) => x.forDays[0])).toEqual([3, 4]);
  });
});

import { mergeShoppingLists } from '../nutrition/shopping';
describe('Liste de courses : nombre de parts', () => {
  const m = buildWeekMenu(opts());
  it('plus de parts → plus de quantités', () => {
    const qty = (n: number) => buildShoppingList(m, n, 'me').find((i) => i.label === 'Oignons')!.qty;
    expect(Number(qty(6))).toBeGreaterThan(Number(qty(4)));
  });
  it('régénérer garde les cases cochées et les articles ajoutés', () => {
    const a = buildShoppingList(m, 4, 'me');
    const prev = [{ ...a[0], checked: true }, ...a.slice(1), { id: 'c1', label: 'Lessive', aisle: 'epicerie' as const, checked: false, custom: true, qty: '1' }];
    const merged = mergeShoppingLists(prev, buildShoppingList(m, 6, 'me'));
    expect(merged.find((i) => i.id === a[0].id)?.checked).toBe(true);
    expect(merged.some((i) => i.label === 'Lessive' && i.qty === '1')).toBe(true);
  });
});
