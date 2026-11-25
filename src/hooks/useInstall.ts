import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event('daybakh:installable'));
  });
}

export type Platform = 'ios' | 'android' | 'other';

export function detectPlatform(ua = navigator.userAgent): Platform {
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** Installation de la PWA : plateforme, état installé, et invite native (Android / Chrome). */
export function useInstall() {
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  const [installed, setInstalled] = useState(isStandalone());
  useEffect(() => {
    const on = () => setCanPrompt(!!deferred);
    const done = () => setInstalled(true);
    window.addEventListener('daybakh:installable', on);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('daybakh:installable', on);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  const prompt = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const r = await deferred.userChoice;
    if (r.outcome === 'accepted') setInstalled(true);
    deferred = null;
    setCanPrompt(false);
  };
  return { platform: detectPlatform(), installed, canPrompt, prompt };
}
