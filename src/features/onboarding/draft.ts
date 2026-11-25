import type { Profile, Measurement } from '../../types';
import presets from '../../content/presets.json';
import { ageOn, bmi, isTargetInHealthyRange } from '../../domain/calc/body';
import { isMinor } from '../../domain/guards';

/** Brouillon du profil pendant la création. */
export type Draft = Partial<Omit<Profile, 'id'>> & {
  firstMeasures: Partial<Omit<Measurement, 'id' | 'date' | 'weightKg'>>;
};

export const emptyDraft = (): Draft => ({
  goal: 'lose',
  deficitLevel: 'normal',
  pregnant: false,
  breastfeeding: 'no',
  medicalClearance: false,
  perinealCheckDone: 'na',
  foodConstraints: [],
  household: [{ label: 'Moi', age: 30 }],
  equipment: ['mat'],
  homeWorkoutDays: [1, 3, 6],
  sessionMinutes: 30,
  fixedActivities: [],
  mealTimes: { breakfast: '07:30', lunch: '12:30', snack: '16:00', dinner: '19:30' },
  batchCooking: { day: 7, slot: 'morning' },
  breakfastPref: 'both',
  caffeine: { drinks: false, cupsPerDay: 0 },
  sleepHours: 7,
  sleepInterrupted: false,
  firstMeasures: {}
});

/** Brouillon à partir d'un profil existant (modification du profil). */
export function profileToDraft(p: Profile): Draft {
  const { id: _id, ...rest } = p;
  return { ...rest, firstMeasures: {} };
}

/** Brouillon pré-rempli si l'adresse contient ?exemple=1 */
export function initialDraft(search: string): Draft {
  const d = emptyDraft();
  if (new URLSearchParams(search).get('exemple') === '1') {
    return { ...d, ...(presets.exemple as Partial<Profile>), firstMeasures: {} };
  }
  return d;
}

export type StepKey = 'toi' | 'sante' | 'objectif' | 'sport' | 'repas' | 'sommeil' | 'mesures' | 'resume';

export const STEPS: { key: StepKey; title: string }[] = [
  { key: 'toi', title: 'Faisons connaissance' },
  { key: 'sante', title: 'Ta santé' },
  { key: 'objectif', title: 'Ton objectif' },
  { key: 'sport', title: 'Ton sport' },
  { key: 'repas', title: 'Tes repas et ta famille' },
  { key: 'sommeil', title: 'Ton sommeil' },
  { key: 'mesures', title: 'Tes premières mesures' },
  { key: 'resume', title: 'Ton programme' }
];

/** Erreurs de saisie par étape (messages bienveillants). Vide = on peut continuer. */
export function validateStep(key: StepKey, d: Draft, today: string): Record<string, string> {
  const e: Record<string, string> = {};
  switch (key) {
    case 'toi':
      if (!d.sex) e.sex = 'Choisis une option pour adapter les calculs.';
      if (!d.birthDate) e.birthDate = 'Ta date de naissance sert au calcul du métabolisme.';
      else if (ageOn(d.birthDate, today) > 110 || ageOn(d.birthDate, today) < 0) e.birthDate = 'Vérifie la date saisie.';
      if (!d.heightCm || d.heightCm < 120 || d.heightCm > 230) e.heightCm = 'Indique ta taille en cm (entre 120 et 230).';
      if (!d.startWeightKg || d.startWeightKg < 30 || d.startWeightKg > 300) e.startWeightKg = 'Indique ton poids en kg (entre 30 et 300).';
      break;
    case 'sante':
      if (d.breastfeeding && d.breastfeeding !== 'no' && !d.babyBirthDate)
        e.babyBirthDate = 'La date de naissance du bébé permet d’adapter les besoins.';
      break;
    case 'objectif':
      if (d.goal === 'lose') {
        if (!d.targetWeightKg) e.targetWeightKg = 'Choisis un poids cible dans la plage santé.';
        else if (d.heightCm && !isTargetInHealthyRange(d.targetWeightKg, d.heightCm))
          e.targetWeightKg = 'Ce poids est en dehors de la plage santé (IMC 18,5 à 24,9). Choisis une valeur dans la plage.';
        else if (d.startWeightKg && d.targetWeightKg >= d.startWeightKg)
          e.targetWeightKg = 'Ton poids actuel est déjà dans ta cible : choisis plutôt « me maintenir ».';
      }
      break;
    case 'sport':
      if (!d.sessionMinutes || d.sessionMinutes < 10) e.sessionMinutes = 'Indique la durée de tes séances.';
      if ((d.fixedActivities ?? []).some((a) => !a.minutes || a.minutes <= 0)) e.fixedActivities = 'Indique une durée pour chaque activité.';
      break;
    case 'repas':
      if (!d.household || d.household.length === 0) e.household = 'Ajoute au moins une personne (toi !).';
      break;
    case 'sommeil':
      if (!d.sleepHours || d.sleepHours < 2 || d.sleepHours > 14) e.sleepHours = 'Indique une durée entre 2 et 14 h.';
      break;
    default:
      break;
  }
  return e;
}

export function isBlockedMinor(d: Draft, today: string): boolean {
  return !!d.birthDate && isMinor(ageOn(d.birthDate, today));
}

export function currentBmi(d: Draft): number | undefined {
  return d.startWeightKg && d.heightCm ? bmi(d.startWeightKg, d.heightCm) : undefined;
}

/** Transforme le brouillon validé en profil complet. */
export function draftToProfile(d: Draft, now: string, programStart: string, disclaimerAt: string): Profile {
  return {
    id: 'me',
    firstName: d.firstName?.trim() || undefined,
    sex: d.sex!,
    birthDate: d.birthDate!,
    heightCm: d.heightCm!,
    startWeightKg: d.startWeightKg!,
    goal: d.goal ?? 'fitness',
    targetWeightKg: d.goal === 'lose' ? d.targetWeightKg : undefined,
    deficitLevel: d.deficitLevel ?? 'normal',
    pregnant: d.sex === 'F' ? !!d.pregnant : false,
    breastfeeding: d.sex === 'F' ? d.breastfeeding ?? 'no' : 'no',
    babyBirthDate: d.breastfeeding && d.breastfeeding !== 'no' ? d.babyBirthDate : undefined,
    proTargetKcal: d.proTargetKcal,
    lastDeliveryDate: d.sex === 'F' ? d.lastDeliveryDate || undefined : undefined,
    medicalClearance: !!d.medicalClearance,
    perinealCheckDone: d.sex === 'F' && d.lastDeliveryDate ? d.perinealCheckDone ?? 'no' : 'na',
    foodConstraints: d.foodConstraints ?? [],
    household: d.household ?? [],
    equipment: d.equipment ?? [],
    homeWorkoutDays: d.homeWorkoutDays ?? [],
    sessionMinutes: d.sessionMinutes ?? 30,
    fixedActivities: d.fixedActivities ?? [],
    mealTimes: d.mealTimes!,
    batchCooking: d.batchCooking!,
    breakfastPref: d.breakfastPref ?? 'both',
    caffeine: d.caffeine ?? { drinks: false, cupsPerDay: 0 },
    sleepHours: d.sleepHours ?? 7,
    sleepInterrupted: !!d.sleepInterrupted,
    napOverride: d.napOverride,
    healthDisclaimerAcceptedAt: disclaimerAt,
    programStartDate: programStart,
    createdAt: now,
    updatedAt: now
  };
}
