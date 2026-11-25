/** Rappels pour l'agenda du téléphone (fichier .ics, RFC 5545). Heures « flottantes » : l'heure locale du téléphone. */
export interface Reminder {
  id: string;
  title: string;
  description: string;
  /** Jours ISO (1 = lundi) pour une répétition hebdomadaire ; 'daily' ; ou 'monthly' (le 1er du mois) */
  repeat: number[] | 'daily' | 'monthly';
  time: string; // HH:MM
  minutes: number;
}

const BYDAY = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Plie les lignes à 75 octets (exigence du format). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

/** Première occurrence à partir de startISO (AAAA-MM-JJ). */
function firstDate(startISO: string, r: Reminder): string {
  const d = new Date(startISO + 'T12:00:00');
  if (r.repeat === 'monthly') {
    if (d.getDate() !== 1) d.setMonth(d.getMonth() + 1, 1);
  } else if (Array.isArray(r.repeat)) {
    for (let i = 0; i < 7; i++) {
      const iso = ((d.getDay() + 6) % 7) + 1;
      if (r.repeat.includes(iso)) break;
      d.setDate(d.getDate() + 1);
    }
  }
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export function buildIcs(reminders: Reminder[], startISO: string, now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Daybakh//Rappels//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Daybakh'];
  for (const r of reminders) {
    const day = firstDate(startISO, r);
    const [hh, mm] = r.time.split(':').map(Number);
    const start = `${day}T${pad(hh)}${pad(mm)}00`;
    const endMin = hh * 60 + mm + r.minutes;
    const end = `${day}T${pad(Math.floor(endMin / 60) % 24)}${pad(endMin % 60)}00`;
    const rrule =
      r.repeat === 'daily' ? 'FREQ=DAILY' : r.repeat === 'monthly' ? 'FREQ=MONTHLY;BYMONTHDAY=1' : `FREQ=WEEKLY;BYDAY=${r.repeat.map((d) => BYDAY[d]).join(',')}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:daybakh-${r.id}-${startISO}@daybakh.app`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `RRULE:${rrule}`,
      `SUMMARY:${esc(r.title)}`,
      `DESCRIPTION:${esc(r.description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(r.title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
