export type Sex = 'F' | 'M';
export type Goal = 'lose' | 'maintain' | 'fitness';
export type Breastfeeding = 'no' | 'partial' | 'exclusive';
export type DeficitLevel = 'soft' | 'normal';
/** ISO : 1 = lundi … 7 = dimanche */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Equipment = 'mat' | 'treadmill' | 'chair';
export type FixedActivityKind = 'swim' | 'walk' | 'other';

export interface Person {
  label: string;
  age: number;
}

export interface FixedActivity {
  day: Weekday;
  kind: FixedActivityKind;
  minutes: number;
  label?: string;
}

export interface MealTimes {
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
}

export interface Profile {
  id: 'me';
  firstName?: string;
  sex: Sex;
  birthDate: string;
  heightCm: number;
  startWeightKg: number;
  goal: Goal;
  targetWeightKg?: number;
  deficitLevel: DeficitLevel;
  pregnant: boolean;
  breastfeeding: Breastfeeding;
  babyBirthDate?: string;
  /** Cible fixée par un professionnel de santé (mode allaitement), en kcal */
  proTargetKcal?: number;
  lastDeliveryDate?: string;
  medicalClearance: boolean;
  perinealCheckDone: 'yes' | 'no' | 'na';
  foodConstraints: string[];
  household: Person[];
  equipment: Equipment[];
  homeWorkoutDays: Weekday[];
  sessionMinutes: number;
  fixedActivities: FixedActivity[];
  mealTimes: MealTimes;
  batchCooking: { day: Weekday; slot: 'morning' | 'afternoon' };
  breakfastPref: 'sweet' | 'savory' | 'both';
  caffeine: { drinks: boolean; cupsPerDay: number };
  sleepHours: number;
  sleepInterrupted: boolean;
  napOverride?: number;
  healthDisclaimerAcceptedAt: string;
  programStartDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Measurement {
  id?: number;
  date: string;
  weightKg: number;
  waistCm?: number;
  bellyCm?: number;
  hipsCm?: number;
  armRightCm?: number;
  armLeftCm?: number;
  thighCm?: number;
}

export interface DailyLog {
  date: string;
  workout?: 'done' | 'partial' | 'postponed';
  swim?: boolean;
  walkMinutes?: number;
  steps?: number;
  waterGlasses: number;
  sleepHours?: number;
  sleepQuality?: 'good' | 'average' | 'interrupted';
  energy?: 1 | 2 | 3 | 4 | 5;
}

export interface WorkoutLog {
  id?: number;
  date: string;
  kind: 'A' | 'B' | 'C' | 'swim' | 'walk' | 'hiit';
  minutes: number;
  feeling?: 'easy' | 'ok' | 'hard';
  painStop?: boolean;
}

export type MealTag = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'free';

export interface MealPhoto {
  id?: number;
  date: string;
  meal: MealTag;
  blob: Blob;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  conformity?: 'yes' | 'almost' | 'no';
  note?: string;
  createdAt: string;
}

export type IntakeMode = 'loss' | 'maintenance' | 'breastfeeding' | 'blocked';

export interface CalcSnapshot {
  id?: number;
  date: string;
  weekIndex: number;
  refWeightKg: number;
  bmi: number;
  bmr: number;
  nap: number;
  tdee: number;
  targetKcal: number;
  floorApplied: boolean;
  proteinMinG: number;
  proteinMaxG: number;
  mode: IntakeMode;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}
