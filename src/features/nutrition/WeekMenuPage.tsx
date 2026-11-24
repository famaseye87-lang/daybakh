import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import type { AppData } from '../../hooks/useAppData';
import { nutritionContext } from './useNutrition';
import { MealLines, PlateBadge, DAY_LONG } from './MealLines';
import s from './nutrition.module.css';

const COOK: Record<string, string> = { batch: 'préparé au batch du samedi', miniBatch: 'préparé au mini-batch du mercredi', sameDay: 'cuisiné le jour même', none: '' };

export function WeekMenuPage({ data }: { data: AppData }) {
  const n = nutritionContext(data);
  return (
    <>
      <p><Link to="/assiette">← Assiette</Link></p>
      <h1>Menu de la semaine</h1>
      <p className={s.muted}>Semaine {n.week} · variante {(n.week % 3) + 1} sur 3. Le déjeuner, ce sont souvent les restes du dîner de la veille : on cuisine une fois, on mange deux fois.</p>
      {n.menu.map((d) => (
        <Card key={d.day}>
          <div className={s.dayHead}>
            <h2 style={{ margin: 0, textTransform: 'capitalize' }}>{DAY_LONG[d.day]}</h2>
            <PlateBadge type={d.plate} />
          </div>
          <MealLines day={d} snackTime={data.profile.mealTimes.snack} />
          {COOK[d.cookedOn] && <p className={s.small} style={{ marginTop: 6 }}>Dîner {COOK[d.cookedOn]}.</p>}
        </Card>
      ))}
    </>
  );
}
