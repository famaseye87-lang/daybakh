import { Link } from 'react-router-dom';
import { Card, Stat, Button, LinkButton } from '../../components/ui';
import { Header } from '../shell/Header';
import { formatDateFR } from '../../domain/dates';
import { measuredThisWeek } from '../../domain/calc/recalc';
import { setMeta, deleteMeta } from '../../data/repositories';
import { META } from '../../data/recalcService';
import type { AppData } from '../../hooks/useAppData';
import msg from '../../content/messages.json';
import { activeAlerts } from '../progress/alerts';
import { nutritionContext } from '../nutrition/useNutrition';
import { MealLines, PlateBadge } from '../nutrition/MealLines';
import { DailyCard } from '../daily/DailyCard';
import { SleepCard } from '../daily/SleepCard';
import { WeekScoreCard, NewBadgeCard } from '../daily/WeekScoreCard';
import { ExportReminderCard, InstallBanner } from '../settings/Banners';
import { StorageWarning } from '../shell/StorageWarning';
import { sportContext } from '../sport/useSport';
import { sessionPath } from '../sport/SportHome';
import { SESSION_LABEL } from '../../domain/sport/week';

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
  const ctx = sportContext(data);
  const nut = nutritionContext(data);
  const started = today >= p.programStartDate;
  const hello = p.firstName ? `Bonjour ${p.firstName} !` : 'Bonjour !';
  const isMonday = new Date(today + 'T12:00:00').getDay() === 1;
  const needsMeasure = !measuredThisWeek(data.measurements, today);
  const showVictory = !!data.goalReachedAt && !data.goalCelebrated;

  return (
    <>
      <Header />
      <h1>{hello}</h1>
      {!data.guideOpened && (
      <p style={{ margin: '8px 0 16px' }}>
        <Link to="/moi/guide" style={{ fontWeight: 800, textDecoration: 'underline wavy var(--c-accent) 2px', textUnderlineOffset: 5 }}>📖 Mode d'emploi : l'essentiel en 2 minutes →</Link>
      </p>
      )}

      <StorageWarning place="app" />
      <NewBadgeCard data={data} />
      <ExportReminderCard data={data} />

      {showVictory && (
        <Card tone="success">
          <h2>Objectif atteint 🎉</h2>
          <p>Tu l'as fait, à ton rythme. Daybakh passe en <strong>mode maintien</strong> : ton repère calorique devient égal à ta dépense, et on garde le cap sur la forme.</p>
          <Button onClick={() => setMeta(META.goalCelebrated, true)}>Merci !</Button>
        </Card>
      )}

      {data.pendingRecalcId !== null && <RecalcCard data={data} />}

      {activeAlerts(data).length > 0 && (
        <Card tone="info">
          <p><strong>Un conseil t'attend</strong> à propos de ton rythme.</p>
          <LinkButton to="/progres" variant="secondary">Voir dans Progrès</LinkButton>
        </Card>
      )}

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

      {!ctx.sportDisabled && (
        <Card>
          <h2>Ta séance du jour</h2>
          {ctx.todayPlan.items.map((it, i) =>
            it.kind === 'rest' ? (
              <p key={i}>Repos. La récupération fait partie de l'entraînement : profites-en pour bien t'hydrater.</p>
            ) : (
              <div key={i} style={{ marginBottom: 8 }}>
                <p><strong>{it.label ?? SESSION_LABEL[it.kind]}</strong> · {it.minutes} min{ctx.doneToday.some((w) => w.kind === it.kind) ? ' · ✓ faite' : ''}</p>
                {!ctx.doneToday.some((w) => w.kind === it.kind) && <LinkButton to={sessionPath(it.kind)}>{it.kind === 'A' || it.kind === 'B' || it.kind === 'C' ? 'Voir la séance' : 'Voir le programme'}</LinkButton>}
              </div>
            )
          )}
          {ctx.shortNight && ctx.todayPlan.items.some((it) => ['A', 'B', 'C'].includes(it.kind)) && (
            <p style={{ color: 'var(--c-muted)', marginTop: 8 }}>Nuit courte : la version « séance courte » (20-25 min) est proposée.</p>
          )}
        </Card>
      )}

      <DailyCard data={data} />
      <SleepCard data={data} />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Ton assiette du jour</h2>
          <PlateBadge type={nut.todayMenu.plate} />
        </div>
        <MealLines day={nut.todayMenu} snackTime={p.mealTimes.snack} />
        <div style={{ height: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <LinkButton variant="secondary" to="/assiette">Assiette</LinkButton>
          <LinkButton variant="secondary" to="/assiette/journal">📸 Photo</LinkButton>
        </div>
      </Card>

      {needsMeasure && (
        <Card>
          <h2>{isMonday ? "C'est lundi : ta mesure" : 'Ta mesure de la semaine'}</h2>
          <p>{isMonday ? 'Le matin, à jeun : 2 minutes et c’est fait.' : 'Quand tu veux cette semaine, le matin à jeun de préférence.'}</p>
          <LinkButton to="/progres/mesure">Me mesurer</LinkButton>
        </Card>
      )}

      <WeekScoreCard data={data} />
      <InstallBanner data={data} />

      <Card>
        <h2>Tes repères du moment</h2>
        <Stat label="Repère calorique" value={`${n(sm.intake.kcal)} kcal`} />
        <Stat label="Protéines" value={`${sm.protein.min}–${sm.protein.max} g`} />
        <Stat label="Boissons" value={`${n(sm.water.min, 1)}–${n(sm.water.max, 1)} L`} />
      </Card>
    </>
  );
}
