import type { DayPlan, SessionKind, WeekOverride, Weekday } from './types';

interface ProfileLike {
  homeWorkoutDays: number[];
  sessionMinutes: number;
  fixedActivities: { day: number; kind: 'swim' | 'walk' | 'other'; minutes: number; label?: string }[];
}

const STRENGTH_ORDER: SessionKind[] = ['A', 'B', 'C'];

/**
 * Semaine type générée à partir du profil (§ F.1) :
 * les jours de renforcement reçoivent A, B, C dans l'ordre (puis on recommence),
 * les activités fixes (natation, marche…) s'ajoutent, les autres jours sont du repos.
 */
export function buildWeek(p: ProfileLike, override?: WeekOverride): DayPlan[] {
  const days = [...p.homeWorkoutDays].sort((a, b) => a - b);
  const strength = new Map<number, SessionKind>();
  days.forEach((d, i) => strength.set(d, STRENGTH_ORDER[i % STRENGTH_ORDER.length]));

  const week: DayPlan[] = [];
  for (let d = 1 as Weekday; d <= 7; d = (d + 1) as Weekday) {
    const ov = override?.[d];
    if (ov) {
      week.push({ day: d, items: ov.length ? ov : [{ kind: 'rest', minutes: 0 }] });
      continue;
    }
    const items: DayPlan['items'] = [];
    const s = strength.get(d);
    if (s) items.push({ kind: s, minutes: p.sessionMinutes });
    for (const a of p.fixedActivities.filter((x) => x.day === d)) items.push({ kind: a.kind, minutes: a.minutes, label: a.label });
    week.push({ day: d, items: items.length ? items : [{ kind: 'rest', minutes: 0 }] });
  }
  return week;
}

/** Jour ISO (1 = lundi) d'une date AAAA-MM-JJ. */
export function isoWeekday(iso: string): Weekday {
  const g = new Date(iso.slice(0, 10) + 'T12:00:00').getDay();
  return (g === 0 ? 7 : g) as Weekday;
}

/** Jour de sport = au moins une séance qui n'est pas du repos (sert aussi à l'assiette du jour). */
export const isSportDay = (d: DayPlan) => d.items.some((i) => i.kind !== 'rest');

export const SESSION_LABEL: Record<SessionKind, string> = {
  A: 'Renforcement A',
  B: 'Renforcement B',
  C: 'Renforcement C',
  swim: 'Natation',
  walk: 'Marche',
  other: 'Activité',
  rest: 'Repos'
};
