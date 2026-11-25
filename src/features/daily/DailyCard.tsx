import { useState } from 'react';
import { Card, Choice, NumberField } from '../../components/ui';
import { patchDailyLog } from '../../data/daily';
import { waterGoalGlasses } from '../../domain/tracking/score';
import type { AppData } from '../../hooks/useAppData';
import s from './daily.module.css';

const ENERGY = [
  { value: 1, label: '😴 1' },
  { value: 2, label: '2' },
  { value: 3, label: '🙂 3' },
  { value: 4, label: '4' },
  { value: 5, label: '⚡ 5' }
] as const;

/** Suivi du jour (§ G.1) : eau, sommeil de la nuit, énergie, marche. Une ligne par jour, modifiable à tout moment. */
export function DailyCard({ data }: { data: AppData }) {
  const date = data.today;
  const log = data.dailyLogs.find((l) => l.date === date) ?? { date, waterGlasses: 0 };
  const goal = waterGoalGlasses(data.summary.water.min);
  const [walkOpen, setWalkOpen] = useState(false);
  const set = (patch: Parameters<typeof patchDailyLog>[1]) => patchDailyLog(date, patch);
  const sleep = log.sleepHours;

  return (
    <Card>
      <h2>Mon suivi du jour</h2>

      <div className={s.row}>
        <div>
          <strong>Eau</strong>
          <div className={s.muted}>{log.waterGlasses} verre{log.waterGlasses > 1 ? 's' : ''} sur {goal} ({data.summary.water.min.toLocaleString('fr-FR')} L)</div>
        </div>
        <div className={s.stepper}>
          <button type="button" className={s.round} aria-label="Un verre de moins" disabled={log.waterGlasses === 0} onClick={() => set({ waterGlasses: Math.max(0, log.waterGlasses - 1) })}>−</button>
          <button type="button" className={s.round} aria-label="Un verre de plus" onClick={() => set({ waterGlasses: log.waterGlasses + 1 })}>+</button>
        </div>
      </div>
      <div className={s.glasses} aria-hidden="true">
        {Array.from({ length: Math.max(goal, log.waterGlasses) }, (_, i) => (
          <span key={i} className={[s.glass, i < log.waterGlasses ? s.glassFull : ''].join(' ')} />
        ))}
      </div>
      {log.waterGlasses >= goal && <p className={s.muted}>Objectif d'hydratation atteint 💧</p>}

      <div className={s.section}>
        <div className={s.row}>
          <div>
            <strong>Sommeil cette nuit</strong>
            <div className={s.muted}>{sleep === undefined ? 'Pas encore noté' : `${sleep.toLocaleString('fr-FR')} h`}</div>
          </div>
          <div className={s.stepper}>
            <button type="button" className={s.round} aria-label="Moins 30 minutes" onClick={() => set({ sleepHours: Math.max(0, (sleep ?? data.profile.sleepHours) - 0.5) })}>−</button>
            <span className={s.value}>{(sleep ?? data.profile.sleepHours).toLocaleString('fr-FR')} h</span>
            <button type="button" className={s.round} aria-label="Plus 30 minutes" onClick={() => set({ sleepHours: Math.min(14, (sleep ?? data.profile.sleepHours) + 0.5) })}>+</button>
          </div>
        </div>
        {sleep === undefined && (
          <button type="button" className={s.round} style={{ width: 'auto', padding: '0 16px', borderRadius: 999, fontSize: '0.95rem' }}
            onClick={() => set({ sleepHours: data.profile.sleepHours })}>Valider {data.profile.sleepHours.toLocaleString('fr-FR')} h</button>
        )}
        <Choice label="Qualité" value={log.sleepQuality} onChange={(v) => set({ sleepQuality: v })}
          options={[{ value: 'good', label: 'Bonne' }, { value: 'average', label: 'Moyenne' }, { value: 'interrupted', label: 'Interrompue' }]} />
      </div>

      <div className={s.section}>
        <Choice label="Mon énergie aujourd'hui" value={log.energy} onChange={(v) => set({ energy: v })}
          options={ENERGY.map((e) => ({ value: e.value, label: e.label }))} />
      </div>

      <div className={s.section}>
        {!walkOpen && !log.walkMinutes && !log.steps ? (
          <button type="button" className={s.round} style={{ width: 'auto', padding: '0 16px', borderRadius: 999, fontSize: '0.95rem' }} onClick={() => setWalkOpen(true)}>+ Ajouter de la marche</button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <NumberField label="Marche" unit="min" value={log.walkMinutes} onChange={(v) => set({ walkMinutes: v })} />
            <NumberField label="ou pas" value={log.steps} onChange={(v) => set({ steps: v })} />
          </div>
        )}
      </div>
    </Card>
  );
}
