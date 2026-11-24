import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { EXERCISES } from '../../domain/sport/session';
import { ExerciseFigure } from './ExerciseFigure';
import { GROUP_LABEL } from './labels';
import s from './sport.module.css';

export function ExerciseList() {
  const groups = Object.keys(GROUP_LABEL);
  return (
    <>
      <p><Link to="/sport">← Sport</Link></p>
      <h1>Exercices</h1>
      {groups.map((g) => (
        <Card key={g}>
          <h2>{GROUP_LABEL[g]}</h2>
          {EXERCISES.filter((e) => e.group === g).map((e) => (
            <Link key={e.id} to={`/sport/exercice/${e.id}`} className={s.exRow}>
              <ExerciseFigure pose={e.pose} size={84} />
              <span><strong>{e.name}</strong><span className={s.small} style={{ display: 'block' }}>{e.muscles.join(', ')}</span></span>
            </Link>
          ))}
        </Card>
      ))}
    </>
  );
}
