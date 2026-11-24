/** Icône Daybakh : soleil levant derrière un « D » arrondi (palette P1). */
export function Logo({ size = 96, title = 'Daybakh' }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label={title}>
      <rect width="512" height="512" rx="112" fill="#E2603B" />
      <g stroke="#F2A93B" strokeWidth="22" strokeLinecap="round">
        <line x1="256" y1="70" x2="256" y2="118" />
        <line x1="122" y1="126" x2="152" y2="160" />
        <line x1="390" y1="126" x2="360" y2="160" />
        <line x1="66" y1="256" x2="112" y2="256" />
        <line x1="446" y1="256" x2="400" y2="256" />
      </g>
      <circle cx="256" cy="300" r="128" fill="#F2A93B" />
      <path d="M178 196 h52 a104 104 0 0 1 0 208 h-52 z" fill="none" stroke="#FFF6EC" strokeWidth="40" strokeLinejoin="round" />
      <rect x="40" y="420" width="432" height="22" rx="11" fill="#2F7D5B" />
    </svg>
  );
}
