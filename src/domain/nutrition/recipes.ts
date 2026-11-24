import data from '../../content/recipes.json';

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type Aisle = 'fruits-legumes' | 'boucherie-poisson' | 'cremerie' | 'epicerie' | 'surgeles' | 'boulangerie';

export interface Ingredient { name: string; qty: number; unit: string; aisle: Aisle }
export interface Recipe {
  id: string;
  name: string;
  type: 'breakfast' | 'snack' | 'main';
  sweet?: boolean;
  cuisine: 'senegalaise' | 'francaise';
  minutes: number;
  simple?: boolean;
  batch?: boolean;
  smoothie?: boolean;
  contains: string[];
  ingredients: Ingredient[];
  steps: string[];
  tipFamily: string;
  tipPlate: string;
}

export const RECIPES = data.recipes as Recipe[];
export const recipeById = (id: string) => RECIPES.find((r) => r.id === id);

/** Contraintes du profil → ingrédients exclus. */
const CONSTRAINT_EXCLUDES: Record<string, string[]> = {
  'Sans porc': ['porc'],
  'Végétarien': ['viande', 'volaille', 'poisson', 'porc'],
  'Sans lactose': ['lactose'],
  'Sans gluten': ['gluten'],
  'Sans poisson': ['poisson'],
  'Sans fruits à coque': ['fruits-a-coque']
};

export function allowed(r: Recipe, constraints: string[]): boolean {
  const excluded = constraints.flatMap((c) => CONSTRAINT_EXCLUDES[c] ?? []);
  return !r.contains.some((x) => excluded.includes(x));
}
