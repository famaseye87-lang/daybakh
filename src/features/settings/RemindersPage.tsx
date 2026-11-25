import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Checkbox, TextField } from '../../components/ui';
import { buildIcs, type Reminder } from '../../domain/export/ics';
import { buildWeek } from '../../domain/sport/week';
import { shareOrDownload } from '../../data/files';
import type { AppData } from '../../hooks/useAppData';

/** Rappels dans l'agenda du téléphone (§ B, § H) : aucun serveur, l'agenda se charge de sonner. */
export function RemindersPage({ data }: { data: AppData }) {
  const p = data.profile;
  const plan = buildWeek(p, data.weekOverride);
  const strengthDays = plan.filter((d) => d.items.some((i) => ['A', 'B', 'C'].includes(i.kind))).map((d) => d.day);
  const [on, setOn] = useState({ pesee: true, seances: true, collation: false, batch: true, export: true });
  const [times, setTimes] = useState({ pesee: '07:00', seances: '18:30', collation: p.mealTimes.snack.slice(0, 5), batch: p.batchCooking.slot === 'morning' ? '09:00' : '14:00', export: '10:00' });
  const [done, setDone] = useState(false);

  const all: (Reminder & { key: keyof typeof on; label: string })[] = [
    { key: 'pesee', label: 'Ma mesure du lundi', id: 'pesee', title: 'Daybakh · ma mesure', description: 'Le matin, à jeun, après être passé·e aux toilettes. 2 minutes.', repeat: [1], time: times.pesee, minutes: 10 },
    { key: 'seances', label: 'Mes séances de renforcement', id: 'seances', title: 'Daybakh · ma séance', description: 'Ta séance du jour t’attend dans Daybakh. Une séance faite est une victoire.', repeat: strengthDays.length ? strengthDays : [1], time: times.seances, minutes: p.sessionMinutes },
    { key: 'collation', label: 'Ma collation de l’après-midi', id: 'collation', title: 'Daybakh · collation', description: 'Une collation pour passer l’après-midi sans fringale.', repeat: 'daily', time: times.collation, minutes: 10 },
    { key: 'batch', label: 'Mon batch cooking', id: 'batch', title: 'Daybakh · batch cooking', description: 'Le plan et la liste de courses sont dans l’onglet Assiette.', repeat: [p.batchCooking.day], time: times.batch, minutes: 120 },
    { key: 'export', label: 'Ma sauvegarde mensuelle', id: 'export', title: 'Daybakh · sauvegarde', description: 'Moi > Mes données > Exporter ma sauvegarde.', repeat: 'monthly', time: times.export, minutes: 5 }
  ];

  const add = async () => {
    const chosen = all.filter((r) => on[r.key]);
    const ics = buildIcs(chosen, data.today);
    await shareOrDownload(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'daybakh-rappels.ics');
    setDone(true);
  };

  return (
    <>
      <p><Link to="/moi">← Moi</Link></p>
      <h1>Rappels dans mon agenda</h1>
      <Card tone="info">
        <p>Daybakh ne t'envoie pas de notifications : tes rappels vont dans l'agenda de ton téléphone, qui sonne à l'heure choisie. Tu peux les modifier ou les supprimer dans l'agenda à tout moment.</p>
      </Card>
      {all.map((r) => (
        <Card key={r.key}>
          <Checkbox checked={on[r.key]} onChange={(v) => setOn((o) => ({ ...o, [r.key]: v }))}>{r.label}</Checkbox>
          {on[r.key] && <TextField type="time" label="Heure" value={times[r.key]} onChange={(v) => setTimes((t) => ({ ...t, [r.key]: v }))} />}
        </Card>
      ))}
      <Button block disabled={!Object.values(on).some(Boolean)} onClick={add}>Ajouter à mon agenda</Button>
      {done && (
        <Card tone="success">
          <p><strong>Fichier de rappels créé.</strong></p>
          <p>iPhone : touche le fichier puis « Ajouter tout ». Android : ouvre-le avec Google Agenda.</p>
        </Card>
      )}
    </>
  );
}
