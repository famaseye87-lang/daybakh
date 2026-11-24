import { Card } from '../../components/ui';
import { WeekChart } from '../../components/charts/WeekChart';
import { weeklyMeasure, weeklySleep, weeklyEnergy, weeklySessions, weeklyMealConformity, lastWeeks } from '../../domain/calc/trends';
import type { AppData } from '../../hooks/useAppData';

/**
 * § J — lien entre sommeil, énergie, séances, repas et poids.
 * Petits graphiques alignés sur les mêmes semaines (jamais deux axes sur un même graphique).
 */
export function SleepLinkCard({ data }: { data: AppData }) {
  const f = (pts: { week: string; value: number }[]) => lastWeeks(pts, 12, data.today);
  const sleep = f(weeklySleep(data.dailyLogs));
  const energy = f(weeklyEnergy(data.dailyLogs));
  const sessions = f(weeklySessions(data.workoutLogs));
  const meals = f(weeklyMealConformity(data.mealRatings));
  const weight = f(weeklyMeasure(data.measurements, 'weightKg'));
  const weeks = [...sleep, ...energy, ...sessions, ...meals, ...weight].map((p) => p.week).sort();
  if (!weeks.length) return null;
  const domain: [string, string] = [weeks[0], weeks[weeks.length - 1]];
  const later = 'Se remplira avec ton suivi quotidien (prochaine livraison).';

  return (
    <Card>
      <h2>Sommeil, forme et poids</h2>
      <p style={{ color: 'var(--c-muted)' }}>Les mêmes semaines, l'une sous l'autre : pour repérer, par exemple, si les semaines de nuits courtes sont aussi celles où l'énergie baisse.</p>
      <WeekChart kind="bar" title="Sommeil moyen" unit="h" domain={domain} height={125} series={[{ name: 'Sommeil', color: 'var(--chart-1)', points: sleep }]} reference={{ value: 6, label: '6 h' }} emptyText={later} />
      <WeekChart kind="line" title="Énergie (1 à 5)" unit="/5" domain={domain} height={125} yMin={1} yMax={5} series={[{ name: 'Énergie', color: 'var(--chart-1)', points: energy }]} emptyText={later} />
      <WeekChart kind="bar" title="Séances faites" unit="" digits={0} domain={domain} height={125} series={[{ name: 'Séances', color: 'var(--chart-1)', points: sessions }]} emptyText={later} />
      <WeekChart kind="bar" title="Repas conformes" unit="%" digits={0} domain={domain} height={125} yMin={0} yMax={100} series={[{ name: 'Repas', color: 'var(--chart-1)', points: meals }]} emptyText="Se remplira avec le journal photo (facultatif)." />
      <WeekChart kind="line" title="Poids" unit="kg" domain={domain} height={125} series={[{ name: 'Poids', color: 'var(--chart-1)', points: weight }]} />
    </Card>
  );
}
