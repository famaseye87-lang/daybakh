/**
 * Détection des contextes où les données du navigateur ne sont pas conservées.
 * Pur et testable : on ne lit que la chaîne « user agent ».
 */
export type BrowserContext = 'in-app' | 'ios-not-safari' | 'normal';

/** Navigateurs intégrés aux applis (WhatsApp, Facebook, Instagram, Messenger, Gmail, LinkedIn, TikTok, Snapchat…). */
const IN_APP = /(FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Messenger|LinkedInApp|Line\/|Snapchat|TikTok|musical_ly|GSA\/|Twitter|; wv\))/i;

export function browserContext(ua: string): BrowserContext {
  if (IN_APP.test(ua)) return 'in-app';
  const ios = /iPhone|iPad|iPod/i.test(ua);
  // Sur iPhone, seul Safari permet l'installation sur l'écran d'accueil.
  if (ios && /(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(ua)) return 'ios-not-safari';
  return 'normal';
}
