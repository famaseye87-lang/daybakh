import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Stat, Button, LinkButton } from '../../components/ui';
import { Header } from './Header';
import { WEEKDAYS } from '../../domain/dates';
import { resetAllData } from '../../data/repositories';
import type { AppData } from '../../hooks/useAppData';

const dayName = (n: number) => WEEKDAYS.find((w) => w.value === n)?.long ?? '';

export function Me({ data }: { data: AppData }) {
  const p = data.profile;
  const [step, setStep] = useState<0 | 1 | 2>(0);
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
      <LinkButton to="/moi/profil">Modifier mon profil</LinkButton>
      <div style={{ height: 12 }} />
      <Card>
        <Link to="/a-propos">À propos de Daybakh</Link>
      </Card>
      <Card tone="info">
        <p>L'export/import des données et le guide d'installation arrivent dans une prochaine livraison.</p>
      </Card>
      <Card>
        <h2>Effacer mes données</h2>
        {step === 0 && (
          <>
            <p>Supprime ton profil et tout ton historique de ce téléphone.</p>
            <Button variant="secondary" onClick={() => setStep(1)}>Effacer toutes mes données</Button>
          </>
        )}
        {step === 1 && (
          <>
            <p><strong>Tout sera supprimé définitivement</strong> : profil, mesures, historique. Il n'existe aucune copie ailleurs.</p>
            <Button onClick={() => setStep(2)}>Je confirme</Button>{' '}
            <Button variant="ghost" onClick={() => setStep(0)}>Annuler</Button>
          </>
        )}
        {step === 2 && (
          <>
            <p>Dernière vérification : on efface vraiment tout ?</p>
            <Button onClick={() => resetAllData()}>Oui, tout effacer</Button>{' '}
            <Button variant="ghost" onClick={() => setStep(0)}>Non, garder</Button>
          </>
        )}
      </Card>
    </>
  );
}
