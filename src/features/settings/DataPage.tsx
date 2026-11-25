import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { exportJson, exportCsv, importBackup, persistStatus } from '../../data/backupService';
import { requestPersistentStorage } from '../../data/repositories';
import { parseBackup, type Backup, type BackupSummary } from '../../domain/export/backup';
import { formatDateFR } from '../../domain/dates';
import type { AppData } from '../../hooks/useAppData';

export function DataPage({ data, lastExport }: { data: AppData; lastExport?: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<{ backup: Backup; summary: BackupSummary } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | undefined>();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { persistStatus().then(setPersisted); }, []);

  const onFile = async (f?: File) => {
    setError(null);
    setPending(null);
    if (!f) return;
    const r = parseBackup(await f.text());
    if (r.ok) setPending({ backup: r.backup, summary: r.summary });
    else setError(r.error);
    if (input.current) input.current.value = '';
  };

  return (
    <>
      <p><Link to="/moi">← Moi</Link></p>
      <h1>Mes données</h1>
      <Card tone="info">
        <p>Tout est stocké <strong>uniquement sur ce téléphone</strong>, sans compte ni serveur. Si tu changes de téléphone ou si tu effaces Safari/Chrome, seule une sauvegarde permet de retrouver ton historique.</p>
      </Card>

      <Card>
        <h2>Sauvegarder</h2>
        <p style={{ color: 'var(--c-muted)' }}>{lastExport ? `Dernière sauvegarde : ${formatDateFR(lastExport)}.` : 'Aucune sauvegarde pour l’instant.'}</p>
        <Button block onClick={async () => { const r = await exportJson(data.today); if (r !== 'cancelled') setMsg('Sauvegarde créée. Range-la dans tes fichiers, ton Drive ou envoie-la-toi par e-mail.'); }}>
          Exporter ma sauvegarde (JSON)
        </Button>
        {msg && <p role="status" style={{ marginTop: 8 }}>{msg}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Button variant="secondary" onClick={() => exportCsv('mesures', data.today)}>Mesures (CSV)</Button>
          <Button variant="secondary" onClick={() => exportCsv('suivi', data.today)}>Suivi (CSV)</Button>
        </div>
        <p style={{ color: 'var(--c-muted)', fontSize: '0.875rem', marginTop: 8 }}>Les CSV s'ouvrent dans Excel ou Google Sheets. Les photos s'exportent à part, depuis le <Link to="/assiette/journal">journal photo</Link>.</p>
      </Card>

      <Card>
        <h2>Restaurer une sauvegarde</h2>
        <p style={{ color: 'var(--c-muted)' }}>Pour retrouver ton historique sur un nouveau téléphone. Les données actuelles seront remplacées.</p>
        <Button variant="secondary" onClick={() => input.current?.click()}>Choisir un fichier .json</Button>
        <input ref={input} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} aria-label="Fichier de sauvegarde" />
        {error && <p role="alert" style={{ color: 'var(--c-action)', fontWeight: 700, marginTop: 8 }}>{error}</p>}
        {pending && (
          <div style={{ marginTop: 12 }}>
            <p><strong>Sauvegarde du {formatDateFR(pending.summary.exportedAt)}</strong></p>
            <ul>
              {pending.summary.from && <li>Du {formatDateFR(pending.summary.from)} au {formatDateFR(pending.summary.to!)}</li>}
              <li>{pending.summary.measurements} mesure{pending.summary.measurements > 1 ? 's' : ''}, {pending.summary.days} jour{pending.summary.days > 1 ? 's' : ''} de suivi, {pending.summary.workouts} séance{pending.summary.workouts > 1 ? 's' : ''}</li>
            </ul>
            <p>Remplacer les données de ce téléphone par cette sauvegarde ?</p>
            <Button onClick={async () => { await importBackup(pending.backup, data.today); setPending(null); setMsg('Sauvegarde restaurée. Bon retour !'); }}>Oui, restaurer</Button>{' '}
            <Button variant="ghost" onClick={() => setPending(null)}>Annuler</Button>
          </div>
        )}
      </Card>

      <Card>
        <h2>Protection contre l'effacement</h2>
        {persisted ? <p>✓ Ton navigateur s'est engagé à conserver les données de Daybakh.</p> : (
          <>
            <p style={{ color: 'var(--c-muted)' }}>Sur iPhone surtout, un site non installé peut voir ses données effacées après une longue période sans utilisation. Installe Daybakh sur l'écran d'accueil et garde l'habitude de la sauvegarde mensuelle.</p>
            <Button variant="secondary" onClick={async () => setPersisted(await requestPersistentStorage())}>Demander la protection</Button>
          </>
        )}
      </Card>
    </>
  );
}
