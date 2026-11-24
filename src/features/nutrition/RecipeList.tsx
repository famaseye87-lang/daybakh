import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { RECIPES, allowed } from '../../domain/nutrition/recipes';
import type { AppData } from '../../hooks/useAppData';
import s from './nutrition.module.css';

const SECTIONS = [
  { type: 'breakfast', label: 'Petits-déjeuners' },
  { type: 'main', label: 'Plats (déjeuner et dîner)' },
  { type: 'snack', label: 'Collations' }
] as const;

export function RecipeList({ data }: { data: AppData }) {
  const ok = RECIPES.filter((r) => allowed(r, data.profile.foodConstraints));
  return (
    <>
      <p><Link to="/assiette">← Assiette</Link></p>
      <h1>Recettes</h1>
      <p className={s.muted}>Toutes en 30 minutes maximum, pour toute la famille.</p>
      {SECTIONS.map((sec) => (
        <Card key={sec.type}>
          <h2>{sec.label}</h2>
          {ok.filter((r) => r.type === sec.type).map((r) => (
            <div key={r.id} className={s.ing}>
              <Link to={`/assiette/recette/${r.id}`}>{r.name}</Link>
              <span className={s.small}>{r.minutes} min{r.cuisine === 'senegalaise' ? ' · 🇸🇳' : ''}</span>
            </div>
          ))}
        </Card>
      ))}
    </>
  );
}
