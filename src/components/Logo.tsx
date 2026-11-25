import { useId } from 'react';

/** Icône Daybakh : soleil levant derrière un « D » arrondi, aux couleurs du wax
 *  (fond indigo, cercles concentriques, anneau de pois rouges, sol multicolore). */
const C = { indigo: '#22358C', saffron: '#F5B324', red: '#D1402A', emerald: '#0F7A5A', fuchsia: '#C2266F', turquoise: '#0E8FA3', cream: '#FFF7EA' };
const CORNERS: [number, number][] = [[0, 0], [512, 0], [0, 512], [512, 512]];

export function Logo({ size = 96, title = 'Daybakh' }: { size?: number; title?: string }) {
  const clip = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label={title}>
      <defs>
        <clipPath id={clip}><rect width="512" height="512" rx="112" /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="512" height="512" fill={C.indigo} />
        <g fill="none" stroke={C.cream} strokeOpacity="0.16" strokeWidth="10">
          {CORNERS.flatMap(([x, y]) => [44, 78, 112].map((r) => <circle key={`${x}-${y}-${r}`} cx={x} cy={y} r={r} />))}
        </g>
        <g stroke={C.saffron} strokeWidth="22" strokeLinecap="round">
          <line x1="256" y1="70" x2="256" y2="118" />
          <line x1="122" y1="126" x2="152" y2="160" />
          <line x1="390" y1="126" x2="360" y2="160" />
          <line x1="66" y1="256" x2="112" y2="256" />
          <line x1="446" y1="256" x2="400" y2="256" />
        </g>
        <circle cx="256" cy="300" r="146" fill="none" stroke={C.red} strokeWidth="12" strokeLinecap="round" pathLength={360} strokeDasharray="0 10" />
        <circle cx="256" cy="300" r="128" fill={C.saffron} />
        <path d="M178 196 h52 a104 104 0 0 1 0 208 h-52 z" fill="none" stroke={C.cream} strokeWidth="40" strokeLinejoin="round" />
        <rect x="150" y="436" width="212" height="28" fill={C.indigo} />
        <rect x="40" y="420" width="216" height="22" rx="11" fill={C.emerald} />
        <rect x="256" y="420" width="216" height="22" rx="11" fill={C.turquoise} />
        <rect x="120" y="420" width="88" height="22" fill={C.saffron} />
        <rect x="208" y="420" width="88" height="22" fill={C.red} />
        <rect x="296" y="420" width="96" height="22" fill={C.fuchsia} />
      </g>
    </svg>
  );
}
