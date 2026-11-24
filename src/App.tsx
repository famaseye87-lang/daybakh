import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile } from './data/repositories';
import { Onboarding } from './features/onboarding/Onboarding';
import { TabBar } from './features/shell/TabBar';
import { Today } from './features/shell/Today';
import { Me } from './features/shell/Me';
import { Placeholder } from './features/shell/Placeholder';
import { About } from './features/about/About';
import { UpdateBanner } from './features/shell/UpdateBanner';
import { Logo } from './components/Logo';
import s from './features/shell/shell.module.css';

export default function App() {
  // undefined = chargement ; null = premier lancement
  const profile = useLiveQuery(getProfile, []);

  if (profile === undefined) {
    return (
      <div className={s.splash} aria-busy="true">
        <Logo size={96} />
      </div>
    );
  }

  if (profile === null) {
    return (
      <>
        <Onboarding />
        <UpdateBanner />
      </>
    );
  }

  return (
    <HashRouter>
      <main className={s.app}>
        <Routes>
          <Route path="/" element={<Today profile={profile} />} />
          <Route path="/sport" element={<Placeholder title="Sport" text="Ta semaine type, les fiches d'exercices et le mode séance avec minuteur." />} />
          <Route path="/assiette" element={<Placeholder title="Assiette" text="Tes menus, les recettes familiales, la liste de courses et le journal photo." />} />
          <Route path="/progres" element={<Placeholder title="Progrès" text="Tes mesures, tes courbes et tes badges." />} />
          <Route path="/moi" element={<Me profile={profile} />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
      <UpdateBanner />
    </HashRouter>
  );
}
