import { db } from './db';
import { browserContext, type BrowserContext } from '../domain/storageHints';

export interface StorageHealth {
  /** La base locale répond (lecture + écriture) */
  writable: boolean;
  context: BrowserContext;
  /** Le navigateur s'est engagé à garder les données */
  persisted?: boolean;
  /** Ouverte comme application installée (écran d'accueil) */
  standalone: boolean;
  /** Quota très faible : souvent la navigation privée */
  tinyQuota: boolean;
}

/** Vérifie au démarrage que les données pourront être gardées. */
export async function checkStorage(): Promise<StorageHealth> {
  let writable = false;
  try {
    await db.open();
    const stamp = new Date().toISOString();
    await db.meta.put({ key: 'storageCheck', value: stamp });
    writable = (await db.meta.get('storageCheck'))?.value === stamp;
  } catch {
    writable = false;
  }
  let persisted: boolean | undefined;
  let tinyQuota = false;
  try {
    persisted = await navigator.storage?.persisted?.();
    // Demande la protection à chaque ouverture tant qu'elle n'est pas accordée (Chrome l'accorde souvent aux applis installées).
    if (persisted === false) persisted = await navigator.storage?.persist?.();
    const est = await navigator.storage?.estimate?.();
    tinyQuota = !!est?.quota && est.quota < 120 * 1024 * 1024;
  } catch {
    /* non disponible */
  }
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  return { writable, context: browserContext(navigator.userAgent), persisted, standalone, tinyQuota };
}
