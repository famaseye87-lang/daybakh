import { Card, LinkButton } from '../../components/ui';
import { Header } from '../shell/Header';
import type { AppData } from '../../hooks/useAppData';
import { nutritionContext } from './useNutrition';
import { PlateSchema } from './PlateSchema';
import { MealLines, PlateBadge } from './MealLines';
import s from './nutrition.module.css';

export function NutritionHome({ data }: { data: AppData }) {
  const n = nutritionContext(data);
  const sm = data.summary;
  const plate = n.todayMenu.plate;
  const isBatchDay = n.todayMenu.day === 6;
  const isMiniBatch = n.todayMenu.day === 3;
  return (
    <>
      <Header />
      <h1>Assiette</h1>

      <Card>
        <div className={s.dayHead}>
          <h2 style={{ margin: 0 }}>Aujourd'hui</h2>
          <PlateBadge type={plate} />
        </div>
        <PlateSchema type={plate} />
        <p className={s.small} style={{ marginTop: 12 }}>
          {plate === 'sport'
            ? 'Jour de sport : un tiers de féculents pour recharger tes réserves.'
            : 'Jour léger : protéines et légumes à part égale, une petite touche de féculents.'}
          {' '}Protéines : une portion de la taille de ta paume à chaque repas principal.
        </p>
      </Card>

      <Card>
        <h2>Tes repas</h2>
        <MealLines day={n.todayMenu} snackTime={data.profile.mealTimes.snack} />
      </Card>

      {(isBatchDay || isMiniBatch) && (
        <Card tone="success">
          <p><strong>{isBatchDay ? 'C’est le jour du batch cooking !' : 'Ce soir : mini-batch de 30 min.'}</strong></p>
          <LinkButton to="/assiette/batch">Voir le plan</LinkButton>
        </Card>
      )}

      <div className={s.links}>
        <LinkButton variant="secondary" to="/assiette/semaine">Menu de la semaine</LinkButton>
        <LinkButton variant="secondary" to="/assiette/courses">Liste de courses</LinkButton>
        <LinkButton variant="secondary" to="/assiette/batch">Batch cooking</LinkButton>
        <LinkButton variant="secondary" to="/assiette/recettes">Recettes</LinkButton>
      </div>

      <Card tone="info">
        <p><strong>Boissons :</strong> {sm.water.min.toLocaleString('fr-FR')} à {sm.water.max.toLocaleString('fr-FR')} L par jour, surtout de l'eau.</p>
        <p className={s.small}>On ne saute pas de repas, pas de jeûne, aucun aliment interdit : on privilégie, on ne s'interdit pas.</p>
      </Card>
      <p><LinkButton variant="secondary" to="/assiette/reglages">Réglages (repas libre, smoothie…)</LinkButton></p>
    </>
  );
}
