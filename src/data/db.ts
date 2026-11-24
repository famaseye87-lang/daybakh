import Dexie, { type Table } from 'dexie';
import type {
  Profile,
  Measurement,
  DailyLog,
  WorkoutLog,
  MealPhoto,
  CalcSnapshot,
  MetaEntry
} from '../types';

export interface ShoppingList {
  weekStart: string;
  items: { id: string; label: string; aisle: string; qty?: string; checked: boolean; custom?: boolean }[];
}

export interface Badge {
  id: string;
  earnedAt: string;
}

/** Base locale Daybakh (IndexedDB). Aucune donnée ne quitte le téléphone. */
export class DaybakhDB extends Dexie {
  profile!: Table<Profile, 'me'>;
  measurements!: Table<Measurement, number>;
  dailyLogs!: Table<DailyLog, string>;
  workoutLogs!: Table<WorkoutLog, number>;
  mealPhotos!: Table<MealPhoto, number>;
  calcSnapshots!: Table<CalcSnapshot, number>;
  shoppingLists!: Table<ShoppingList, string>;
  badges!: Table<Badge, string>;
  meta!: Table<MetaEntry, string>;

  constructor() {
    super('daybakh');
    // Version 1 du schéma. Toute évolution = nouvelle version(n) avec upgrade().
    this.version(1).stores({
      profile: 'id',
      measurements: '++id, date',
      dailyLogs: 'date',
      workoutLogs: '++id, date, kind',
      mealPhotos: '++id, date, [date+meal]',
      calcSnapshots: '++id, date',
      shoppingLists: 'weekStart',
      badges: 'id, earnedAt',
      meta: 'key'
    });
  }
}

export const db = new DaybakhDB();
