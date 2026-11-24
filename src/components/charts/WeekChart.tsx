import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { niceTicks, timeScale, linear, shortDate, fmtNum, weekSpan } from './scale';
import s from './charts.module.css';

export interface Series {
  name: string;
  /** Variable CSS de couleur, ex. 'var(--chart-1)' */
  color: string;
  points: { week: string; value: number }[];
}

interface Props {
  title: string;
  subtitle?: string;
  kind: 'line' | 'bar';
  series: Series[];
  unit: string;
  digits?: number;
  /** Domaine commun de semaines (pour aligner plusieurs graphiques) */
  domain?: [string, string];
  reference?: { value: number; label: string };
  /** Bornes imposées pour l'axe des valeurs (ex. 0–100 %) */
  yMin?: number;
  yMax?: number;
  height?: number;
  emptyText?: string;
}

const W = 340;
const M = { top: 12, right: 46, bottom: 22, left: 34 };

/**
 * Graphique hebdomadaire en SVG : ligne (2 px, points ≥ 8 px avec anneau) ou barres (≤ 24 px, bout arrondi 4 px).
 * Survol / toucher : réticule + infobulle. Clavier : flèches. Tableau des valeurs en complément.
 */
export function WeekChart({ title, subtitle, kind, series, unit, digits = 1, domain, reference, yMin, yMax, height = 160, emptyText }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((x) => x.points);
  const weeks = [...new Set(all.map((p) => p.week))].sort();

  if (all.length === 0) {
    return (
      <figure style={{ margin: 0 }}>
        <p className={s.title}>{title}</p>
        <p className={s.empty}>{emptyText ?? 'Pas encore de données.'}</p>
      </figure>
    );
  }

  const dom: [string, string] = domain ?? [weeks[0], weeks[weeks.length - 1]];
  const H = height;
  const x = timeScale(dom, [M.left + 8, W - M.right]);
  const vals = all.map((p) => p.value).concat(reference ? [reference.value] : []);
  const lo0 = yMin ?? (kind === 'bar' ? 0 : Math.min(...vals));
  const hi0 = yMax ?? Math.max(...vals);
  const { lo, hi, ticks } = yMin !== undefined && yMax !== undefined ? { lo: yMin, hi: yMax, ticks: niceTicks(yMin, yMax).ticks.filter((t) => t >= yMin && t <= yMax) } : niceTicks(lo0, hi0);
  const y = linear([lo, hi], [H - M.bottom, M.top]);
  const fmt = (v: number) => `${fmtNum(v, digits)}${unit ? ' ' + unit : ''}`;

  // Largeur des barres : ≤ 24 px, jamais toute la bande.
  const nSlots = weekSpan(dom[0], dom[1]) + 1;
  const band = (W - M.left - M.right) / nSlots;
  const barW = Math.min(24, band * 0.6);

  const pick = (clientX: number) => {
    const svg = ref.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = ((clientX - r.left) / r.width) * W;
    let best = 0;
    let bd = Infinity;
    weeks.forEach((w, i) => {
      const d = Math.abs(x(w) - vx);
      if (d < bd) { bd = d; best = i; }
    });
    setHover(best);
  };
  const onPointer = (e: PointerEvent<SVGSVGElement>) => pick(e.clientX);
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight') setHover((h) => Math.min(weeks.length - 1, (h ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? weeks.length) - 1));
    else if (e.key === 'Escape') setHover(null);
  };

  const hw = hover !== null ? weeks[hover] : null;
  const showDots = weeks.length <= 16;
  const xTicks = dom[0] === dom[1] ? [dom[0]] : [dom[0], dom[1]];

  return (
    <figure style={{ margin: 0 }}>
      <p className={s.title}>{title}</p>
      {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      {series.length > 1 && (
        <div className={s.legend}>
          {series.map((se) => (
            <span key={se.name}><span className={s.swatch} style={{ background: se.color }} />{se.name}</span>
          ))}
        </div>
      )}
      <div className={s.wrap}>
        <svg
          ref={ref}
          className={s.svg}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${title}. Utilise les flèches pour parcourir les semaines.`}
          tabIndex={0}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className={s.grid} x1={M.left} x2={W - M.right + 6} y1={y(t)} y2={y(t)} />
              <text className={s.tick} x={M.left - 6} y={y(t) + 3} textAnchor="end">{fmtNum(t, digits)}</text>
            </g>
          ))}
          {xTicks.map((w, i) => (
            <text key={w} className={s.tick} x={x(w)} y={H - 6} textAnchor={xTicks.length === 1 ? 'middle' : i === 0 ? 'start' : 'end'}>{shortDate(w)}</text>
          ))}
          {reference && (
            <g>
              <line className={s.refLine} x1={M.left} x2={W - M.right + 6} y1={y(reference.value)} y2={y(reference.value)} />
              <text className={s.refLabel} x={W - M.right + 8} y={y(reference.value) + 3}>{reference.label}</text>
            </g>
          )}
          {hw && <line className={s.cross} x1={x(hw)} x2={x(hw)} y1={M.top} y2={H - M.bottom} />}

          {kind === 'bar' &&
            series.map((se) =>
              se.points.map((p) => {
                const bx = x(p.week) - barW / 2;
                const top = y(p.value);
                const base = y(Math.max(lo, 0));
                const h = Math.max(0, base - top);
                const r = Math.min(4, h, barW / 2);
                const d = `M${bx},${base} V${top + r} Q${bx},${top} ${bx + r},${top} H${bx + barW - r} Q${bx + barW},${top} ${bx + barW},${top + r} V${base} Z`;
                return <path key={p.week} d={d} fill={se.color} opacity={hw && hw !== p.week ? 0.55 : 1} />;
              })
            )}

          {kind === 'line' &&
            series.map((se) => {
              const pts = [...se.points].sort((a, b) => a.week.localeCompare(b.week));
              const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.week)},${y(p.value)}`).join(' ');
              const last = pts[pts.length - 1];
              return (
                <g key={se.name}>
                  <path d={d} fill="none" stroke={se.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                  {pts.map((p) =>
                    showDots || p === last || p.week === hw ? (
                      <circle key={p.week} cx={x(p.week)} cy={y(p.value)} r={p.week === hw ? 5.5 : 4} fill={se.color} stroke="var(--chart-surface)" strokeWidth={2} />
                    ) : null
                  )}
                  <text className={s.endLabel} x={x(last.week) + 8} y={y(last.value) + 4}>{fmtNum(last.value, digits)}</text>
                </g>
              );
            })}
        </svg>
        {hw && (
          <div className={s.tooltip} style={{ left: `${Math.min(80, Math.max(20, (x(hw) / W) * 100))}%` }} role="status">
            <strong>Semaine du {shortDate(hw)}</strong>
            {series.map((se) => {
              const p = se.points.find((q) => q.week === hw);
              return <span key={se.name} style={{ display: 'block' }}>{series.length > 1 ? `${se.name} : ` : ''}{p ? fmt(p.value) : '—'}</span>;
            })}
          </div>
        )}
      </div>
      <details className={s.details}>
        <summary>Voir les valeurs</summary>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Semaine du</th>
              {series.map((se) => <th key={se.name} className={s.num}>{series.length > 1 ? se.name : unit || 'Valeur'}</th>)}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w}>
                <td>{shortDate(w)}</td>
                {series.map((se) => {
                  const p = se.points.find((q) => q.week === w);
                  return <td key={se.name} className={s.num}>{p ? fmtNum(p.value, digits) : '—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
