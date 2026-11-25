import { Card, Button } from '../../components/ui';
import { setMeta } from '../../data/repositories';
import { C } from '../../domain/conventions';
import type { AppData } from '../../hooks/useAppData';
import msg from '../../content/messages.json';

/** § J : message unique sur le manque de sommeil, puis conseils discrets les jours de nuit courte. */
export function SleepCard({ data }: { data: AppData }) {
  const todayLog = data.dailyLogs.find((l) => l.date === data.today);
  const lastNight = todayLog?.sleepHours ?? data.profile.sleepHours;
  const short = lastNight < C.sleep.shortNightHours;
  if (!short) return null;
  if (!data.sleepNoticeShown) {
    return (
      <Card tone="info">
        <h2>À propos de tes nuits</h2>
        <p>{msg.sleepNotice}</p>
        <Button onClick={() => setMeta('sleepNoticeShown', true)}>Compris</Button>
      </Card>
    );
  }
  const afterTwo = new Date().getHours() >= 14;
  return (
    <Card tone="info">
      <p><strong>Nuit courte : on récupère comme on peut.</strong></p>
      <ul>
        <li>Une sieste de 10 à 20 min, ou 10 min au calme les yeux fermés, si c'est possible.</li>
        <li>La collation de 15 h aide à passer le creux de l'après-midi.</li>
        {data.profile.caffeine.drinks && <li>{afterTwo ? 'Il est plus de 14 h : plutôt de l’eau ou une infusion maintenant.' : 'Café ou thé plutôt avant 14 h.'}</li>}
        <li>Ce soir, écrans éteints un peu plus tôt et coucher à heure régulière.</li>
      </ul>
    </Card>
  );
}
