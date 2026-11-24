import { Link } from 'react-router-dom';
import { Card, Stat } from '../../components/ui';
import { walkTarget } from '../../domain/sport/walkswim';
import type { AppData } from '../../hooks/useAppData';
import { sportContext } from './useSport';
import { LogActivity } from './LogActivity';
import s from './sport.module.css';

export function WalkPage({ data }: { data: AppData }) {
  const ctx = sportContext(data);
  const t = walkTarget(ctx.week);
  const hasTreadmill = data.profile.equipment.includes('treadmill');
  return (
    <>
      <p><Link to="/sport">← Sport</Link></p>
      <h1>Marche</h1>
      <p className={s.muted}>Dehors ou sur le tapis de course. On progresse d'abord en durée, puis en allure, puis en pente.</p>
      <Card>
        <h2>Cette semaine : priorité à {t.focus === 'durée' ? 'la durée' : t.focus === 'allure' ? "l'allure" : 'la pente'}</h2>
        <Stat label="Durée" value={`${t.minutes} min`} />
        {hasTreadmill && <Stat label="Vitesse sur tapis (repère)" value={`${t.speedKmh.toLocaleString('fr-FR')} km/h`} />}
        {hasTreadmill && <Stat label="Pente sur tapis" value={`${t.inclinePct} %`} />}
        <p className={s.small} style={{ marginTop: 8 }}>{t.tip} Vitesses et pentes sont des repères Daybakh : adapte-les à ton ressenti.</p>
      </Card>
      <Card tone="info">
        <p>Option après le renforcement : 10 à 15 min de marche sur tapis, à allure tranquille.</p>
      </Card>
      <LogActivity kind="walk" defaultMinutes={t.minutes} today={data.today} />
    </>
  );
}
