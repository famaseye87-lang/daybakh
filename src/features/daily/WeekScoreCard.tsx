import { Link } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { weekScore, scoreMessage, waterGoalGlasses } from '../../domain/tracking/score';
import { mondayOf } from '../../domain/calc/recalc';
import { buildWeek } from '../../domain/sport/week';
import { setMeta } from '../../data/repositories';
import badgesData from '../../content/badges.json';
import type { AppData } from '../../hooks/useAppData';
import s from './daily.module.css';

export function computeWeekScore(data: AppData) {
  return weekScore({
    monday: mondayOf(data.today),
    today: data.today,
    plan: buildWeek(data.profile, data.weekOverride),
    logs: data.dailyLogs,
    workouts: data.workoutLogs,
    photos: data.mealRatings,
    waterGoal: waterGoalGlasses(data.summary.water.min),
    since: data.profile.createdAt.slice(0, 10)
  });
}

export function WeekScoreCard({ data }: { data: AppData }) {
  const sc = computeWeekScore(data);
  return (
    <Card>
      <h2>Ma semaine</h2>
      <div className={s.scoreHead}>
        {sc.total !== null && <span className={s.scoreNum} aria-label={`Score ${sc.total} sur 100`}>{sc.total}</span>}
        <span>{scoreMessage(sc.total)}</span>
      </div>
      <ul className={s.muted} style={{ marginTop: 12 }}>
        <li>Séances : {sc.sessions.done} sur {sc.sessions.planned}</li>
        <li>Eau : objectif atteint {sc.water.days} jour{sc.water.days > 1 ? 's' : ''} sur {sc.water.counted}</li>
        <li>Sommeil noté : {sc.sleep.days} jour{sc.sleep.days > 1 ? 's' : ''} sur {sc.sleep.counted}</li>
        {sc.meals && <li>Repas conformes : {sc.meals.pct} %</li>}
      </ul>
      <p className={s.muted}>Sur 100 : séances, eau, sommeil et repas comptent chacun pour un quart (sans photo de repas, sur les trois autres). Comptent les jours passés, et aujourd'hui dès que c'est fait.</p>
      <p><Link to="/progres/badges">Mes badges ({data.badges.length})</Link></p>
    </Card>
  );
}

/** Célébration d'un nouveau badge, une seule fois. */
export function NewBadgeCard({ data }: { data: AppData }) {
  if (!data.newBadges.length) return null;
  const defs = badgesData.badges.filter((b) => data.newBadges.includes(b.id));
  return (
    <Card tone="success">
      <h2>Nouveau badge !</h2>
      {defs.map((b) => (
        <p key={b.id}><span style={{ fontSize: '1.5rem' }}>{b.icon}</span> <strong>{b.name}</strong> — {b.text}</p>
      ))}
      <Button onClick={() => setMeta('newBadges', [])}>Merci !</Button>
    </Card>
  );
}

export function BadgesPage({ data }: { data: AppData }) {
  const have = new Map(data.badges.map((b) => [b.id, b.earnedAt]));
  return (
    <>
      <p><Link to="/progres">← Progrès</Link></p>
      <h1>Mes badges</h1>
      <p className={s.muted}>Ils récompensent la régularité, jamais la perfection.</p>
      <div className={s.badges}>
        {badgesData.badges.map((b) => (
          <div key={b.id} className={[s.badge, have.has(b.id) ? s.badgeOn : s.badgeOff].join(' ')}>
            <span className={s.badgeIcon} aria-hidden="true">{b.icon}</span>
            <strong>{b.name}</strong>
            <p className={s.muted}>{have.has(b.id) ? b.text : 'À venir'}</p>
          </div>
        ))}
      </div>
    </>
  );
}
