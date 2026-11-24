/** Date locale du téléphone au format AAAA-MM-JJ. */
export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lundi de début de programme : aujourd'hui si on est lundi, sinon le lundi suivant. */
export function nextMondayISO(fromISO: string): string {
  const d = new Date(fromISO + 'T12:00:00');
  const dow = d.getDay(); // 0 = dimanche
  const add = dow === 1 ? 0 : (8 - dow) % 7;
  d.setDate(d.getDate() + add);
  return todayISO(d);
}

export const WEEKDAYS: { value: 1 | 2 | 3 | 4 | 5 | 6 | 7; short: string; long: string }[] = [
  { value: 1, short: 'Lun', long: 'lundi' },
  { value: 2, short: 'Mar', long: 'mardi' },
  { value: 3, short: 'Mer', long: 'mercredi' },
  { value: 4, short: 'Jeu', long: 'jeudi' },
  { value: 5, short: 'Ven', long: 'vendredi' },
  { value: 6, short: 'Sam', long: 'samedi' },
  { value: 7, short: 'Dim', long: 'dimanche' }
];

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « 7 décembre 2026 » */
export function formatDateFR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** « décembre 2026 » */
export function formatMonthFR(iso: string): string {
  const [y, m] = iso.slice(0, 10).split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
