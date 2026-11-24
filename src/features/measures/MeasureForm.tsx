import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, NumberField, TextField } from '../../components/ui';
import { saveMeasurement, deleteMeasurement } from '../../data/repositories';
import { runChecks } from '../../data/recalcService';
import type { AppData } from '../../hooks/useAppData';
import type { Measurement } from '../../types';
import { FIELDS, fmt1 } from './fields';
import { Silhouette } from './Silhouette';
import s from './measures.module.css';

type Values = Partial<Record<(typeof FIELDS)[number]['key'], number>>;

function validate(date: string, v: Values, today: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!date) e.date = 'Choisis la date de la mesure.';
  else if (date > today) e.date = 'La date ne peut pas être dans le futur.';
  if (!v.weightKg || v.weightKg < 30 || v.weightKg > 300) e.weightKg = 'Indique ton poids en kg (entre 30 et 300).';
  for (const f of FIELDS) {
    if (f.key === 'weightKg') continue;
    const x = v[f.key];
    if (x !== undefined && (x < 10 || x > 250)) e[f.key] = 'Valeur entre 10 et 250 cm.';
  }
  return e;
}

export function MeasureForm({ data }: { data: AppData }) {
  const { id } = useParams();
  const editing = id ? data.measurements.find((m) => m.id === Number(id)) : undefined;
  const navigate = useNavigate();
  const [date, setDate] = useState(editing?.date ?? data.today);
  const [values, setValues] = useState<Values>(() => {
    if (!editing) return {};
    const { id: _id, date: _d, ...rest } = editing;
    return rest;
  });
  const [showErrors, setShowErrors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errors = useMemo(() => validate(date, values, data.today), [date, values, data.today]);

  // Dernière valeur connue de chaque champ, affichée comme repère.
  const lastKnown = (key: (typeof FIELDS)[number]['key']) =>
    [...data.measurements].reverse().find((m) => m.id !== editing?.id && typeof m[key] === 'number')?.[key];

  const save = async () => {
    if (Object.keys(errors).length) {
      setShowErrors(true);
      return;
    }
    const m: Measurement = { date, weightKg: values.weightKg! };
    for (const f of FIELDS) if (values[f.key] !== undefined) (m as unknown as Record<string, number>)[f.key] = values[f.key]!;
    if (editing?.id) m.id = editing.id;
    await saveMeasurement(m);
    await runChecks(data.today);
    navigate('/progres?enregistre=1');
  };

  const remove = async () => {
    if (!editing?.id) return;
    await deleteMeasurement(editing.id);
    await runChecks(data.today);
    navigate('/progres');
  };

  const isFirst = editing && data.measurements[0]?.id === editing.id;

  return (
    <>
      <p><Link to="/progres">← Progrès</Link></p>
      <div className={s.formHead}>
        <Silhouette field="waistCm" size={80} />
        <div>
          <h1>{editing ? 'Modifier la mesure' : 'Ma mesure de la semaine'}</h1>
          <p className={s.muted}>Le matin, à jeun. Seul le poids est indispensable.</p>
        </div>
      </div>
      <p><Link to="/progres/guide">Comment se mesurer ?</Link></p>

      <TextField type="date" label="Date" value={date} onChange={setDate} error={showErrors ? errors.date : undefined} />
      {FIELDS.map((f) => {
        const last = lastKnown(f.key);
        return (
          <NumberField
            key={f.key}
            label={f.label}
            unit={f.unit}
            step={f.key === 'weightKg' ? 0.1 : 0.5}
            value={values[f.key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
            hint={last !== undefined ? `Dernière valeur : ${fmt1(last)} ${f.unit}` : f.key === 'weightKg' ? undefined : 'Facultatif'}
            error={showErrors ? errors[f.key] : undefined}
          />
        );
      })}

      {editing && !isFirst && (
        <Card>
          {!confirmDelete ? (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>Supprimer cette mesure</Button>
          ) : (
            <>
              <p>Supprimer la mesure du {date} ?</p>
              <div className={s.actions}>
                <Button onClick={remove}>Oui, supprimer</Button>
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Non, garder</Button>
              </div>
            </>
          )}
        </Card>
      )}

      <div className={s.spacer} />
      <div className={s.footer}>
        <Button variant="secondary" onClick={() => navigate('/progres')}>Annuler</Button>
        <Button onClick={save}>Enregistrer</Button>
      </div>
    </>
  );
}
