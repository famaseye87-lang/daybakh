import type { Profile } from '../../types';
import { Card, Stat } from '../../components/ui';
import { Header } from './Header';
import { computeSummary } from '../../domain/summary';
import { todayISO, formatDateFR } from '../../domain/dates';
import msg from '../../content/messages.json';

const PHASE_LABEL = { start: 'Démarrage', loss: 'Perte', consolidation: 'Consolidation', maintenance: 'Maintien' } as const;

export function Today({ profile }: { profile: Profile }) {
  const today = todayISO();
  const started = today >= profile.programStartDate;
  const sm = computeSummary(profile, started ? today : profile.programStartDate);
  const hello = profile.firstName ? `Bonjour ${profile.firstName} !` : 'Bonjour !';
  return (
    <>
      <Header />
      <h1>{hello}</h1>
      {!started ? (
        <Card tone="success">
          <p><strong>Ton programme démarre le {formatDateFR(profile.programStartDate)}.</strong></p>
          <p>D'ici là, rien à faire de spécial : bois de l'eau, et prépare ton tapis. {msg.welcome.meaning}</p>
        </Card>
      ) : (
        <Card tone="success">
          <p><strong>Semaine {sm.week} · phase {PHASE_LABEL[sm.phase]}</strong></p>
        </Card>
      )}
      <Card>
        <h2>Tes repères du moment</h2>
        <Stat label="Repère calorique" value={`${sm.intake.kcal.toLocaleString('fr-FR')} kcal`} />
        <Stat label="Protéines" value={`${sm.protein.min}–${sm.protein.max} g`} />
        <Stat label="Boissons" value={`${sm.water.min.toLocaleString('fr-FR')}–${sm.water.max.toLocaleString('fr-FR')} L`} />
      </Card>
      <Card tone="info">
        <p>Séance du jour, menu, eau et sommeil s'afficheront ici dans les prochaines livraisons.</p>
      </Card>
    </>
  );
}
