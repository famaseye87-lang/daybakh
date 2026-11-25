/**
 * Bips du minuteur (Web Audio) et vibration.
 * iPhone : le son Web Audio est coupé par le bouton « silencieux » ; avec Safari 16.4+, on déclare une session
 * audio « lecture » pour que les bips passent quand même. Le contexte audio doit être débloqué par un toucher.
 */
let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ctx && Ctor) ctx = new Ctor();
    if (ctx?.state !== 'running') void ctx?.resume();
    // Un son inaudible joué pendant le toucher débloque définitivement l'audio sur iPhone.
    if (ctx) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.05);
    }
  } catch {
    ctx = null;
  }
}

export function audioReady(): boolean {
  return !!ctx;
}

export function beep(kind: 'tick' | 'go' | 'end' = 'tick'): void {
  if (!ctx) return;
  try {
    if (ctx.state !== 'running') void ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = kind === 'tick' ? 880 : kind === 'go' ? 1320 : 660;
    const dur = kind === 'tick' ? 0.15 : 0.45;
    const t0 = ctx.currentTime + 0.01;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
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
