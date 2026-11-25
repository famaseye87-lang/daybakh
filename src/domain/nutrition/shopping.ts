import { C } from '../conventions';
import { recipeById, type Aisle } from './recipes';
import type { DayMenu, MealEntry } from './menu';

/** Coefficient de portion selon l'âge (convention Daybakh) : < 1 an non compté, 1-6 ans 0,5, 7-11 ans 0,75, 12 ans et plus 1. */
export function portionCoef(age: number): number {
  if (age < C.portions.minAge) return 0;
  const c = C.portions.children.find((x) => age <= x.maxAge);
  return c ? c.coef : C.portions.adult;
}

export function householdFactor(people: { age: number }[]): number {
  return Math.max(1, people.reduce((s, p) => s + portionCoef(p.age), 0));
}

export interface ShoppingItem {
  id: string;
  label: string;
  aisle: Aisle | 'placard';
  qty?: string;
  checked: boolean;
  custom?: boolean;
}

export const AISLE_LABEL: Record<ShoppingItem['aisle'], string> = {
  'fruits-legumes': 'Fruits et légumes',
  'boucherie-poisson': 'Boucherie, poissonnerie',
  cremerie: 'Crèmerie, œufs',
  boulangerie: 'Boulangerie',
  epicerie: 'Épicerie',
  surgeles: 'Surgelés',
  placard: 'Placard (à vérifier)'
};
export const AISLE_ORDER: ShoppingItem['aisle'][] = ['fruits-legumes', 'boucherie-poisson', 'cremerie', 'boulangerie', 'epicerie', 'surgeles', 'placard'];

/** Petites quantités (cuillères, pincées) : produits de placard à vérifier, pas à acheter chaque semaine. */
const SMALL_UNITS = ['c. à s.', 'c. à c.', 'pincée'];

function roundQty(qty: number, unit: string): string {
  if (unit === 'g' || unit === 'ml') {
    const step = qty < 100 ? 10 : qty < 1000 ? 50 : 100;
    const v = Math.ceil(qty / step) * step;
    if (v >= 1000) return `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${unit === 'g' ? 'kg' : 'L'}`;
    return `${v} ${unit}`;
  }
  if (unit === 'pièce') return `${Math.ceil(qty)}`;
  return `${Math.ceil(qty)} ${unit}`;
}

/**
 * Liste de courses de la semaine (§ E.5) : ingrédients des menus × nombre de portions.
 * - dîners cuisinés pour la famille, en double quand le déjeuner du lendemain est fait de restes ;
 * - petit-déjeuner et collation : pour toi seule, ou pour toute la famille (réglage) ;
 * - regroupée par rayon.
 */
export function buildShoppingList(menu: DayMenu[], family: number, breakfastScope: 'me' | 'family'): ShoppingItem[] {
  const totals = new Map<string, { label: string; unit: string; aisle: Aisle; qty: number }>();
  const add = (entry: MealEntry, servings: number) => {
    if (!entry.recipeId || entry.leftoverFrom || entry.free) return;
    const r = recipeById(entry.recipeId);
    if (!r) return;
    for (const ing of r.ingredients) {
      const key = `${ing.name}|${ing.unit}`;
      const t = totals.get(key) ?? { label: ing.name, unit: ing.unit, aisle: ing.aisle, qty: 0 };
      t.qty += ing.qty * servings;
      totals.set(key, t);
    }
  };
  const bfServ = breakfastScope === 'family' ? family : 1;
  for (const d of menu) {
    add(d.breakfast, bfServ);
    add(d.snack, bfServ);
    add(d.lunch, family);
    const nextHasLeftovers = menu.some((x) => x.lunch.leftoverFrom === d.day);
    add(d.dinner, family * (nextHasLeftovers ? 2 : 1));
  }
  const items: ShoppingItem[] = [...totals.values()].map((t) => {
    const small = SMALL_UNITS.includes(t.unit);
    return {
      id: `${t.label}|${t.unit}`,
      label: t.label,
      aisle: small ? 'placard' : t.aisle,
      qty: small ? undefined : roundQty(t.qty, t.unit),
      checked: false
    };
  });
  return items.sort((a, b) => AISLE_ORDER.indexOf(a.aisle) - AISLE_ORDER.indexOf(b.aisle) || a.label.localeCompare(b.label, 'fr'));
}

/** Texte à partager (SMS, WhatsApp…). */
export function shoppingText(items: ShoppingItem[], title: string): string {
  const lines = [title];
  for (const a of AISLE_ORDER) {
    const xs = items.filter((i) => i.aisle === a && !i.checked);
    if (!xs.length) continue;
    lines.push('', `— ${AISLE_LABEL[a]} —`);
    for (const i of xs) lines.push(`☐ ${i.label}${i.qty ? ` : ${i.qty}` : ''}`);
  }
  return lines.join('\n');
}

/** Régénère la liste en gardant les articles déjà cochés et ceux ajoutés à la main. */
export function mergeShoppingLists(previous: ShoppingItem[], fresh: ShoppingItem[]): ShoppingItem[] {
  const checked = new Set(previous.filter((i) => i.checked).map((i) => i.id));
  const merged = fresh.map((i) => ({ ...i, checked: checked.has(i.id) }));
  return [...merged, ...previous.filter((i) => i.custom)];
}
