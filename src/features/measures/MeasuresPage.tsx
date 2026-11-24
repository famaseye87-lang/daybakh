import { Link, useLocation } from 'react-router-dom';
import { Card, Stat, LinkButton } from '../../components/ui';
import { Header } from '../shell/Header';
import { deltas, goalProgress } from '../../domain/calc/progress';
import { firstMilestone } from '../../domain/calc/body';
import { formatDateFR } from '../../domain/dates';
import type { AppData } from '../../hooks/useAppData';
import { fieldLabel, fieldUnit, fmt1, signed } from './fields';
import s from './measures.module.css';

function DeltaText({ v, unit, label }: { v?: number; unit: string; label: string }) {
  if (v === undefined) return null;
  const cls = v < 0 ? s.down : s.up;
  return (
    <span>
      {label} : <span className={cls}>{signed(v)} {unit}</span>
    </span>
  );
}

export function MeasuresPage({ data }: { data: AppData }) {
  const { profile: p, measurements: ms, summary } = data;
  const location = useLocation();
  const justSaved = new URLSearchParams(location.search).get('enregistre') === '1';
  const ds = deltas(ms);
  const latest = ms[ms.length - 1];
  const weight = ds.find((d) => d.key === 'weightKg');
  const target = p.targetWeightKg;
  const ms5 = firstMilestone(p.startWeightKg).from;
  const progress = target && weight ? goalProgress(p.startWeightKg, weight.current, target) : undefined;
  const milestonePos = target ? goalProgress(p.startWeightKg, ms5, target) : undefined;
  const waistMoved = ds.some((d) => d.key !== 'weightKg' && (d.vsStart ?? 0) < 0);

  return (
    <>
      <Header />
      <h1>Progrès</h1>

      {justSaved && (
        <Card tone="success">
          <p><strong>Mesure enregistrée.</strong> Bravo pour ta régularité, c'est elle qui fait les résultats.</p>
        </Card>
      )}

      <div className={s.actions}>
        <LinkButton to="/progres/mesure">+ Ajouter ma mesure</LinkButton>
        <Link to="/progres/guide" style={{ textAlign: 'center' }}>Comment se mesurer ?</Link>
      </div>

      {target && progress !== undefined && (
        <Card>
          <h2>Vers ton objectif</h2>
          <div className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Progression vers l'objectif">
            <div className={s.fill} style={{ width: `${progress * 100}%` }} />
            {milestonePos !== undefined && milestonePos < 1 && <div className={s.mark} style={{ left: `${milestonePos * 100}%` }} title="Palier −5 %" />}
          </div>
          <div className={s.barLegend}>
            <span>{fmt1(p.startWeightKg)} kg</span>
            <span>palier {fmt1(ms5)} kg</span>
            <span>{fmt1(target)} kg</span>
          </div>
          {data.goalReachedAt && <p><strong>Objectif atteint 🎉 Tu es en mode maintien.</strong></p>}
        </Card>
      )}

      {latest && (
        <Card>
          <h2>Dernière mesure · {formatDateFR(latest.date)}</h2>
          <ul className={s.list}>
            {ds.map((d) => (
              <li key={d.key} className={s.row}>
                <span>{fieldLabel(d.key)}</span>
                <span className={s.value}>{fmt1(d.current)} {fieldUnit(d.key)}</span>
                {(d.vsPrevious !== undefined || d.vsStart !== undefined) && (
                  <span className={s.deltas}>
                    <DeltaText v={d.vsPrevious} unit={fieldUnit(d.key)} label="vs précédente" />
                    <DeltaText v={d.vsStart} unit={fieldUnit(d.key)} label="depuis le départ" />
                  </span>
                )}
              </li>
            ))}
          </ul>
          {weight && weight.vsPrevious !== undefined && weight.vsPrevious >= 0 && waistMoved && (
            <p className={s.muted}>La balance ne bouge pas toujours, mais tes mensurations, elles, ont baissé depuis le départ. C'est un vrai progrès.</p>
          )}
        </Card>
      )}

      <Card>
        <h2>Tes repères actuels</h2>
        <Stat label="Poids de référence" value={`${fmt1(summary.weightKg)} kg`}>
          <p>Moyenne de tes 2 dernières pesées, mise à jour toutes les 4 semaines (semaine 5, 9, 13…). Tes repères restent stables entre deux recalculs.</p>
        </Stat>
        <Stat label="IMC" value={fmt1(summary.bmi)} />
        {summary.whtr && <Stat label="Tour de taille / taille" value={summary.whtr.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} />}
        <Stat label="Repère calorique" value={`${summary.intake.kcal.toLocaleString('fr-FR')} kcal`} />
      </Card>

      {ms.length > 0 && (
        <Card>
          <h2>Historique</h2>
          {[...ms].reverse().map((m) => (
            <Link key={m.id} to={`/progres/mesure/${m.id}`} className={s.hist}>
              <span>{formatDateFR(m.date)}</span>
              <strong>{fmt1(m.weightKg)} kg ›</strong>
            </Link>
          ))}
        </Card>
      )}

      <Card tone="info">
        <p>Les courbes arrivent dans la prochaine livraison.</p>
      </Card>
    </>
  );
}
