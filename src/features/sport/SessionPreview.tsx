import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Checkbox } from '../../components/ui';
import workouts from '../../content/workouts.json';
import { planExercises, buildTimeline, hiitTreadmillTimeline } from '../../domain/sport/session';
import type { AppData } from '../../hooks/useAppData';
import { sportContext } from './useSport';
import { ExerciseFigure } from './ExerciseFigure';
import { LEVEL_LABEL, fmtMin } from './labels';
import s from './sport.module.css';

type Kind = 'A' | 'B' | 'C' | 'hiit';

export function SessionPreview({ data }: { data: AppData }) {
  const { kind = 'A' } = useParams();
  const k = (['A', 'B', 'C', 'hiit'].includes(kind) ? kind : 'A') as Kind;
  const ctx = sportContext(data);
  const [short, setShort] = useState(ctx.shortNight);
  const navigate = useNavigate();
  const sess = workouts.sessions[k];
  const planned = planExercises(k, ctx.params, ctx.postpartumLocked);
  const circuit = k === 'hiit' ? null : buildTimeline(planned, ctx.params, data.profile.sessionMinutes, { short });
  const tl = circuit ?? hiitTreadmillTimeline();
  const rounds: number = circuit ? circuit.rounds : workouts.hiit.treadmill.rounds;

  return (
    <>
      <p><Link to="/sport">← Sport</Link></p>
      <h1>{sess.name}</h1>
      <p className={s.muted}>{sess.focus}</p>

      <Card>
        <p><strong>{fmtMin(tl.totalSeconds)}</strong> · {rounds} tour{rounds > 1 ? 's' : ''}{k !== 'hiit' && <> · {ctx.params.work} s d'effort / {ctx.params.rest} s de récupération</>}</p>
        <p className={s.small}>Échauffement et étirements inclus. Bois quelques gorgées entre les tours.</p>
        {k !== 'hiit' && data.profile.equipment.includes('treadmill') && <p className={s.small}>En option, après la séance : 10 à 15 min de marche tranquille sur le tapis de course.</p>}
        {k !== 'hiit' && (
          <Checkbox checked={short} onChange={setShort}>Séance courte (20-25 min){ctx.shortNight ? ' — conseillée après une nuit courte' : ''}</Checkbox>
        )}
      </Card>

      {k === 'hiit' ? (
        <Card>
          <h2>Sur le tapis de course</h2>
          <p>{workouts.hiit.treadmill.rounds} fois : {workouts.hiit.treadmill.work} s de {workouts.hiit.treadmill.workLabel.toLowerCase()}, puis {workouts.hiit.treadmill.rest} s de {workouts.hiit.treadmill.restLabel.toLowerCase()}.</p>
          <p className={s.small}>Pas de tapis ? Alterne au sol montées de genoux et pas chassés (20 s d'effort, 40 s de marche).</p>
        </Card>
      ) : (
        <Card>
          <h2>Les exercices</h2>
          {planned.map((pe, i) => (
            <Link key={i} to={`/sport/exercice/${pe.exercise.id}`} className={s.exRow}>
              <ExerciseFigure pose={pe.exercise.pose} size={84} />
              <span>
                <strong>{pe.exercise.name}</strong>
                <span style={{ display: 'block' }} className={s.small}>
                  <span className={s.tag}>{LEVEL_LABEL[pe.level]}</span>
                  {pe.exercise.levels[pe.level].label}
                </span>
                {pe.replacedFrom && <span className={s.small} style={{ display: 'block' }}>Remplace « {pe.replacedFrom} » en attendant ton bilan du périnée.</span>}
              </span>
            </Link>
          ))}
        </Card>
      )}

      <Card tone="info">
        <p>Douleur vive (pas une courbature) : on arrête l'exercice. Le bouton « J'ai mal » est là pendant la séance.</p>
      </Card>

      <div className={s.actions}>
        <Button block onClick={() => navigate(`/sport/seance/${k}/go${short ? '?court=1' : ''}`)}>Démarrer la séance</Button>
      </div>
    </>
  );
}
