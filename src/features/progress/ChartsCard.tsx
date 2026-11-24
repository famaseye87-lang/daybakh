import { useState } from 'react';
import { Card, Choice } from '../../components/ui';
import { WeekChart, type Series } from '../../components/charts/WeekChart';
import { weeklyMeasure, lastWeeks } from '../../domain/calc/trends';
import { bmi } from '../../domain/calc/body';
import type { AppData } from '../../hooks/useAppData';

type Metric = 'weight' | 'bmi' | 'waist' | 'whtr' | 'belly' | 'hips' | 'arms' | 'thigh';
type Period = 4 | 12 | 'all';

const METRICS: { value: Metric; label: string }[] = [
  { value: 'weight', label: 'Poids' },
  { value: 'waist', label: 'Taille' },
  { value: 'belly', label: 'Ventre' },
  { value: 'hips', label: 'Hanches' },
  { value: 'arms', label: 'Bras' },
  { value: 'thigh', label: 'Cuisse' },
  { value: 'bmi', label: 'IMC' },
  { value: 'whtr', label: 'Taille / taille' }
];

export function ChartsCard({ data }: { data: AppData }) {
  const [metric, setMetric] = useState<Metric>('weight');
  const [period, setPeriod] = useState<Period>(12);
  const { measurements: ms, profile: p, today } = data;
  const f = (pts: { week: string; value: number }[]) => lastWeeks(pts, period, today);
  const one = (name: string, pts: { week: string; value: number }[]): Series[] => [{ name, color: 'var(--chart-1)', points: f(pts) }];

  let chart;
  switch (metric) {
    case 'weight':
      chart = <WeekChart kind="line" title="Poids" subtitle={p.targetWeightKg ? `Objectif : ${p.targetWeightKg.toLocaleString('fr-FR')} kg` : undefined} unit="kg" series={one('Poids', weeklyMeasure(ms, 'weightKg'))} />;
      break;
    case 'bmi':
      chart = <WeekChart kind="line" title="IMC" subtitle="Poids ÷ taille² (OMS)" unit="" series={one('IMC', weeklyMeasure(ms, 'weightKg').map((x) => ({ week: x.week, value: Math.round(bmi(x.value, p.heightCm) * 10) / 10 })))} />;
      break;
    case 'whtr':
      chart = (
        <WeekChart kind="line" title="Tour de taille ÷ taille" subtitle="Repère : moins de 0,5 (NICE, 2022)" unit="" digits={2}
          reference={{ value: 0.5, label: 'repère' }}
          series={one('Rapport', weeklyMeasure(ms, 'waistCm').map((x) => ({ week: x.week, value: x.value / p.heightCm })))}
          emptyText="Ajoute ton tour de taille dans tes mesures pour voir ce rapport." />
      );
      break;
    case 'arms':
      chart = (
        <WeekChart kind="line" title="Tour de bras" unit="cm" emptyText="Pas encore de tour de bras mesuré."
          series={[
            { name: 'Droit', color: 'var(--chart-1)', points: f(weeklyMeasure(ms, 'armRightCm')) },
            { name: 'Gauche', color: 'var(--chart-2)', points: f(weeklyMeasure(ms, 'armLeftCm')) }
          ].filter((x) => x.points.length)} />
      );
      break;
    default: {
      const key = { waist: 'waistCm', belly: 'bellyCm', hips: 'hipsCm', thigh: 'thighCm' }[metric] as 'waistCm';
      const label = METRICS.find((m) => m.value === metric)!.label;
      chart = <WeekChart kind="line" title={`Tour de ${label.toLowerCase()}`} unit="cm" series={one(label, weeklyMeasure(ms, key))} emptyText="Pas encore de valeur pour cette mesure." />;
    }
  }

  return (
    <Card>
      <h2>Tes courbes</h2>
      <Choice label="Période" value={period} onChange={setPeriod}
        options={[{ value: 4, label: '4 sem.' }, { value: 12, label: '12 sem.' }, { value: 'all', label: 'Tout' }]} />
      <Choice label="Mesure" value={metric} onChange={setMetric} options={METRICS} />
      {chart}
    </Card>
  );
}
