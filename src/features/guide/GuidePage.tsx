import { Fragment, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { setMeta } from '../../data/repositories';
import guideData from '../../content/guide.json';
import s from './guide.module.css';

/** Rubrique du Mode d'emploi (textes dans src/content/guide.json). */
export interface GuideSection {
  id: string;
  icon: string;
  title: string;
  /** Encadré mis en avant, affiché avant la liste */
  callout?: string;
  items: string[];
  outro?: string;
  links?: { to: string; label: string }[];
  /** Rubrique dépliée à l'ouverture de la page */
  open?: boolean;
}

export interface Guide {
  title: string;
  intro: string;
  sections: GuideSection[];
  footer: string[];
}

const guide = guideData as Guide;

/** Met en gras les passages entre ** … **. */
function rich(text: string): ReactNode {
  return text.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}

export function GuidePage() {
  // Une fois le guide ouvert, le lien de l'écran Aujourd'hui n'est plus affiché (il reste dans Moi).
  useEffect(() => { void setMeta('guideOpened', true); }, []);
  return (
    <>
      <p><Link to="/moi">← Moi</Link></p>
      <h1>{guide.title}</h1>
      <p className={s.intro}>{guide.intro}</p>

      {guide.sections.map((sec) => (
        <Card key={sec.id} tone={sec.callout ? 'info' : undefined}>
          <details className={s.details} open={sec.open}>
            <summary className={s.summary}>
              <span className={s.icon} aria-hidden="true">{sec.icon}</span>
              <h2 className={s.title}>{sec.title}</h2>
            </summary>
            {sec.callout && <p className={s.callout}>{rich(sec.callout)}</p>}
            <ul className={s.list}>
              {sec.items.map((it) => <li key={it}>{rich(it)}</li>)}
            </ul>
            {sec.outro && <p className={s.outro}>{rich(sec.outro)}</p>}
            {sec.links && (
              <p className={s.links}>
                {sec.links.map((l) => <Link key={l.to} to={l.to} className={s.link}>{l.label} →</Link>)}
              </p>
            )}
          </details>
        </Card>
      ))}

      <div className={s.footer}>
        {guide.footer.map((f) => <p key={f}>{f}</p>)}
      </div>
    </>
  );
}
