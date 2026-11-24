import { useEffect } from 'react';

/** Garde l'écran allumé pendant la séance, quand le navigateur le permet (Wake Lock API). */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* refusé (batterie faible…) : sans conséquence */
      }
    };
    request();
    const onVis = () => { if (document.visibilityState === 'visible' && !cancelled) request(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => undefined);
    };
  }, [active]);
}
