import { Link } from 'react-router-dom';
import { Card, Choice } from '../../components/ui';
import { setMeta } from '../../data/repositories';
import type { AppData, NutritionPrefs } from '../../hooks/useAppData';
import { WEEKDAYS } from '../../domain/dates';

export function NutritionSettings({ data }: { data: AppData }) {
  const p = data.nutritionPrefs;
  const save = (patch: Partial<NutritionPrefs>) => setMeta('nutritionPrefs', { ...p, ...patch });
  return (
    <>
      <p><Link to="/assiette">← Assiette</Link></p>
      <h1>Réglages de l'assiette</h1>
      <Card>
        <h2>Repas libre</h2>
        <p style={{ color: 'var(--c-muted)' }}>Un repas par semaine, sans culpabilité et sans « rattrapage ».</p>
        <Choice label="Jour" value={p.freeMeal.day} onChange={(v) => save({ freeMeal: { ...p.freeMeal, day: v } })}
          options={WEEKDAYS.map((w) => ({ value: w.value, label: w.short }))} />
        <Choice label="Repas" value={p.freeMeal.meal} onChange={(v) => save({ freeMeal: { ...p.freeMeal, meal: v } })}
          options={[{ value: 'lunch', label: 'Déjeuner' }, { value: 'dinner', label: 'Dîner' }]} />
      </Card>
      <Card>
        <Choice label="Smoothie vert en collation (2-3 fois par semaine)" value={p.smoothie ? 'oui' : 'non'}
          onChange={(v) => save({ smoothie: v === 'oui' })} options={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]} />
      </Card>
      <Card>
        <Choice label="Petit-déjeuner et collation dans la liste de courses" value={p.breakfastScope}
          onChange={(v) => save({ breakfastScope: v })}
          options={[{ value: 'me', label: 'Pour moi uniquement' }, { value: 'family', label: 'Pour toute la famille' }]} />
        <p style={{ color: 'var(--c-muted)', fontSize: '0.875rem' }}>Pense à régénérer ta liste de courses après un changement.</p>
      </Card>
    </>
  );
}
