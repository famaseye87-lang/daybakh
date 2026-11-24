import type { AppData } from '../../hooks/useAppData';
import { buildWeek, isoWeekday } from '../../domain/sport/week';
import { circuitParams, hiitAllowed } from '../../domain/sport/progression';
import { programWeek } from '../../domain/summary';
import { C } from '../../domain/conventions';

/** Contexte sportif du jour, dérivé du profil et du suivi. */
export function sportContext(data: AppData) {
  const p = data.profile;
  const started = data.today >= p.programStartDate;
  const rawWeek = programWeek(p.programStartDate, data.today);
  const week = Math.max(1, rawWeek - data.sportWeekOffset);
  const params = circuitParams(week);
  const plan = buildWeek(p, data.weekOverride);
  const todayPlan = plan.find((d) => d.day === isoWeekday(data.today))!;
  // Dernière nuit connue : suivi du jour ou de la veille, sinon la moyenne déclarée dans le profil.
  const recent = [...data.dailyLogs].reverse().find((l) => typeof l.sleepHours === 'number' && l.date >= addDays(data.today, -1));
  const lastNight = recent?.sleepHours ?? p.sleepHours;
  const shortNight = lastNight < C.sleep.shortNightHours;
  const postpartumLocked = !!p.lastDeliveryDate && p.perinealCheckDone !== 'yes';
  const doneToday = data.workoutLogs.filter((w) => w.date === data.today);
  return {
    started,
    week,
    rawWeek,
    params,
    plan,
    todayPlan,
    lastNight,
    shortNight,
    hiit: hiitAllowed(week, lastNight),
    postpartumLocked,
    sportDisabled: p.pregnant,
    doneToday
  };
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
