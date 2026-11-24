import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, NumberField, Choice } from '../../components/ui';
import { db } from '../../data/db';

/** Bouton « C'est fait » pour la natation et la marche (durée modifiable). */
export function LogActivity({ kind, defaultMinutes, today }: { kind: 'swim' | 'walk'; defaultMinutes: number; today: string }) {
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState<number | undefined>(defaultMinutes);
  const [feeling, setFeeling] = useState<'easy' | 'ok' | 'hard' | undefined>();
  const navigate = useNavigate();
  if (!open) return <Button block onClick={() => setOpen(true)}>C'est fait !</Button>;
  return (
    <div>
      <NumberField label="Durée" unit="min" value={minutes} onChange={setMinutes} min={1} max={300} />
      <Choice label="Comment c'était ?" value={feeling} onChange={setFeeling}
        options={[{ value: 'easy', label: 'Facile' }, { value: 'ok', label: 'Ça allait' }, { value: 'hard', label: 'Difficile' }]} />
      <Button block disabled={!minutes} onClick={async () => {
        await db.workoutLogs.add({ date: today, kind, minutes: minutes ?? defaultMinutes, feeling });
        navigate('/sport?fait=1');
      }}>Enregistrer</Button>
    </div>
  );
}
