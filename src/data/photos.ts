import { zipSync } from 'fflate';
import { db } from './db';
import type { MealPhoto, MealTag } from '../types';
import { fitSize, PHOTO_QUALITY } from '../domain/tracking/photos';

async function loadBitmap(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  } catch {
    // Repli (anciens Safari) : l'élément <img> applique l'orientation de la photo.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, width: img.naturalWidth, height: img.naturalHeight };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

const toBlob = (canvas: HTMLCanvasElement, type: string, q: number) =>
  new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));

/** Compression côté téléphone : 1280 px maximum, WebP (ou JPEG si WebP indisponible), qualité 0,7. */
export async function compressImage(file: Blob): Promise<{ blob: Blob; mime: string; width: number; height: number }> {
  const bmp = await loadBitmap(file);
  const { width, height } = fitSize(bmp.width, bmp.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bmp.source, 0, 0, width, height);
  bmp.close?.();
  let blob = await toBlob(canvas, 'image/webp', PHOTO_QUALITY);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', PHOTO_QUALITY);
  if (!blob) throw new Error('compression impossible');
  return { blob, mime: blob.type, width, height };
}

/** Une photo par repas : une nouvelle photo remplace la précédente du même repas. */
export async function saveMealPhoto(date: string, meal: MealTag, file: Blob): Promise<void> {
  const c = await compressImage(file);
  const existing = await db.mealPhotos.where('[date+meal]').equals([date, meal]).first();
  const photo: MealPhoto = {
    ...(existing ?? {}),
    date,
    meal,
    blob: c.blob,
    mime: c.mime,
    width: c.width,
    height: c.height,
    bytes: c.blob.size,
    createdAt: new Date().toISOString()
  };
  await db.mealPhotos.put(photo);
}

export async function updateMealPhoto(id: number, patch: Partial<Pick<MealPhoto, 'conformity' | 'note'>>): Promise<void> {
  await db.mealPhotos.update(id, patch);
}

export async function deleteMealPhotos(ids: number[]): Promise<void> {
  await db.mealPhotos.bulkDelete(ids);
}

/** Espace occupé par Daybakh selon le navigateur (estimation). */
export async function storageEstimate(): Promise<{ usage?: number; quota?: number }> {
  try {
    if (navigator.storage?.estimate) return await navigator.storage.estimate();
  } catch {
    /* non disponible */
  }
  return {};
}

const MEAL_FILE: Record<MealTag, string> = { breakfast: 'petit-dejeuner', lunch: 'dejeuner', snack: 'collation', dinner: 'diner', free: 'repas-libre' };

/** Archive ZIP des photos (export séparé et facultatif, § G.2). */
export async function photosZip(photos: MealPhoto[]): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  const index = [];
  for (const p of photos) {
    const ext = p.mime === 'image/webp' ? 'webp' : 'jpg';
    const name = `daybakh-photos/${p.date}-${MEAL_FILE[p.meal]}.${ext}`;
    files[name] = new Uint8Array(await p.blob.arrayBuffer());
    index.push({ fichier: name, date: p.date, repas: p.meal, conformite: p.conformity ?? null, note: p.note ?? null });
  }
  files['daybakh-photos/index.json'] = new TextEncoder().encode(JSON.stringify(index, null, 2));
  const zipped = zipSync(files, { level: 0 });
  return new Blob([zipped], { type: 'application/zip' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
