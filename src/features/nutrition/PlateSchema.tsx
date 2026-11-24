import { C } from '../../domain/conventions';
import type { PlateType } from '../../domain/nutrition/menu';
import s from './nutrition.module.css';

const SEGMENTS = [
  { key: 'protein', label: 'Protéines', color: 'var(--plate-protein)' },
  { key: 'veg', label: 'Légumes', color: 'var(--plate-veg)' },
  { key: 'starch', label: 'Féculents', color: 'var(--plate-starch)' }
] as const;

/** Schéma de l'assiette du jour (jour de sport 35/35/30, jour léger 45/45/10). Légende toujours présente. */
export function PlateSchema({ type, size = 132 }: { type: PlateType; size?: number }) {
  const parts = C.plates[type];
  const r = 42;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const gap = 1.5; // espace de surface entre segments
  return (
    <div className={s.plate}>
      <svg width={size} height={size} viewBox="0 0 100 100" role="img"
        aria-label={`Assiette ${type === 'sport' ? 'jour de sport' : 'jour léger'} : ${SEGMENTS.map((x) => `${x.label} ${Math.round(parts[x.key] * 100)} %`).join(', ')}`}>
        <circle cx="50" cy="50" r="49" fill="var(--c-surface)" stroke="var(--c-border)" strokeWidth="1" />
        <g transform="rotate(-90 50 50)">
          {SEGMENTS.map((seg) => {
            const len = parts[seg.key] * circ;
            const el = (
              <circle key={seg.key} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="14"
                strokeDasharray={`${Math.max(0, len - gap)} ${circ - len + gap}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      <ul className={s.legend}>
        {SEGMENTS.map((seg) => (
          <li key={seg.key}>
            <span className={s.swatch} style={{ background: seg.color }} />
            {seg.label} <strong>{Math.round(parts[seg.key] * 100)} %</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
