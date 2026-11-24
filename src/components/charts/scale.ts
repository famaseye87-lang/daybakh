/** Outils d'échelle pour les graphiques SVG (purs, testables). */
const DAY = 86400000;
export const toTime = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00').getTime();

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function shortDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** Graduations « rondes » : 3 à 5 valeurs couvrant [min, max]. */
export function niceTicks(min: number, max: number, target = 4): { lo: number; hi: number; ticks: number[] } {
  if (min === max) {
    const pad = Math.abs(min) * 0.02 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * pow).find((s) => s >= raw) ?? 10 * pow;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { lo, hi, ticks };
}

/** Échelle temporelle sur un domaine de semaines. */
export function timeScale(domain: [string, string], range: [number, number]) {
  const [a, b] = [toTime(domain[0]), toTime(domain[1])];
  return (iso: string) => (a === b ? (range[0] + range[1]) / 2 : range[0] + ((toTime(iso) - a) / (b - a)) * (range[1] - range[0]));
}

export const linear = (domain: [number, number], range: [number, number]) => (v: number) =>
  range[0] + ((v - domain[0]) / (domain[1] - domain[0] || 1)) * (range[1] - range[0]);

export const weekSpan = (a: string, b: string) => Math.round((toTime(b) - toTime(a)) / (7 * DAY));

export const fmtNum = (v: number, digits = 1) =>
  v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
