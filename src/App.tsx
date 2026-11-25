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
import { About } from './features/about/About';
import { GuidePage } from './features/guide/GuidePage';
import { MeasuresPage } from './features/measures/MeasuresPage';
import { MeasureForm } from './features/measures/MeasureForm';
import { MeasureGuide } from './features/measures/MeasureGuide';
import { EditProfile } from './features/profile/EditProfile';
import { UpdateBanner } from './features/shell/UpdateBanner';
import { SportHome } from './features/sport/SportHome';
import { WeekEditor } from './features/sport/WeekEditor';
import { ExerciseList } from './features/sport/ExerciseList';
import { ExercisePage } from './features/sport/ExercisePage';
import { SessionPreview } from './features/sport/SessionPreview';
import { SessionPlayer } from './features/sport/SessionPlayer';
import { SwimPage } from './features/sport/SwimPage';
import { WalkPage } from './features/sport/WalkPage';
import { NutritionHome } from './features/nutrition/NutritionHome';
import { WeekMenuPage } from './features/nutrition/WeekMenuPage';
import { RecipePage } from './features/nutrition/RecipePage';
import { RecipeList } from './features/nutrition/RecipeList';
import { ShoppingPage } from './features/nutrition/ShoppingPage';
import { BatchPage } from './features/nutrition/BatchPage';
import { NutritionSettings } from './features/nutrition/NutritionSettings';
import { JournalPage } from './features/journal/JournalPage';
import { DataPage } from './features/settings/DataPage';
import { InstallPage } from './features/settings/InstallPage';
import { RemindersPage } from './features/settings/RemindersPage';
import { BadgesPage } from './features/daily/WeekScoreCard';
import { checkBadges } from './data/badgeService';
import { buildWeek } from './domain/sport/week';
import { waterGoalGlasses } from './domain/tracking/score';
import { Logo } from './components/Logo';
import s from './features/shell/shell.module.css';

function Splash() {
  return (
    <div className={s.splash} aria-busy="true">
      <div className={s.splashLogo}><Logo size={112} /></div>
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
  // Badges : vérifiés quand l'historique change.
  const sig = data ? `${data.workoutLogs.length}-${data.measurements.length}-${data.dailyLogs.length}-${data.mealRatings.length}-${data.dailyLogs.reduce((t, l) => t + l.waterGlasses, 0)}` : '';
  useEffect(() => {
    if (!data) return;
    checkBadges({
      today: data.today,
      startWeightKg: data.profile.startWeightKg,
      plan: buildWeek(data.profile, data.weekOverride),
      workouts: data.workoutLogs,
      logs: data.dailyLogs,
      measurements: data.measurements,
      photos: data.mealRatings,
      waterGoal: waterGoalGlasses(data.summary.water.min)
    });
  }, [sig]);
  if (!data) return <Splash />;
  return (
    <HashRouter>
      <main className={s.app}>
        <Routes>
          <Route path="/" element={<Today data={data} />} />
          <Route path="/sport" element={<SportHome data={data} />} />
          <Route path="/sport/semaine" element={<WeekEditor data={data} />} />
          <Route path="/sport/exercices" element={<ExerciseList />} />
          <Route path="/sport/exercice/:id" element={<ExercisePage postpartumLocked={!!profile.lastDeliveryDate && profile.perinealCheckDone !== 'yes'} />} />
          <Route path="/sport/seance/:kind" element={<SessionPreview data={data} />} />
          <Route path="/sport/seance/:kind/go" element={<SessionPlayer data={data} />} />
          <Route path="/sport/natation" element={<SwimPage data={data} />} />
          <Route path="/sport/marche" element={<WalkPage data={data} />} />
          <Route path="/assiette" element={<NutritionHome data={data} />} />
          <Route path="/assiette/semaine" element={<WeekMenuPage data={data} />} />
          <Route path="/assiette/recette/:id" element={<RecipePage data={data} />} />
          <Route path="/assiette/recettes" element={<RecipeList data={data} />} />
          <Route path="/assiette/courses" element={<ShoppingPage data={data} />} />
          <Route path="/assiette/batch" element={<BatchPage data={data} />} />
          <Route path="/assiette/reglages" element={<NutritionSettings data={data} />} />
          <Route path="/assiette/journal" element={<JournalPage data={data} />} />
          <Route path="/progres/badges" element={<BadgesPage data={data} />} />
          <Route path="/progres" element={<MeasuresPage data={data} />} />
          <Route path="/progres/mesure" element={<MeasureForm data={data} />} />
          <Route path="/progres/mesure/:id" element={<MeasureForm data={data} />} />
          <Route path="/progres/guide" element={<MeasureGuide />} />
          <Route path="/moi" element={<Me data={data} />} />
          <Route path="/moi/profil" element={<EditProfile data={data} />} />
          <Route path="/moi/donnees" element={<DataPage data={data} lastExport={data.lastExportAt} />} />
          <Route path="/moi/installation" element={<InstallPage />} />
          <Route path="/moi/guide" element={<GuidePage />} />
          <Route path="/moi/rappels" element={<RemindersPage data={data} />} />
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
