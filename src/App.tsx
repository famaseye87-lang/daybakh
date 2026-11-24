import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile } from './data/repositories';
import { runChecks } from './data/recalcService';
import { useAppData } from './hooks/useAppData';
import type { Profile } from './types';
import { Onboarding } from './features/onboarding/Onboarding';
import { TabBar } from './features/shell/TabBar';
import { Today } from './features/today/Today';
import { Me } from './features/shell/Me';
import { Placeholder } from './features/shell/Placeholder';
import { About } from './features/about/About';
import { MeasuresPage } from './features/measures/MeasuresPage';
import { MeasureForm } from './features/measures/MeasureForm';
import { MeasureGuide } from './features/measures/MeasureGuide';
import { EditProfile } from './features/profile/EditProfile';
import { UpdateBanner } from './features/shell/UpdateBanner';
import { Logo } from './components/Logo';
import s from './features/shell/shell.module.css';

function Splash() {
  return (
    <div className={s.splash} aria-busy="true">
      <Logo size={96} />
    </div>
  );
}

function MainApp({ profile }: { profile: Profile }) {
  const data = useAppData(profile);
  const today = data?.today;
  // Vérifications (objectif, recalcul) à l'ouverture et à chaque changement de jour.
  useEffect(() => {
    if (today) runChecks(today);
  }, [today]);
  if (!data) return <Splash />;
  return (
    <HashRouter>
      <main className={s.app}>
        <Routes>
          <Route path="/" element={<Today data={data} />} />
          <Route path="/sport" element={<Placeholder title="Sport" text="Ta semaine type, les fiches d'exercices et le mode séance avec minuteur." />} />
          <Route path="/assiette" element={<Placeholder title="Assiette" text="Tes menus, les recettes familiales, la liste de courses et le journal photo." />} />
          <Route path="/progres" element={<MeasuresPage data={data} />} />
          <Route path="/progres/mesure" element={<MeasureForm data={data} />} />
          <Route path="/progres/mesure/:id" element={<MeasureForm data={data} />} />
          <Route path="/progres/guide" element={<MeasureGuide />} />
          <Route path="/moi" element={<Me data={data} />} />
          <Route path="/moi/profil" element={<EditProfile data={data} />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
      <UpdateBanner />
    </HashRouter>
  );
}

export default function App() {
  // undefined = chargement ; null = premier lancement
  const profile = useLiveQuery(getProfile, []);
  if (profile === undefined) return <Splash />;
  if (profile === null) {
    return (
      <>
        <Onboarding />
        <UpdateBanner />
      </>
    );
  }
  return <MainApp profile={profile} />;
}
