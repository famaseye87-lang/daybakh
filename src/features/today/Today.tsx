import { Card, Stat, Button, LinkButton } from '../../components/ui';
import { Header } from '../shell/Header';
import { formatDateFR } from '../../domain/dates';
import { measuredThisWeek } from '../../domain/calc/recalc';
import { setMeta, deleteMeta } from '../../data/repositories';
import { META } from '../../data/recalcService';
import type { AppData } from '../../hooks/useAppData';
import msg from '../../content/messages.json';

const PHASE_LABEL = { start: 'Démarrage', loss: 'Perte', consolidation: 'Consolidation', maintenance: 'Maintien' } as const;
const n = (v: number, d = 0) => v.toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d });

function RecalcCard({ data }: { data: AppData }) {
  const idx = data.snapshots.findIndex((x) => x.id === data.pendingRecalcId);
  if (idx < 0) return null;
  const now = data.snapshots[idx];
  const before = data.snapshots[idx - 1];
  return (
    <Card tone="success">
      <h2>Tes repères sont mis à jour</h2>
      <p>Comme toutes les 4 semaines, Daybakh a recalculé tes besoins à partir de tes dernières pesées.</p>
      {before && (
        <>
          <Stat label="Poids de référence" value={`${n(before.refWeightKg, 1)} → ${n(now.refWeightKg, 1)} kg`} />
          <Stat label="Repère calorique" value={`${n(before.targetKcal)} → ${n(now.targetKcal)} kcal`} />
          <Stat label="Protéines" value={`${now.proteinMinG}–${now.proteinMaxG} g`} />
        </>
      )}
      <Button onClick={() => deleteMeta(META.pendingRecalc)}>Compris</Button>
    </Card>
  );
}

export function Today({ data }: { data: AppData }) {
  const { profile: p, summary: sm, today } = data;
  const started = today >= p.programStartDate;
  const hello = p.firstName ? `Bonjour ${p.firstName} !` : 'Bonjour !';
  const isMonday = new Date(today + 'T12:00:00').getDay() === 1;
  const needsMeasure = !measuredThisWeek(data.measurements, today);
  const showVictory = !!data.goalReachedAt && !data.goalCelebrated;

  return (
    <>
      <Header />
      <h1>{hello}</h1>

      {showVictory && (
        <Card tone="success">
          <h2>Objectif atteint 🎉</h2>
          <p>Tu l'as fait, à ton rythme. Daybakh passe en <strong>mode maintien</strong> : ton repère calorique devient égal à ta dépense, et on garde le cap sur la forme.</p>
          <Button onClick={() => setMeta(META.goalCelebrated, true)}>Merci !</Button>
        </Card>
      )}

      {data.pendingRecalcId !== null && <RecalcCard data={data} />}

      {!started ? (
        <Card tone="success">
          <p><strong>Ton programme démarre le {formatDateFR(p.programStartDate)}.</strong></p>
          <p>D'ici là, rien de spécial à faire : bois de l'eau et prépare ton tapis. {msg.welcome.meaning}</p>
        </Card>
      ) : (
        <Card tone="success">
          <p><strong>Semaine {sm.week} · phase {PHASE_LABEL[sm.phase]}</strong></p>
        </Card>
      )}

      {needsMeasure && (
        <Card>
          <h2>{isMonday ? "C'est lundi : ta mesure" : 'Ta mesure de la semaine'}</h2>
          <p>{isMonday ? 'Le matin, à jeun : 2 minutes et c’est fait.' : 'Quand tu veux cette semaine, le matin à jeun de préférence.'}</p>
          <LinkButton to="/progres/mesure">Me mesurer</LinkButton>
        </Card>
      )}

      <Card>
        <h2>Tes repères du moment</h2>
        <Stat label="Repère calorique" value={`${n(sm.intake.kcal)} kcal`} />
        <Stat label="Protéines" value={`${sm.protein.min}–${sm.protein.max} g`} />
        <Stat label="Boissons" value={`${n(sm.water.min, 1)}–${n(sm.water.max, 1)} L`} />
      </Card>
      <Card tone="info">
        <p>Séance du jour, menu, eau et sommeil s'afficheront ici dans les prochaines livraisons.</p>
      </Card>
    </>
  );
}
