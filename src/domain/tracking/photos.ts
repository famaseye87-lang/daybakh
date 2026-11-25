/** Règles du journal photo (§ G.2). */
export const PHOTO_MAX_SIDE = 1280;
export const PHOTO_QUALITY = 0.7;
export const PHOTO_PURGE_DAYS = 56; // 8 semaines

/** Dimensions après redimensionnement (plus grand côté ≤ 1280 px, sans agrandir). */
export function fitSize(w: number, h: number, max = PHOTO_MAX_SIDE): { width: number; height: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * k), height: Math.round(h * k) };
}

/** Photos de plus de 8 semaines (proposées à la suppression, jamais supprimées sans accord). */
export function photosToPurge<T extends { date: string }>(photos: T[], today: string, days = PHOTO_PURGE_DAYS): T[] {
  const limit = new Date(today + 'T12:00:00');
  limit.setDate(limit.getDate() - days);
  const iso = limit.toISOString().slice(0, 10);
  return photos.filter((p) => p.date < iso);
}

export function formatBytes(b: number): string {
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} Ko`;
  return `${(b / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}
