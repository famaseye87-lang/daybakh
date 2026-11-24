import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Choice, NumberField } from '../../components/ui';
import { buildWeek, SESSION_LABEL } from '../../domain/sport/week';
import type { SessionKind, Weekday, WeekOverride } from '../../domain/sport/types';
import { setMeta, deleteMeta } from '../../data/repositories';
import type { AppData } from '../../hooks/useAppData';
import { DAY_SHORT } from './labels';

const KINDS: SessionKind[] = ['rest', 'A', 'B', 'C', 'swim', 'walk'];

export function WeekEditor({ data }: { data: AppData }) {
  const base = buildWeek(data.profile, data.weekOverride);
  const [days, setDays] = useState(() => base.map((d) => ({ day: d.day, kind: d.items[0].kind, minutes: d.items[0].minutes || 30 })));
  const navigate = useNavigate();
  const save = async () => {
    const o: WeekOverride = {};
    for (const d of days) o[d.day as Weekday] = d.kind === 'rest' ? [] : [{ kind: d.kind, minutes: d.minutes }];
    await setMeta('weekPlan', o);
    navigate('/sport');
  };
  return (
    <>
      <p><Link to="/sport">← Sport</Link></p>
      <h1>Ma semaine</h1>
      <p style={{ color: 'var(--c-muted)' }}>Une séance par jour. Garde au moins un jour de repos entre deux renforcements quand c'est possible.</p>
      {days.map((d, i) => (
        <Card key={d.day}>
          <Choice label={DAY_SHORT[d.day]} value={d.kind}
            onChange={(v) => setDays((xs) => xs.map((x, j) => (j === i ? { ...x, kind: v, minutes: v === 'swim' ? 120 : v === 'walk' ? 50 : data.profile.sessionMinutes } : x)))}
            options={KINDS.map((k) => ({ value: k, label: k === 'rest' ? 'Repos' : SESSION_LABEL[k] }))} />
          {d.kind !== 'rest' && (
            <NumberField label="Durée" unit="min" value={d.minutes} onChange={(v) => setDays((xs) => xs.map((x, j) => (j === i ? { ...x, minutes: v ?? 30 } : x)))} />
          )}
        </Card>
      ))}
      <Button block onClick={save}>Enregistrer ma semaine</Button>
      <div style={{ height: 12 }} />
      <Button block variant="ghost" onClick={async () => { await deleteMeta('weekPlan'); navigate('/sport'); }}>Revenir à la semaine générée par mon profil</Button>
    </>
  );
}
