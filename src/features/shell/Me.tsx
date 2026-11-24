import { Link } from 'react-router-dom';
import type { Profile } from '../../types';
import { Card, Stat } from '../../components/ui';
import { Header } from './Header';
import { WEEKDAYS } from '../../domain/dates';

const dayName = (n: number) => WEEKDAYS.find((w) => w.value === n)?.long ?? '';

export function Me({ profile: p }: { profile: Profile }) {
  return (
    <>
      <Header />
      <h1>Moi</h1>
      <Card>
        <Stat label="Taille" value={`${p.heightCm} cm`} />
        <Stat label="Poids de départ" value={`${p.startWeightKg.toLocaleString('fr-FR')} kg`} />
        {p.targetWeightKg && <Stat label="Poids cible" value={`${p.targetWeightKg.toLocaleString('fr-FR')} kg`} />}
        <Stat label="Rythme" value={p.deficitLevel === 'soft' ? 'Doux' : 'Normal'} />
        <Stat label="Renforcement" value={p.homeWorkoutDays.map(dayName).join(', ') || '—'} />
        <Stat label="Sommeil" value={`${p.sleepHours.toLocaleString('fr-FR')} h`} />
      </Card>
      <Card tone="info">
        <p>La modification du profil, l'export/import et le guide d'installation arrivent dans les prochaines livraisons.</p>
      </Card>
      <Card>
        <Link to="/a-propos">À propos de Daybakh</Link>
      </Card>
    </>
  );
}
