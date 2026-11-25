import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card } from '../../components/ui';
import { db } from '../../data/db';
import { saveMealPhoto, updateMealPhoto, deleteMealPhotos, storageEstimate, photosZip } from '../../data/photos';
import { shareOrDownload } from '../../data/files';
import { photosToPurge, formatBytes } from '../../domain/tracking/photos';
import { mondayOf } from '../../domain/calc/recalc';
import { weekDates } from '../../domain/tracking/score';
import { weeklyMealConformity } from '../../domain/calc/trends';
import type { AppData } from '../../hooks/useAppData';
import type { MealPhoto, MealTag } from '../../types';
import s from './journal.module.css';

const SLOTS: { meal: MealTag; label: string }[] = [
  { meal: 'breakfast', label: 'Petit-déjeuner' },
  { meal: 'lunch', label: 'Déjeuner' },
  { meal: 'snack', label: 'Collation' },
  { meal: 'dinner', label: 'Dîner' },
  { meal: 'free', label: 'Repas libre' }
];
const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** URL d'aperçu d'une photo stockée (libérée automatiquement). */
function usePhotoUrl(blob?: Blob): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

function Thumb({ photo, alt }: { photo: MealPhoto; alt: string }) {
  const url = usePhotoUrl(photo.blob);
  return url ? <img className={s.thumb} src={url} alt={alt} /> : null;
}

function Slot({ date, meal, label, photo }: { date: string; meal: MealTag; label: string; photo?: MealPhoto }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState(photo?.note ?? '');
  useEffect(() => setNote(photo?.note ?? ''), [photo?.id, photo?.note]);
  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      await saveMealPhoto(date, meal, f);
    } catch {
      setError('La photo n’a pas pu être enregistrée. Réessaie avec une autre image.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  const conf = photo?.conformity;
  return (
    <div className={s.slot}>
      <div>
        {photo ? <button type="button" onClick={() => input.current?.click()} style={{ padding: 0, border: 0, background: 'none' }} aria-label={`Remplacer la photo : ${label}`}><Thumb photo={photo} alt={label} /></button>
          : <button type="button" className={s.add} onClick={() => input.current?.click()} disabled={busy}>{busy ? '…' : '+ Photo'}</button>}
        <input ref={input} className={s.fileInput} type="file" accept="image/*" capture="environment" aria-label={`Photo : ${label}`} onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <div>
        <span className={s.label}>{label}</span>
        {error && <p className={s.muted} role="alert">{error}</p>}
        {photo && meal !== 'free' && (
          <>
            <div className={s.muted}>Mon assiette respecte les proportions du jour :</div>
            <div className={s.conf} role="radiogroup" aria-label="Conformité de l'assiette">
              {(['yes', 'almost', 'no'] as const).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={conf === c} className={conf === c ? s.on : ''}
                  onClick={() => updateMealPhoto(photo.id!, { conformity: c })}>
                  {c === 'yes' ? 'Oui' : c === 'almost' ? 'À peu près' : 'Non'}
                </button>
              ))}
            </div>
          </>
        )}
        {photo && (
          <input className={s.note} placeholder="Note (facultatif)" value={note} onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (photo.note ?? '') && updateMealPhoto(photo.id!, { note })} aria-label={`Note : ${label}`} />
        )}
        {!photo && <div className={s.muted}>Facultatif</div>}
      </div>
    </div>
  );
}

export function JournalPage({ data }: { data: AppData }) {
  const monday = mondayOf(data.today);
  const dates = weekDates(monday);
  const [day, setDay] = useState(data.today);
  const weekPhotos = useLiveQuery(() => db.mealPhotos.where('date').between(monday, dates[6], true, true).toArray(), [monday]) ?? [];
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number }>({});
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [exporting, setExporting] = useState(false);
  useEffect(() => { storageEstimate().then(setEstimate); }, [data.mealRatings.length]);

  const photosBytes = data.mealRatings.reduce((t, p) => t + (p.bytes ?? 0), 0);
  const old = photosToPurge(data.mealRatings, data.today);
  const oldBytes = old.reduce((t, p) => t + (p.bytes ?? 0), 0);
  const conformity = weeklyMealConformity(data.mealRatings.filter((p) => p.date >= monday && p.date <= dates[6]))[0]?.value;
  const daysWithPhoto = new Set(weekPhotos.map((p) => p.date));

  const exportZip = async () => {
    setExporting(true);
    try {
      const all = await db.mealPhotos.orderBy('date').toArray();
      await shareOrDownload(await photosZip(all), `daybakh-photos-${data.today}.zip`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <p><Link to="/assiette">← Assiette</Link></p>
      <h1>Journal photo</h1>
      <p className={s.muted}>Facultatif. Une photo par repas pour observer ton assiette, sans calcul de calories. Les photos restent sur ton téléphone.</p>

      <div className={s.days} role="tablist" aria-label="Jour">
        {dates.map((d, i) => (
          <button key={d} type="button" role="tab" aria-selected={d === day} className={[s.day, d === day ? s.dayOn : ''].join(' ')}
            onClick={() => setDay(d)} disabled={d > data.today}>
            {DAY_SHORT[i]}
            <span>{Number(d.slice(8))}</span>
            {daysWithPhoto.has(d) && <span className={s.dot} />}
          </button>
        ))}
      </div>

      <Card>
        {SLOTS.map((sl) => (
          <Slot key={`${day}-${sl.meal}`} date={day} meal={sl.meal} label={sl.label} photo={weekPhotos.find((p) => p.date === day && p.meal === sl.meal)} />
        ))}
      </Card>

      <Card>
        <h2>Cette semaine</h2>
        {conformity !== undefined ? <p><strong>{conformity} %</strong> de repas conformes aux proportions du jour (le repas libre ne compte pas).</p>
          : <p className={s.muted}>Pas encore d'assiette évaluée cette semaine.</p>}
        {weekPhotos.length > 0 && (
          <div className={s.grid}>
            {weekPhotos.map((p) => <Thumb key={p.id} photo={p} alt={`${p.date} ${p.meal}`} />)}
          </div>
        )}
      </Card>

      <Card>
        <h2>Espace utilisé</h2>
        <p>Photos : <strong>{formatBytes(photosBytes)}</strong> ({data.mealRatings.length} photo{data.mealRatings.length > 1 ? 's' : ''})</p>
        {estimate.usage !== undefined && <p className={s.muted}>Daybakh au total : {formatBytes(estimate.usage)}{estimate.quota ? ` sur ${formatBytes(estimate.quota)} disponibles` : ''}.</p>}
        {old.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p>{old.length} photo{old.length > 1 ? 's ont' : ' a'} plus de 8 semaines ({formatBytes(oldBytes)}). Les supprimer pour libérer de la place ?</p>
            {!confirmPurge ? <Button variant="secondary" onClick={() => setConfirmPurge(true)}>Supprimer les anciennes photos</Button> : (
              <>
                <p className={s.muted}>Pense à exporter tes photos avant si tu veux les garder.</p>
                <Button onClick={async () => { await deleteMealPhotos(old.map((p) => p.id!).filter(Boolean)); setConfirmPurge(false); }}>Oui, supprimer</Button>{' '}
                <Button variant="ghost" onClick={() => setConfirmPurge(false)}>Non</Button>
              </>
            )}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <Button variant="secondary" disabled={!data.mealRatings.length || exporting} onClick={exportZip}>{exporting ? 'Préparation…' : 'Exporter mes photos (ZIP)'}</Button>
        </div>
      </Card>
    </>
  );
}
