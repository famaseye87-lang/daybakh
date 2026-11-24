import { Link, useParams } from 'react-router-dom';
import { Card } from '../../components/ui';
import { exerciseById } from '../../domain/sport/session';
import type { Level } from '../../domain/sport/types';
import { ExerciseFigure } from './ExerciseFigure';
import { LEVEL_LABEL, GROUP_LABEL } from './labels';
import s from './sport.module.css';

export function ExercisePage({ postpartumLocked }: { postpartumLocked: boolean }) {
  const { id = '' } = useParams();
  const ex = exerciseById(id);
  if (!ex) return <p><Link to="/sport/exercices">← Exercices</Link> — exercice introuvable.</p>;
  const ORDER: Level[] = ['easy', 'intermediate', 'advanced'];
  const lockedFrom = postpartumLocked && ex.intenseFrom ? ORDER.indexOf(ex.intenseFrom as Level) : 99;
  const video = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' exercice débutant')}`;
  return (
    <>
      <p><Link to="/sport/exercices">← Exercices</Link></p>
      <h1>{ex.name}</h1>
      <div className={s.figure}><ExerciseFigure pose={ex.pose} size={220} /></div>
      <Card>
        <p><span className={s.tag}>{GROUP_LABEL[ex.group] ?? ex.group}</span></p>
        <p><strong>Muscles :</strong> {ex.muscles.join(', ')}.</p>
        {ex.unilateral && <p className={s.small}>Exercice d'un côté puis de l'autre : change de côté à mi-temps.</p>}
      </Card>
      <Card>
        <h2>Comment faire</h2>
        <ol>{ex.steps.map((x) => <li key={x}>{x}</li>)}</ol>
      </Card>
      <Card>
        <h2>Erreurs fréquentes</h2>
        <ul>{ex.mistakes.map((x) => <li key={x}>{x}</li>)}</ul>
      </Card>
      <Card>
        <h2>Trois versions</h2>
        <div className={s.levels}>
          {ORDER.map((l, i) => (
            <div key={l} className={s.level}>
              <strong>{LEVEL_LABEL[l]}</strong> — {ex.levels[l].label}
              <div className={s.small}>Repère : {ex.levels[l].reps}</div>
              {i >= lockedFrom && <div className={s.small}>🔒 Après ton bilan du périnée et des abdominaux.</div>}
            </div>
          ))}
        </div>
        <p className={s.small} style={{ marginTop: 12 }}>En séance : 30 à 40 s d'effort, 20 à 30 s de récupération, 2 à 4 tours selon ta semaine.</p>
      </Card>
      {ex.group === 'ventre' && (
        <Card tone="info"><p>Si ton ventre forme un « dôme » au milieu pendant l'effort, reviens à la version facile et parles-en à une sage-femme ou un·e kiné.</p></Card>
      )}
      <p><a href={video} target="_blank" rel="noreferrer">Voir des vidéos (connexion nécessaire)</a></p>
    </>
  );
}
