import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { Silhouette } from './Silhouette';
import { FIELDS, GENERAL_TIPS } from './fields';
import s from './measures.module.css';

export function MeasureGuide() {
  return (
    <>
      <p><Link to="/progres">← Progrès</Link></p>
      <h1>Comment se mesurer</h1>
      <Card tone="info">
        <ul>
          {GENERAL_TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </Card>
      {FIELDS.map((f) => (
        <Card key={f.key}>
          <div className={s.guideItem}>
            {f.key === 'weightKg' ? <span style={{ fontSize: 40, textAlign: 'center' }} aria-hidden="true">⚖️</span> : <Silhouette field={f.key} size={110} />}
            <div>
              <h2>{f.label}</h2>
              <p>{f.how}</p>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
