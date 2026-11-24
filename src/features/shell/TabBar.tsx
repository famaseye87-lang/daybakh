import { NavLink } from 'react-router-dom';
import s from './shell.module.css';

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const TABS = [
  { to: '/', label: "Aujourd'hui", d: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { to: '/sport', label: 'Sport', d: 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12' },
  { to: '/assiette', label: 'Assiette', d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v9l6.4 6.4' },
  { to: '/progres', label: 'Progrès', d: 'M3 20h18M6 16l4-5 3 3 5-7' },
  { to: '/moi', label: 'Moi', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' }
];

export function TabBar() {
  return (
    <nav className={s.tabs} aria-label="Navigation principale">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => [s.tab, isActive ? s.active : ''].join(' ')}>
          {icon(t.d)}
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
