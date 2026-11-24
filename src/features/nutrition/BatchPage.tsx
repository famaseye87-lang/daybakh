import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { batchPlan } from '../../domain/nutrition/batch';
import type { AppData } from '../../hooks/useAppData';
import { nutritionContext } from './useNutrition';
import { DAY_LONG } from './MealLines';
import s from './nutrition.module.css';

export function BatchPage({ data }: { data: AppData }) {
  const n = nutritionContext(data);
  const big = batchPlan(n.menu, 'batch', n.family);
  const mini = batchPlan(n.menu, 'miniBatch', n.family);
  const slot = data.profile.batchCooking.slot === 'morning' ? 'matin' : 'après-midi';
  const days = (xs: number[]) => xs.map((d) => DAY_LONG[d]).join(' et ');
  return (
    <>
      <p><Link to="/assiette">← Assiette</Link></p>
      <h1>Batch cooking</h1>
      <Card>
        <h2>Samedi {slot}</h2>
        <ol>
          <li>Range les courses, sors planches, casseroles et boîtes.</li>
          <li>Lave et coupe tous les légumes des plats ci-dessous.</li>
          <li>Lance les féculents (riz, quinoa, pâtes) en même temps.</li>
          <li>Cuisine les plats, un par feu, en commençant par les plus longs.</li>
          <li>Laisse refroidir, mets en boîtes étiquetées (plat + jour), au frais.</li>
        </ol>
        {big.map((b) => (
          <div key={b.recipeId} className={s.ing}>
            <span>
              <Link to={`/assiette/recette/${b.recipeId}`}>{b.name}</Link>
              <span className={s.small} style={{ display: 'block' }}>pour {days(b.forDays)}{b.freeze ? ' · 🧊 à congeler, à décongeler au frais la veille' : ''}</span>
            </span>
            <strong>{b.portions} portions</strong>
          </div>
        ))}
      </Card>
      <Card>
        <h2>Mercredi soir · 30 min</h2>
        <p className={s.small}>Pour tenir jusqu'à vendredi. Le dîner de vendredi est rapide (moins de 30 min), parfait après la piscine.</p>
        {mini.map((b) => (
          <div key={b.recipeId} className={s.ing}>
            <span>
              <Link to={`/assiette/recette/${b.recipeId}`}>{b.name}</Link>
              <span className={s.small} style={{ display: 'block' }}>pour {days(b.forDays)}</span>
            </span>
            <strong>{b.portions} portions</strong>
          </div>
        ))}
      </Card>
      <Card tone="info">
        <p>Repère de conservation : 3 jours maximum au réfrigérateur pour un plat cuisiné. Au-delà, on congèle.</p>
      </Card>
    </>
  );
}
