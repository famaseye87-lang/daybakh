import { Card } from '../../components/ui';
import { Logo } from '../../components/Logo';
import msg from '../../content/messages.json';
import pkg from '../../../package.json';

export function About() {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Logo size={96} />
        <h1 style={{ color: 'var(--c-brand)', marginTop: 12 }}>Daybakh</h1>
        <p><strong>{msg.welcome.slogan}</strong></p>
      </div>
      <Card>
        <h2>Pourquoi « Daybakh » ?</h2>
        <p>{msg.welcome.meaning} C'est ce qu'on se dit quand la semaine est chargée, quand la balance ne bouge pas, quand la nuit a été courte : ça va aller.</p>
      </Card>
      <Card>
        <h2>Notre philosophie</h2>
        <p>Progresser à ton rythme, sans culpabilité. Pas de régime extrême, pas d'aliment interdit, pas de rappel qui gronde. Une séance faite est une victoire ; une séance manquée n'est pas un échec.</p>
      </Card>
      <Card tone="info">
        <h2>Santé</h2>
        {msg.health.points.map((p) => <p key={p}>{p}</p>)}
      </Card>
      <Card>
        <h2>Tes données</h2>
        <p>Tout reste sur ton téléphone. Aucun compte, aucun serveur. Pense à exporter tes données une fois par mois.</p>
      </Card>
      <Card>
        <h2>Sources des calculs</h2>
        <ul>
          <li>OMS — classification de l'IMC</li>
          <li>Mifflin, St Jeor et al., 1990 — métabolisme de base</li>
          <li>EFSA, 2013 — besoins en énergie (niveaux d'activité, allaitement)</li>
          <li>EFSA, 2010 — besoins en eau</li>
          <li>NICE NG246, 2022 — tour de taille / taille</li>
          <li>NHLBI (NIH), 1998 — apports minimaux</li>
          <li>Leidy et al., 2015 — protéines</li>
          <li>Helms et al., 2014 — rythme de perte</li>
        </ul>
      </Card>
      <p style={{ textAlign: 'center', color: 'var(--c-muted)' }}>Version {pkg.version}</p>
    </>
  );
}
