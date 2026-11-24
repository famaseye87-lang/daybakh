import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Button } from '../../components/ui';
import s from './shell.module.css';

/** Propose la nouvelle version au lieu de l'installer en pleine séance. */
export function UpdateBanner() {
  const [update, setUpdate] = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdate(() => updateSW);
      }
    });
  }, []);

  if (!update) return null;
  return (
    <div className={s.banner} role="status">
      <span>Une nouvelle version de Daybakh est prête.</span>
      <Button onClick={() => update(true)}>Mettre à jour</Button>
    </div>
  );
}
