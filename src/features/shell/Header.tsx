import { Logo } from '../../components/Logo';
import s from './shell.module.css';

export function Header({ title }: { title?: string }) {
  return (
    <header className={s.header}>
      <Logo size={40} />
      <p className={s.headerTitle}>{title ?? 'Daybakh'}</p>
    </header>
  );
}
