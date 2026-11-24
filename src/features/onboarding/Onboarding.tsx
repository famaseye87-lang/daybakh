import { useMemo, useRef, useState, useEffect } from 'react';
import { Button, Card, Checkbox, ProgressDots } from '../../components/ui';
import { Logo } from '../../components/Logo';
import msg from '../../content/messages.json';
import { todayISO, nextMondayISO } from '../../domain/dates';
import { computeSummary } from '../../domain/summary';
import { completeOnboarding, requestPersistentStorage } from '../../data/repositories';
import { STEPS, initialDraft, validateStep, isBlockedMinor, draftToProfile, type Draft } from './draft';
import { StepToi, StepSante, StepObjectif, StepSport, StepRepas, StepSommeil, StepMesures, StepResume } from './steps';
import s from './onboarding.module.css';

type Phase = 'welcome' | 'health' | 'wizard';

export function Onboarding() {
  const today = todayISO();
  const programStart = nextMondayISO(today);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [accepted, setAccepted] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState('');
  const [d, setD] = useState<Draft>(() => initialDraft(window.location.search));
  const [i, setI] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const step = STEPS[i];
  const errors = useMemo(() => validateStep(step.key, d, today), [step.key, d, today]);
  const minor = isBlockedMinor(d, today);
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  // Accessibilité : le focus suit le changement d'étape.
  useEffect(() => {
    titleRef.current?.focus();
    window.scrollTo(0, 0);
  }, [i, phase]);

  const summary = useMemo(() => {
    if (step.key !== 'resume') return undefined;
    const p = draftToProfile(d, new Date().toISOString(), programStart, acceptedAt);
    return computeSummary(p, programStart, { waistCm: d.firstMeasures.waistCm });
  }, [step.key, d, programStart, acceptedAt]);

  const next = () => {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setI((n) => Math.min(n + 1, STEPS.length - 1));
  };

  const back = () => {
    setShowErrors(false);
    if (i === 0) setPhase('health');
    else setI((n) => n - 1);
  };

  const finish = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const profile = draftToProfile(d, now, programStart, acceptedAt);
    const sm = computeSummary(profile, programStart);
    await completeOnboarding(
      profile,
      { date: today, weightKg: profile.startWeightKg, ...d.firstMeasures },
      {
        date: today,
        weekIndex: 1,
        refWeightKg: sm.weightKg,
        bmi: sm.bmi,
        bmr: sm.bmr,
        nap: sm.nap,
        tdee: sm.tdee,
        targetKcal: sm.intake.kcal,
        floorApplied: sm.intake.floorApplied,
        proteinMinG: sm.protein.min,
        proteinMaxG: sm.protein.max,
        mode: sm.intake.mode
      }
    );
    await requestPersistentStorage();
    // App.tsx détecte le nouveau profil et affiche l'application.
  };

  if (phase === 'welcome') {
    return (
      <main className={s.hero}>
        <Logo size={120} />
        <h1 className={s.brand} tabIndex={-1} ref={titleRef}>{msg.welcome.title}</h1>
        <p className={s.slogan}>{msg.welcome.slogan}</p>
        <p className={s.muted}>{msg.welcome.meaning}</p>
        <p>{msg.welcome.intro}</p>
        <Button onClick={() => setPhase('health')}>{msg.welcome.start}</Button>
      </main>
    );
  }

  if (phase === 'health') {
    return (
      <main className={s.screen}>
        <h1 tabIndex={-1} ref={titleRef} className={s.stepTitle}>{msg.health.title}</h1>
        <Card>
          <ul className={s.list}>
            {msg.health.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </Card>
        <Checkbox checked={accepted} onChange={setAccepted}>{msg.health.accept}</Checkbox>
        <Checkbox checked={!!d.medicalClearance} onChange={(v) => set({ medicalClearance: v })}>{msg.health.clearance}</Checkbox>
        <div className={s.footer}>
          <Button variant="secondary" onClick={() => setPhase('welcome')}>Retour</Button>
          <Button
            disabled={!accepted}
            onClick={() => {
              setAcceptedAt(new Date().toISOString());
              setPhase('wizard');
            }}
          >
            Continuer
          </Button>
        </div>
      </main>
    );
  }

  const shownErrors = showErrors ? errors : {};
  const props = { d, set, errors: shownErrors };

  return (
    <main className={s.screen}>
      <ProgressDots total={STEPS.length} current={i} />
      <h1 tabIndex={-1} ref={titleRef} className={s.stepTitle}>{step.title}</h1>

      {step.key === 'toi' && <StepToi {...props} />}
      {step.key === 'toi' && minor && <Card tone="info"><p>{msg.blocked.minor}</p></Card>}
      {step.key === 'sante' && <StepSante {...props} />}
      {step.key === 'objectif' && <StepObjectif {...props} />}
      {step.key === 'sport' && <StepSport {...props} />}
      {step.key === 'repas' && <StepRepas {...props} />}
      {step.key === 'sommeil' && <StepSommeil {...props} />}
      {step.key === 'mesures' && <StepMesures {...props} />}
      {step.key === 'resume' && summary && <StepResume d={d} summary={summary} programStart={programStart} />}

      {showErrors && Object.keys(errors).length > 0 && (
        <p className={s.err} role="alert">Il manque une ou deux infos, regarde juste au-dessus 🙂</p>
      )}

      <div className={s.footer}>
        <Button variant="secondary" onClick={back}>Retour</Button>
        {step.key === 'resume' ? (
          <Button onClick={finish} disabled={saving}>{saving ? 'Un instant…' : msg.ready}</Button>
        ) : (
          <Button onClick={next} disabled={minor}>Suivant</Button>
        )}
      </div>
    </main>
  );
}
