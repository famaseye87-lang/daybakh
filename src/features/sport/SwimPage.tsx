import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { swimPlan } from '../../domain/sport/walkswim';
import type { AppData } from '../../hooks/useAppData';
import { sportContext } from './useSport';
import { LogActivity } from './LogActivity';
import s from './sport.module.css';

export function SwimPage({ data }: { data: AppData }) {
  const ctx = sportContext(data);
  const plan = swimPlan(ctx.week);
  const minutes = data.profile.fixedActivities.find((a) => a.kind === 'swim')?.minutes ?? plan.totalMinutes;
  return (
    <>
      <p><Link to="/sport">← Sport</Link></p>
      <h1>Natation</h1>
      <p className={s.muted}>Séance débutante, {minutes} min dans l'eau. Matériel conseillé : planche et pull-buoy.</p>
      <Card tone="success">
        <p><strong>Objectif du moment :</strong> {plan.goal}</p>
        <p><strong>Bloc endurance :</strong> {plan.endurance}</p>
      </Card>
      <Card>
        <h2>Déroulé</h2>
        <ol>
          {plan.parts.map((p) => (
            <li key={p.title} style={{ marginBottom: 8 }}><strong>{p.title}</strong> ({p.minutes} min) — {p.content}</li>
          ))}
        </ol>
      </Card>
      <Card tone="info">
        <ul>{plan.tips.map((t) => <li key={t}>{t}</li>)}</ul>
      </Card>
      <LogActivity kind="swim" defaultMinutes={minutes} today={data.today} />
    </>
  );
}
