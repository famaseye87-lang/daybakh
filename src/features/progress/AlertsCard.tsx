import { Button, Card } from '../../components/ui';
import { saveProfile, setMeta } from '../../data/repositories';
import { kcalFloor } from '../../domain/calc/energy';
import type { AppData } from '../../hooks/useAppData';
import { activeAlerts } from './alerts';

export function AlertsCard({ data }: { data: AppData }) {
  const alerts = activeAlerts(data);
  if (!alerts.length) return null;
  const p = data.profile;
  const floor = kcalFloor(p.sex).toLocaleString('fr-FR');
  const done = (key: string) => setMeta(key, true);

  return (
    <>
      {alerts.map((a) => {
        if (a.type === 'fastLoss') {
          const canSoften = p.deficitLevel === 'normal' && data.summary.phase === 'loss';
          return (
            <Card key={a.key} tone="info">
              <h2>Tu avances vite !</h2>
              <p>Ces 2 dernières semaines, tu as perdu plus de 1 % de ton poids par semaine. Pour garder ton énergie et préserver tes muscles, on peut manger un peu plus.</p>
              {canSoften ? (
                <>
                  <p>Je te propose de passer au <strong>rythme doux (−15 %)</strong>. Tu pourras revenir au rythme normal quand tu veux, dans ton profil.</p>
                  <Button onClick={async () => { await saveProfile({ ...p, deficitLevel: 'soft' }); await done(a.key); }}>Passer au rythme doux</Button>{' '}
                  <Button variant="ghost" onClick={() => done(a.key)}>Pas maintenant</Button>
                </>
              ) : (
                <>
                  <p>Ajoute par exemple une collation (fruit + yaourt) ou une portion de féculents un peu plus généreuse les jours de sport.</p>
                  <Button onClick={() => done(a.key)}>Compris</Button>
                </>
              )}
            </Card>
          );
        }
        if (a.type === 'plateau') {
          return (
            <Card key={a.key} tone="info">
              <h2>Ton poids fait une pause</h2>
              <p>Depuis 3 semaines, la balance bouge peu. C'est normal : le corps s'adapte. Regarde aussi tes mensurations, elles baissent parfois avant le poids.</p>
              <p>Quelques ajustements possibles :</p>
              <ul>
                <li>vérifier la part de féculents les jours légers (mardi, jeudi) ;</li>
                <li>ajouter 10 à 15 min de marche sur tapis après le renforcement ;</li>
                <li>garder la collation de l'après-midi, qui évite les fringales du soir.</li>
              </ul>
              <p>Daybakh ne descendra jamais sous {floor} kcal : pas besoin de manger moins.</p>
              <Button onClick={() => done(a.key)}>Compris</Button>
            </Card>
          );
        }
        return (
          <Card key={a.key} tone="info">
            <h2>Ton poids est stable</h2>
            <p>Pendant l'allaitement, c'est tout à fait normal. Suis plutôt tes mensurations, ton énergie et tes séances : ce sont tes vrais repères en ce moment.</p>
            <Button onClick={() => done(a.key)}>Compris</Button>
          </Card>
        );
      })}
    </>
  );
}
