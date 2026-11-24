import type { Profile } from '../../types';

const base: Profile = {
  id: 'me',
  sex: 'F',
  birthDate: '1987-03-10',
  heightCm: 165,
  startWeightKg: 82,
  goal: 'lose',
  targetWeightKg: 68,
  deficitLevel: 'normal',
  pregnant: false,
  breastfeeding: 'no',
  medicalClearance: true,
  perinealCheckDone: 'yes',
  foodConstraints: [],
  household: [],
  equipment: ['mat', 'treadmill'],
  homeWorkoutDays: [1, 3, 6],
  sessionMinutes: 35,
  fixedActivities: [
    { day: 5, kind: 'swim', minutes: 120 },
    { day: 7, kind: 'walk', minutes: 50 }
  ],
  mealTimes: { breakfast: '07:00', lunch: '12:30', snack: '15:00', dinner: '19:30-20:00' },
  batchCooking: { day: 6, slot: 'morning' },
  breakfastPref: 'sweet',
  caffeine: { drinks: true, cupsPerDay: 1 },
  sleepHours: 5,
  sleepInterrupted: false,
  healthDisclaimerAcceptedAt: '2026-11-24',
  programStartDate: '2026-11-30',
  createdAt: '2026-11-24',
  updatedAt: '2026-11-24'
};

export const make = (o: Partial<Profile> = {}): Profile => ({ ...base, ...o });

/** Profil 1 — femme, 39 ans, 165 cm, 82 kg, 5 h de sommeil (proche de la première utilisatrice) */
export const femme = make();

/** Profil 2 — homme, 45 ans, 180 cm, 95 kg, peu actif */
export const homme = make({
  sex: 'M',
  birthDate: '1981-06-01',
  heightCm: 180,
  startWeightKg: 95,
  targetWeightKg: 80,
  homeWorkoutDays: [2, 4],
  sessionMinutes: 30,
  fixedActivities: [],
  sleepHours: 7
});

/** Profil 3 — IMC en limite de plage : femme 30 ans, 160 cm */
export const limite = (weightKg: number) =>
  make({ birthDate: '1996-01-15', heightCm: 160, startWeightKg: weightKg, targetWeightKg: undefined, sleepHours: 7 });

/** Profil 4 — petite femme sédentaire : le plancher de 1 200 kcal s'applique */
export const plancher = make({
  birthDate: '1966-01-01',
  heightCm: 150,
  startWeightKg: 55,
  targetWeightKg: 50,
  homeWorkoutDays: [],
  fixedActivities: [],
  sleepHours: 7
});
