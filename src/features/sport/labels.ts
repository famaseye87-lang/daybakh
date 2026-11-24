import type { Level } from '../../domain/sport/types';
export const LEVEL_LABEL: Record<Level, string> = { easy: 'Facile', intermediate: 'Intermédiaire', advanced: 'Avancé' };
export const GROUP_LABEL: Record<string, string> = { haut: 'Haut du corps', ventre: 'Ventre (gainage)', jambes: 'Jambes et fessiers', cardio: 'Cardio' };
export const DAY_SHORT = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const fmtMin = (s: number) => `${Math.round(s / 60)} min`;
