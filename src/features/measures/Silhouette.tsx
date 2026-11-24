/** Silhouette simple pour le guide de mesure. Le repère est dessiné à la hauteur demandée. */
const MARKERS: Record<string, { y: number; x1: number; x2: number }> = {
  waistCm: { y: 80, x1: 34, x2: 66 },
  bellyCm: { y: 90, x1: 33, x2: 67 },
  hipsCm: { y: 104, x1: 31, x2: 69 },
  armRightCm: { y: 60, x1: 14, x2: 27 },
  armLeftCm: { y: 60, x1: 73, x2: 86 },
  thighCm: { y: 126, x1: 34, x2: 49 }
};

export function Silhouette({ field, size = 120 }: { field?: string; size?: number }) {
  const m = field ? MARKERS[field] : undefined;
  return (
    <svg width={size * 0.5} height={size} viewBox="0 0 100 200" aria-hidden="true">
      <g fill="var(--c-surface-2)" stroke="var(--c-muted)" strokeWidth="1.5">
        <circle cx="50" cy="18" r="12" />
        {/* tronc */}
        <path d="M34 36 Q50 32 66 36 L68 70 Q66 84 70 104 Q68 112 66 114 L34 114 Q32 112 30 104 Q34 84 32 70 Z" />
        {/* bras */}
        <path d="M34 38 Q22 44 20 70 L16 100 L22 101 L28 72 L33 52" />
        <path d="M66 38 Q78 44 80 70 L84 100 L78 101 L72 72 L67 52" />
        {/* jambes */}
        <path d="M34 112 L36 150 L38 190 L47 190 L48 150 L50 116" />
        <path d="M66 112 L64 150 L62 190 L53 190 L52 150 L50 116" />
      </g>
      {m && (
        <g>
          <line x1={m.x1} y1={m.y} x2={m.x2} y2={m.y} stroke="var(--c-action)" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
