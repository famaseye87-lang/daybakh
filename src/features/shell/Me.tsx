import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Stat, Button, LinkButton, Choice } from '../../components/ui';
import { getThemeChoice, setThemeChoice, type ThemeChoice } from '../../theme/theme';
import { Header } from './Header';
import { WEEKDAYS, formatDateFR } from '../../domain/dates';
import { resetAllData } from '../../data/repositories';
import type { AppData } from '../../hooks/useAppData';
import s from './shell.module.css';

const dayName = (n: number) => WEEKDAYS.find((w) => w.value === n)?.long ?? '';

export function Me({ data }: { data: AppData }) {
  const p = data.profile;
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [theme, setTheme] = useState<ThemeChoice>(getThemeChoice);
  const chooseTheme = (t: ThemeChoice) => { setThemeChoice(t); setTheme(t); };
  return (
    <>
      <Header />
      <h1>{p.firstName ?? 'Moi'}</h1>
      <Card>
        <Stat label="Taille" value={`${p.heightCm} cm`} />
        <Stat label="Poids de départ" value={`${p.startWeightKg.toLocaleString('fr-FR')} kg`} />
        {p.targetWeightKg && <Stat label="Poids cible" value={`${p.targetWeightKg.toLocaleString('fr-FR')} kg`} />}
        <Stat label="Rythme" value={p.deficitLevel === 'soft' ? 'Doux' : 'Normal'} />
        <Stat label="Renforcement" value={p.homeWorkoutDays.map(dayName).join(', ') || '—'} />
        <Stat label="Sommeil" value={`${p.sleepHours.toLocaleString('fr-FR')} h`} />
      </Card>
      <LinkButton to="/moi/profil">Modifier mon profil</LinkButton>

      <Card>
        <nav className={s.menu} aria-label="Réglages">
          <Link to="/moi/guide">📖 Mode d'emploi<span className={s.menuHint}>L'essentiel en 2 minutes</span></Link>
          <Link to="/moi/donnees">💾 Mes données (sauvegarde, CSV, restauration)<span className={s.menuHint}>{data.lastExportAt ? `Dernière sauvegarde : ${formatDateFR(data.lastExportAt)}` : 'Aucune sauvegarde'}</span></Link>
          <Link to="/moi/rappels">⏰ Rappels dans mon agenda</Link>
          <Link to="/moi/installation">📲 Installer Daybakh sur mon téléphone</Link>
          <Link to="/progres/badges">🏅 Mes badges ({data.badges.length})</Link>
          <Link to="/a-propos">☀️ À propos de Daybakh</Link>
        </nav>
      </Card>

      <Card>
        <h2>Apparence</h2>
        <Choice
          label="Fond de l'appli"
          value={theme}
          onChange={chooseTheme}
          options={[
            { value: 'light', label: 'Clair' },
            { value: 'dark', label: 'Sombre' },
            { value: 'auto', label: 'Comme le téléphone' },
          ]}
        />
      </Card>

      <Card>
        <h2>Effacer mes données</h2>
        {step === 0 && (
          <>
            <p>Supprime ton profil et tout ton historique de ce téléphone.</p>
            <Button variant="secondary" onClick={() => setStep(1)}>Effacer toutes mes données</Button>
          </>
        )}
        {step === 1 && (
          <>
            <p><strong>Tout sera supprimé définitivement</strong> : profil, mesures, historique, photos. Pense à exporter une sauvegarde avant.</p>
            <Button onClick={() => setStep(2)}>Je confirme</Button>{' '}
            <Button variant="ghost" onClick={() => setStep(0)}>Annuler</Button>
          </>
        )}
        {step === 2 && (
          <>
            <p>Dernière vérification : on efface vraiment tout ?</p>
            <Button onClick={() => resetAllData()}>Oui, tout effacer</Button>{' '}
            <Button variant="ghost" onClick={() => setStep(0)}>Non, garder</Button>
          </>
        )}
      </Card>
    </>
  );
}
