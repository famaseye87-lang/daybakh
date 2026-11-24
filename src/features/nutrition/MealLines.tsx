import { Link } from 'react-router-dom';
import { recipeById } from '../../domain/nutrition/recipes';
import type { DayMenu, MealEntry } from '../../domain/nutrition/menu';
import s from './nutrition.module.css';

const DAY_LONG = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MEALS: { key: 'breakfast' | 'lunch' | 'snack' | 'dinner'; label: string }[] = [
  { key: 'breakfast', label: 'Petit-déj.' },
  { key: 'lunch', label: 'Déjeuner' },
  { key: 'snack', label: 'Collation' },
  { key: 'dinner', label: 'Dîner' }
];

/** « 15:00 » → « 15 h », « 15:30 » → « 15 h 30 » */
const fmtTime = (t: string) => {
  const [h, m] = t.split(':');
  return m && m !== '00' ? `${Number(h)} h ${m}` : `${Number(h)} h`;
};

function Entry({ e }: { e: MealEntry }) {
  if (e.free) return <span><strong>Repas libre</strong> <span className={s.small}>— profite, sans « rattrapage » ensuite</span></span>;
  const r = e.recipeId ? recipeById(e.recipeId) : undefined;
  if (!r) return <span>—</span>;
  return (
    <span>
      <Link to={`/assiette/recette/${r.id}`}>{r.name}</Link>
      {e.leftoverFrom && <span className={s.small}> · restes du dîner de {DAY_LONG[e.leftoverFrom]}</span>}
    </span>
  );
}

export function MealLines({ day, snackTime = '15:00' }: { day: DayMenu; snackTime?: string }) {
  return (
    <div>
      {MEALS.map((m) => (
        <div key={m.key} className={s.meal}>
          <span className={s.mealLabel}>{m.key === 'snack' ? `Collation ${fmtTime(snackTime)}` : m.label}</span>
          <Entry e={day[m.key]} />
        </div>
      ))}
    </div>
  );
}

export function PlateBadge({ type }: { type: 'sport' | 'light' }) {
  return <span className={[s.badge, type === 'sport' ? s.badgeSport : s.badgeLight].join(' ')}>{type === 'sport' ? 'Jour de sport' : 'Jour léger'}</span>;
}

export { DAY_LONG };
