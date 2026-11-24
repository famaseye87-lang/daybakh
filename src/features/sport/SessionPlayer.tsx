import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button, Choice } from '../../components/ui';
import { planExercises, buildTimeline, hiitTreadmillTimeline, exerciseById, type TimelineStep } from '../../domain/sport/session';
import type { Level } from '../../domain/sport/types';
import { db } from '../../data/db';
import { useWakeLock } from '../../hooks/useWakeLock';
import { beep, vibrate, unlockAudio } from '../../hooks/sound';
import type { AppData } from '../../hooks/useAppData';
import { sportContext } from './useSport';
import { ExerciseFigure } from './ExerciseFigure';
import { LEVEL_LABEL } from './labels';
import s from './sport.module.css';

type Kind = 'A' | 'B' | 'C' | 'hiit';
const PHASE: Record<TimelineStep['type'], string> = { warmup: 'Échauffement', work: 'Effort', rest: 'Récupération', roundRest: 'Pause', cooldown: 'Étirements' };
const ORDER: Level[] = ['easy', 'intermediate', 'advanced'];

export function SessionPlayer({ data }: { data: AppData }) {
  const { kind = 'A' } = useParams();
  const k = (['A', 'B', 'C', 'hiit'].includes(kind) ? kind : 'A') as Kind;
  const short = new URLSearchParams(useLocation().search).get('court') === '1';
  const navigate = useNavigate();
  const ctx = sportContext(data);
  const steps = useMemo(() => {
    if (k === 'hiit') return hiitTreadmillTimeline().steps;
    return buildTimeline(planExercises(k, ctx.params, ctx.postpartumLocked), ctx.params, data.profile.sessionMinutes, { short }).steps;
  }, [k, short]);

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(steps[0].seconds);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [pain, setPain] = useState(false);
  const [painStop, setPainStop] = useState(false);
  const [easier, setEasier] = useState<Record<string, Level>>({});
  const [feeling, setFeeling] = useState<'easy' | 'ok' | 'hard' | undefined>();
  const endAt = useRef<number>(0);
  const elapsed = useRef(0);
  const lastTick = useRef<number>(0);

  useWakeLock(started && !finished);

  const step = steps[idx];
  const goTo = (i: number) => {
    if (i >= steps.length) {
      setFinished(true);
      beep('end');
      vibrate([200, 100, 200]);
      return;
    }
    setIdx(i);
    setRemaining(steps[i].seconds);
    endAt.current = Date.now() + steps[i].seconds * 1000;
    beep(steps[i].type === 'work' ? 'go' : 'end');
    vibrate(steps[i].type === 'work' ? 300 : 150);
  };

  // Minuteur basé sur l'heure réelle (fiable même si le téléphone ralentit l'onglet).
  const prevLeft = useRef(remaining);
  const advancing = useRef(false);
  useEffect(() => {
    if (!started || paused || finished || pain) return;
    endAt.current = Date.now() + remaining * 1000;
    lastTick.current = Date.now();
    prevLeft.current = remaining;
    advancing.current = false;
    const half = Math.ceil(step.seconds / 2);
    const unilateral = step.type === 'work' && !!step.exerciseId && !!exerciseById(step.exerciseId)?.unilateral;
    const id = window.setInterval(() => {
      const now = Date.now();
      elapsed.current += (now - lastTick.current) / 1000;
      lastTick.current = now;
      const left = Math.max(0, Math.ceil((endAt.current - now) / 1000));
      if (left !== prevLeft.current) {
        if (left > 0 && left <= 3) beep('tick');
        if (unilateral && left === half) {
          beep('go');
          vibrate(150);
        }
        prevLeft.current = left;
        setRemaining(left);
      }
      if (left === 0 && !advancing.current) {
        advancing.current = true;
        goTo(idx + 1);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [started, paused, finished, pain, idx]);

  const save = async () => {
    await db.workoutLogs.add({
      date: data.today,
      kind: k,
      minutes: Math.max(1, Math.round(elapsed.current / 60)),
      feeling,
      painStop: painStop || undefined
    });
    navigate('/sport?fait=1');
  };

  const ex = step.exerciseId ? exerciseById(step.exerciseId) : undefined;
  const level = ex && step.level ? easier[ex.id] ?? step.level : undefined;
  const nextWork = steps.slice(idx + 1).find((x) => x.type === 'work' || x.type === 'cooldown');
  const totalSec = steps.reduce((a, b) => a + b.seconds, 0);
  const doneSec = steps.slice(0, idx).reduce((a, b) => a + b.seconds, 0) + (step.seconds - remaining);
  const mmss = (v: number) => (v >= 60 ? `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : String(v));

  if (finished) {
    return (
      <div className={s.player}>
        <h1>{painStop ? 'Séance arrêtée' : 'Bravo, séance terminée ! 🎉'}</h1>
        <p>{painStop ? 'Tu as bien fait d’écouter ton corps. Si la douleur persiste, consulte un professionnel de santé.' : 'Chaque séance compte. Daybakh : ça va aller, et ça va même très bien.'}</p>
        <p>Environ {Math.max(1, Math.round(elapsed.current / 60))} min d'activité.</p>
        <Choice label="Comment c'était ?" value={feeling} onChange={setFeeling}
          options={[{ value: 'easy', label: 'Facile' }, { value: 'ok', label: 'Ça allait' }, { value: 'hard', label: 'Difficile' }]}
          hint={feeling === 'hard' ? 'Normal au début. Si c’est souvent difficile, tu peux rester une semaine de plus sur ce niveau (onglet Sport).' : undefined} />
        <Button block onClick={save}>Enregistrer la séance</Button>
        <Button block variant="ghost" onClick={() => navigate('/sport')}>Ne pas enregistrer</Button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className={s.player}>
        <div className={s.playerTop}>
          <Button variant="ghost" onClick={() => navigate(-1)}>← Retour</Button>
        </div>
        <h1>Prête ? Prêt ?</h1>
        <p>Pose le téléphone à portée de vue, prépare ton tapis et une bouteille d'eau.</p>
        <p className={s.muted}>Le son et la vibration t'indiquent les changements. L'écran reste allumé si ton téléphone le permet.</p>
        <Button block onClick={() => { unlockAudio(); setStarted(true); goTo(0); }}>C'est parti</Button>
      </div>
    );
  }

  return (
    <div className={s.player} role="timer" aria-live="polite">
      <div className={s.playerTop}>
        <span className={[s.phase, step.type === 'work' ? s.phaseWork : s.phaseRest].join(' ')}>
          {PHASE[step.type]}{step.round ? ` · tour ${step.round}/${step.rounds}` : ''}
        </span>
        <Button variant="ghost" onClick={() => setFinished(true)}>Terminer</Button>
      </div>
      <div className={s.bar}><div className={s.barFill} style={{ width: `${(doneSec / totalSec) * 100}%` }} /></div>

      <div className={s.count} aria-label={`${remaining} secondes`}>{mmss(remaining)}</div>
      <p className={s.exName}>{ex ? ex.name : step.label}</p>
      {ex && level && <p className={s.exLevel}>{LEVEL_LABEL[level]} — {ex.levels[level].label} · {ex.levels[level].reps}</p>}
      {ex && <div className={s.figure}><ExerciseFigure pose={ex.pose} size={200} /></div>}
      {ex?.unilateral && step.type === 'work' && <p className={s.next}>Change de côté au signal, à mi-temps.</p>}
      {ex?.group === 'ventre' && step.type === 'work' && <p className={s.note}>Ventre qui forme un dôme ? Passe à la version plus facile.</p>}
      {step.type !== 'work' && nextWork && <p className={s.next}>Ensuite : <strong>{nextWork.type === 'work' && nextWork.exerciseId ? exerciseById(nextWork.exerciseId)?.name : nextWork.label}</strong></p>}

      {pain ? (
        <div className={s.note} role="alertdialog" aria-label="Douleur">
          <p><strong>Douleur vive = on arrête cet exercice.</strong> Une courbature est normale ; une douleur vive, non. Si elle persiste, consulte.</p>
          <div className={s.controls}>
            <Button onClick={() => { setPain(false); goTo(idx + 1); }}>Passer à la suite</Button>
            <Button variant="secondary" onClick={() => { setPainStop(true); setFinished(true); }}>Arrêter la séance</Button>
          </div>
        </div>
      ) : (
        <div className={s.controls}>
          <Button variant="secondary" onClick={() => setPaused((p) => !p)}>{paused ? 'Reprendre' : 'Pause'}</Button>
          <Button variant="secondary" onClick={() => goTo(idx + 1)}>Passer</Button>
          {ex && level && level !== 'easy' && (
            <Button variant="ghost" onClick={() => setEasier((e) => ({ ...e, [ex.id]: ORDER[ORDER.indexOf(level) - 1] }))}>Plus facile</Button>
          )}
          <Button variant="ghost" className={s.pain} onClick={() => setPain(true)}>J'ai mal</Button>
        </div>
      )}
    </div>
  );
}
