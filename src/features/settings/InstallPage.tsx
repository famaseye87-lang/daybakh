import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { useInstall } from '../../hooks/useInstall';

const IosShare = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ verticalAlign: -4 }}>
    <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);

export function InstallPage() {
  const { platform, installed, canPrompt, prompt } = useInstall();
  return (
    <>
      <p><Link to="/moi">← Moi</Link></p>
      <h1>Installer Daybakh</h1>
      {installed ? (
        <Card tone="success"><p><strong>Daybakh est installée sur ce téléphone.</strong> Elle fonctionne même sans connexion.</p></Card>
      ) : (
        <Card tone="info"><p>Installée, Daybakh s'ouvre comme une application, fonctionne <strong>sans connexion</strong> et protège mieux tes données.</p></Card>
      )}

      {canPrompt && !installed && (
        <Button block onClick={prompt}>Installer maintenant</Button>
      )}

      <Card>
        <h2>Sur iPhone {platform === 'ios' && '(ton téléphone)'}</h2>
        <ol>
          <li>Ouvre le lien de Daybakh dans <strong>Safari</strong> (pas dans Chrome ni depuis WhatsApp).</li>
          <li>Touche le bouton <strong>Partager</strong> <IosShare /> en bas de l'écran.</li>
          <li>Fais défiler et choisis <strong>« Sur l'écran d'accueil »</strong>.</li>
          <li>Touche <strong>Ajouter</strong> : l'icône soleil de Daybakh apparaît sur ton écran.</li>
        </ol>
        <p style={{ fontSize: '0.875rem' }}><strong>Important :</strong> sur iPhone, l'appli installée et l'onglet Safari ne partagent pas leurs données. Après l'installation, ouvre toujours Daybakh par l'icône. Si tu avais déjà commencé dans Safari, exporte ta sauvegarde depuis Safari (Moi → Mes données), puis restaure-la dans l'appli installée.</p>
      </Card>
      <Card>
        <h2>Sur Android {platform === 'android' && '(ton téléphone)'}</h2>
        <ol>
          <li>Ouvre le lien de Daybakh dans <strong>Chrome</strong>.</li>
          <li>Touche le menu <strong>⋮</strong> en haut à droite.</li>
          <li>Choisis <strong>« Installer l'application »</strong> (ou « Ajouter à l'écran d'accueil »).</li>
          <li>Confirme : Daybakh apparaît avec tes autres applications.</li>
        </ol>
      </Card>
      <Card>
        <h2>Partager Daybakh</h2>
        <p>Chaque personne installe Daybakh sur son propre téléphone : un profil par téléphone, et les données de chacun restent chez soi.</p>
        <p style={{ wordBreak: 'break-all' }}><strong>{window.location.origin + window.location.pathname}</strong></p>
      </Card>
    </>
  );
}
