import { Card, Button, LinkButton } from '../../components/ui';
import { setMeta } from '../../data/repositories';
import { daysBetween } from '../../domain/tracking/score';
import { useInstall } from '../../hooks/useInstall';
import type { AppData } from '../../hooks/useAppData';

/** Rappel mensuel d'export (§ G.4) : après 30 jours sans sauvegarde. */
export function ExportReminderCard({ data }: { data: AppData }) {
  const since = data.lastExportAt ?? (data.onboardedAt ?? data.profile.createdAt).slice(0, 10);
  if (daysBetween(since, data.today) < 30) return null;
  return (
    <Card tone="info">
      <p><strong>Pense à sauvegarder tes données.</strong> {data.lastExportAt ? 'Ta dernière sauvegarde date d’il y a plus d’un mois.' : 'Tu n’as pas encore fait de sauvegarde.'} Tout est sur ce téléphone : une sauvegarde protège ton historique.</p>
      <LinkButton to="/moi/donnees">Sauvegarder maintenant</LinkButton>
    </Card>
  );
}

/** Bandeau « installe l'application », qu'on peut fermer. */
export function InstallBanner({ data }: { data: AppData }) {
  const { installed, canPrompt, prompt } = useInstall();
  if (installed || data.installBannerDismissed) return null;
  return (
    <Card tone="info">
      <p><strong>Installe Daybakh sur ton écran d'accueil</strong> : elle s'ouvrira comme une application, même sans connexion.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {canPrompt ? <Button onClick={prompt}>Installer</Button> : <LinkButton to="/moi/installation">Comment faire ?</LinkButton>}
        <Button variant="ghost" onClick={() => setMeta('installBannerDismissed', true)}>Plus tard</Button>
      </div>
    </Card>
  );
}
