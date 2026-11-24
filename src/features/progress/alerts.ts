import { weeklyMeasure, fastLossAlert, plateauAlert } from '../../domain/calc/trends';
import type { AppData } from '../../hooks/useAppData';

export type AlertType = 'fastLoss' | 'plateau' | 'plateauNoDeficit';

export interface ActiveAlert {
  type: AlertType;
  /** Clé méta pour « compris » (une fois par semaine de mesure) */
  key: string;
}

/** Alertes du tableau de bord (§ D), non encore lues. */
export function activeAlerts(data: AppData): ActiveAlert[] {
  const weekly = weeklyMeasure(data.measurements, 'weightKg');
  if (weekly.length < 2 || data.today < data.profile.programStartDate) return [];
  const lastWeek = weekly[weekly.length - 1].week;
  const mode = data.summary.intake.mode;
  const out: ActiveAlert[] = [];
  if (mode === 'loss' && fastLossAlert(weekly)) out.push({ type: 'fastLoss', key: `alert:fastLoss:${lastWeek}` });
  if (plateauAlert(weekly)) {
    if (mode === 'loss') out.push({ type: 'plateau', key: `alert:plateau:${lastWeek}` });
    else if (mode === 'breastfeeding') out.push({ type: 'plateauNoDeficit', key: `alert:plateauNoDeficit:${lastWeek}` });
  }
  return out.filter((a) => !data.dismissedAlerts.has(a.key));
}
