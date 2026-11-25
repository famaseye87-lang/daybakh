import { useEffect, useState } from 'react';
import { Card } from '../../components/ui';
import { checkStorage, type StorageHealth } from '../../data/storageHealth';

/** Avertit quand les données risquent de ne pas être gardées d'une ouverture à l'autre. */
export function StorageWarning({ place }: { place: 'welcome' | 'app' }) {
  const [h, setH] = useState<StorageHealth | null>(null);
  useEffect(() => { checkStorage().then(setH); }, []);
  if (!h) return null;

  if (!h.writable) {
    return (
      <Card tone="info">
        <p><strong>Ce navigateur ne permet pas à Daybakh d'enregistrer tes données.</strong></p>
        <p>C'est le cas en navigation privée ou si les données de sites sont bloquées. Ouvre le lien dans <strong>Safari</strong> (iPhone) ou <strong>Chrome</strong> (Android), en fenêtre normale.</p>
      </Card>
    );
  }
  if (h.context === 'in-app') {
    return (
      <Card tone="info">
        <p><strong>Tu as ouvert Daybakh depuis une autre application</strong> (WhatsApp, Instagram…). Son navigateur intégré efface souvent les données à la fermeture.</p>
        <p>Touche ⋯ ou ⋮ puis « Ouvrir dans Safari » (ou « dans Chrome »), et installe Daybakh sur ton écran d'accueil.</p>
      </Card>
    );
  }
  if (h.tinyQuota && !h.standalone) {
    return (
      <Card tone="info">
        <p><strong>Navigation privée ?</strong> Dans une fenêtre privée, tout est effacé à la fermeture. Ouvre Daybakh dans une fenêtre normale ou installe-la.</p>
      </Card>
    );
  }
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (place === 'welcome' && ios && !h.standalone) {
    return (
      <Card tone="info">
        <p><strong>Tu as déjà commencé ?</strong> Sur iPhone, l'onglet Safari et l'icône de l'écran d'accueil ont chacun leur propre mémoire. Utilise toujours l'icône installée. Tu peux aussi restaurer une sauvegarde ci-dessous.</p>
      </Card>
    );
  }
  return null;
}
