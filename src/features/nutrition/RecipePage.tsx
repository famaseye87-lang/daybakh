import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../../components/ui';
import { recipeById } from '../../domain/nutrition/recipes';
import { householdFactor } from '../../domain/nutrition/shopping';
import type { AppData } from '../../hooks/useAppData';
import s from './nutrition.module.css';

const fmtQty = (q: number, unit: string) => {
  if (unit === 'g' || unit === 'ml') {
    const v = Math.round(q / 5) * 5;
    return v >= 1000 ? `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${unit === 'g' ? 'kg' : 'L'}` : `${v} ${unit}`;
  }
  const v = Math.round(q * 4) / 4;
  const txt = v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return unit === 'pièce' ? txt : `${txt} ${unit}`;
};

export function RecipePage({ data }: { data: AppData }) {
  const { id = '' } = useParams();
  const r = recipeById(id);
  const family = householdFactor(data.profile.household);
  const [servings, setServings] = useState(r?.type === 'main' ? Math.round(family * 2) / 2 : 1);
  if (!r) return <p><Link to="/assiette/recettes">← Recettes</Link> — recette introuvable.</p>;
  return (
    <>
      <p><Link to="/assiette">← Assiette</Link></p>
      <h1>{r.name}</h1>
      <p className={s.muted}>{r.minutes} min · {r.cuisine === 'senegalaise' ? 'Cuisine sénégalaise allégée' : 'Cuisine française'}{r.batch ? ' · se prépare à l’avance' : ''}</p>

      <Card>
        <div className={s.dayHead}>
          <h2 style={{ margin: 0 }}>Ingrédients</h2>
          <div className={s.stepper}>
            <button type="button" aria-label="Moins de portions" onClick={() => setServings((v) => Math.max(0.5, v - 0.5))}>−</button>
            <span><strong>{servings.toLocaleString('fr-FR')}</strong> portion{servings > 1 ? 's' : ''}</span>
            <button type="button" aria-label="Plus de portions" onClick={() => setServings((v) => v + 0.5)}>+</button>
          </div>
        </div>
        {r.type === 'main' && <p className={s.small}>Calculé pour ta famille : {family.toLocaleString('fr-FR')} portions adulte (les enfants comptent pour une demi ou trois quarts de portion).</p>}
        {r.ingredients.map((i) => (
          <div key={i.name} className={s.ing}><span>{i.name}</span><strong>{fmtQty(i.qty * servings, i.unit)}</strong></div>
        ))}
      </Card>

      <Card>
        <h2>Préparation</h2>
        <ol>{r.steps.map((x) => <li key={x}>{x}</li>)}</ol>
      </Card>
      <Card tone="success"><p><strong>Ton assiette :</strong> {r.tipPlate}</p></Card>
      <Card tone="info"><p><strong>En famille :</strong> {r.tipFamily}</p></Card>
    </>
  );
}
