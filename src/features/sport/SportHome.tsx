import { Link, useLocation } from 'react-router-dom';
import { Card, LinkButton, Button } from '../../components/ui';
import { Header } from '../shell/Header';
import { SESSION_LABEL } from '../../domain/sport/week';
import workouts from '../../content/workouts.json';
import { setMeta } from '../../data/repositories';
import type { AppData } from '../../hooks/useAppData';
import type { SessionKind } from '../../domain/sport/types';
import { sportContext } from './useSport';
import { DAY_SHORT } from './labels';
import s from './sport.module.css';

export const sessionPath = (k: SessionKind) =>
  k === 'swim' ? '/sport/natation' : k === 'walk' ? '/sport/marche' : k === 'A' || k === 'B' || k === 'C' ? `/sport/seance/${k}` : '/sport';

export function SportHome({ data }: { data: AppData }) {
  const ctx = sportContext(data);
  const location = useLocation();
  const justDone = new URLSearchParams(location.search).get('fait') === '1';
  const todayDow = ctx.todayPlan.day;
  const block = workouts.blocks.find((b) => b.block === ctx.params.block)!;

  if (ctx.sportDisabled) {
    return (
      <>
        <Header />
        <h1>Sport</h1>
        <Card tone="info"><p>Pendant la grossesse, Daybakh ne propose pas de programme sportif. Ta sage-femme ou ton médecin te dira quelles activités sont adaptées pour toi.</p></Card>
      </>
    );
  }

  return (
    <>
      <Header />
      <h1>Sport</h1>
      {justDone && <Card tone="success"><p><strong>Séance enregistrée.</strong> Une séance de faite, c'est une victoire. Daybakh 💛</p></Card>}

      <Card>
        <h2>{ctx.started ? `Semaine ${ctx.week}` : 'Ta semaine type'}</h2>
        <p className={s.muted}>{ctx.started ? `Bloc ${block.block}${ctx.params.deload ? ' · semaine allégée (un tour de moins)' : ''} — ${block.note}` : 'Ton programme démarre lundi. Tu peux déjà découvrir les séances.'}</p>
        <ul className={s.days}>
          {ctx.plan.map((d) => (
            <li key={d.day} className={[s.day, d.day === todayDow ? s.today : ''].join(' ')}>
              <span className={s.dayName}>{DAY_SHORT[d.day]}</span>
              <span>
                {d.items.map((i, k) => (
                  <span key={k} style={{ display: 'block' }}>
                    {i.kind === 'rest' ? 'Repos' : <Link to={sessionPath(i.kind)}>{i.label ?? SESSION_LABEL[i.kind]}</Link>}
                    {i.kind !== 'rest' && <span className={s.muted}> · {i.minutes} min</span>}
                  </span>
                ))}
              </span>
              <span>
                {d.day === todayDow && ctx.doneToday.length > 0 && <span className={s.done} aria-label="fait">✓</span>}
              </span>
            </li>
          ))}
        </ul>
        <p><Link to="/sport/semaine">Modifier ma semaine</Link></p>
      </Card>

      {ctx.shortNight && (
        <Card tone="info">
          <p><strong>Nuit courte ?</strong> Privilégie une séance modérée : renforcement en version « séance courte » (20-25 min), natation ou marche. Pas de HIIT aujourd'hui.</p>
        </Card>
      )}

      <Card>
        <h2>Les séances</h2>
        <div className={s.actions}>
          {(['A', 'B', 'C'] as const).map((k) => (
            <LinkButton key={k} variant="secondary" to={`/sport/seance/${k}`}>
              {workouts.sessions[k].name} — {workouts.sessions[k].focus}
            </LinkButton>
          ))}
          {ctx.started && ctx.week >= workouts.hiit.fromWeek && (
            ctx.hiit
              ? <LinkButton variant="secondary" to="/sport/seance/hiit">HIIT léger (optionnel)</LinkButton>
              : <p className={s.muted}>HIIT léger : disponible après une nuit d'au moins 6 h.</p>
          )}
        </div>
        <p><Link to="/sport/exercices">Tous les exercices</Link></p>
      </Card>

      {ctx.started && ctx.week > 1 && (
        <Card>
          <h2>À ton rythme</h2>
          <p className={s.muted}>Le passage au bloc suivant est proposé, jamais imposé. Si les séances te semblent encore difficiles, tu peux rester une semaine de plus sur ce niveau.</p>
          <div className={s.row2}>
            <Button variant="secondary" onClick={() => setMeta('sportWeekOffset', data.sportWeekOffset + 1)}>Rester une semaine de plus</Button>
            {data.sportWeekOffset > 0 && <Button variant="ghost" onClick={() => setMeta('sportWeekOffset', Math.max(0, data.sportWeekOffset - 1))}>Avancer d'une semaine</Button>}
          </div>
        </Card>
      )}
    </>
  );
}
