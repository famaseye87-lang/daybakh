/** Bips du minuteur (Web Audio) et vibration. Silencieux si le téléphone ne le permet pas. */
let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ctx && Ctor) ctx = new Ctor();
    if (ctx?.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function beep(kind: 'tick' | 'go' | 'end' = 'tick'): void {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = kind === 'tick' ? 660 : kind === 'go' ? 880 : 520;
    const dur = kind === 'tick' ? 0.12 : 0.35;
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {
    /* sans son */
  }
}

export function vibrate(ms: number | number[] = 200): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* pas de vibreur (iPhone) */
  }
}
