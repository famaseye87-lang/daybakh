export type SessionKind = 'A' | 'B' | 'C' | 'swim' | 'walk' | 'other' | 'rest';
export type Level = 'easy' | 'intermediate' | 'advanced';
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DayPlan {
  day: Weekday;
  items: { kind: SessionKind; minutes: number; label?: string }[];
}

/** Semaine modifiée par l'utilisateur : liste des séances par jour. */
export type WeekOverride = Partial<Record<Weekday, { kind: SessionKind; minutes: number; label?: string }[]>>;
