import { POSES } from './poses';

/** Dessin d'un exercice (position clé). Décoratif : le texte de la fiche porte l'information. */
export function ExerciseFigure({ pose, size = 160 }: { pose: string; size?: number }) {
  const p = POSES[pose];
  if (!p) return null;
  return (
    <svg width={size} height={(size * 80) / 120} viewBox="0 0 120 80" aria-hidden="true" style={{ display: 'block' }}>
      <line x1="0" y1="73" x2="120" y2="73" stroke="var(--c-border)" strokeWidth="2" />
      {p.props?.includes('chair') && (
        <g stroke="var(--c-muted)" strokeWidth="2.5" fill="none">
          <path d="M10 42 H34 M14 42 V72 M30 42 V72 M10 42 V18" />
        </g>
      )}
      {p.props?.includes('wall') && <line x1="31" y1="0" x2="31" y2="73" stroke="var(--c-muted)" strokeWidth="3" />}
      <g stroke="var(--c-brand)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {p.limbs.map((l, i) => (
          <polyline key={i} points={l.map(([x, y]) => `${x},${y}`).join(' ')} />
        ))}
      </g>
      <circle cx={p.head[0]} cy={p.head[1]} r="6.5" fill="var(--c-brand)" />
    </svg>
  );
}
