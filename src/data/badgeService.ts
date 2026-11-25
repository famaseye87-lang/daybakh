import { db } from './db';
import { earnedBadges, type BadgeInput } from '../domain/tracking/badges';

/** Enregistre les nouveaux badges et les met en attente de célébration (une seule fois chacun). */
export async function checkBadges(input: BadgeInput): Promise<void> {
  const earned = earnedBadges(input);
  const have = new Set((await db.badges.toArray()).map((b) => b.id));
  const fresh = earned.filter((id) => !have.has(id));
  if (!fresh.length) return;
  await db.transaction('rw', db.badges, db.meta, async () => {
    for (const id of fresh) await db.badges.put({ id, earnedAt: input.today });
    const pending = ((await db.meta.get('newBadges'))?.value as string[] | undefined) ?? [];
    await db.meta.put({ key: 'newBadges', value: [...new Set([...pending, ...fresh])] });
  });
}
