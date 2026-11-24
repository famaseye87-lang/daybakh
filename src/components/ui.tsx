import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import s from './ui.module.css';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  block?: boolean;
};

export function Button({ variant = 'primary', block, className = '', ...rest }: BtnProps) {
  const cls = [s.btn, variant !== 'primary' ? s[variant] : '', block ? s.block : '', className].join(' ');
  return <button type="button" className={cls} {...rest} />;
}

export function Card({ children, tone }: { children: ReactNode; tone?: 'info' | 'success' }) {
  return <section className={[s.card, tone ? s[tone] : ''].join(' ')}>{children}</section>;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      {children(id)}
      {hint && <span className={s.hint}>{hint}</span>}
      {error && <span className={s.error} role="alert">{error}</span>}
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
  error?: string;
}

export function NumberField({ label, value, onChange, unit, step = 1, min, max, hint, error }: NumberInputProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => (
        <div className={s.inputRow}>
          <input
            id={id}
            className={s.input}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            max={max}
            value={value ?? ''}
            onChange={(e) => {
              const raw = e.target.value.replace(',', '.');
              onChange(raw === '' ? undefined : Number(raw));
            }}
            style={{ flex: 1 }}
          />
          {unit && <span className={s.unit}>{unit}</span>}
        </div>
      )}
    </Field>
  );
}

export function TextField(props: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'time';
  hint?: string;
  error?: string;
  placeholder?: string;
}) {
  const { label, value, onChange, type = 'text', hint, error, placeholder } = props;
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => (
        <input
          id={id}
          className={s.input}
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

interface ChoiceOption<T> {
  value: T;
  label: string;
}

export function Choice<T extends string | number>(props: {
  label: string;
  options: ChoiceOption<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
  hint?: string;
}) {
  const { label, options, value, onChange, hint } = props;
  return (
    <fieldset className={s.field} style={{ border: 0, padding: 0, margin: '0 0 16px' }}>
      <legend className={s.label} style={{ marginBottom: 6 }}>{label}</legend>
      <div className={s.chips} role="radiogroup">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={[s.chip, value === o.value ? s.chipOn : ''].join(' ')}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <span className={s.hint}>{hint}</span>}
    </fieldset>
  );
}

export function MultiChoice<T extends string | number>(props: {
  label: string;
  options: ChoiceOption<T>[];
  values: T[];
  onChange: (v: T[]) => void;
  hint?: string;
}) {
  const { label, options, values, onChange, hint } = props;
  const toggle = (v: T) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <fieldset className={s.field} style={{ border: 0, padding: 0, margin: '0 0 16px' }}>
      <legend className={s.label} style={{ marginBottom: 6 }}>{label}</legend>
      <div className={s.chips}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={values.includes(o.value)}
            className={[s.chip, values.includes(o.value) ? s.chipOn : ''].join(' ')}
            onClick={() => toggle(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <span className={s.hint}>{hint}</span>}
    </fieldset>
  );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={s.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className={s.dots} aria-label={`Étape ${current + 1} sur ${total}`} role="img">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={[s.dot, i === current ? s.dotOn : ''].join(' ')} />
      ))}
    </div>
  );
}

export function Stat({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div>
      <div className={s.stat}>
        <span>{label}</span>
        <span className={s.statValue}>{value}</span>
      </div>
      {children && (
        <details className={s.formula}>
          <summary>Comment c'est calculé ?</summary>
          {children}
        </details>
      )}
    </div>
  );
}

/** Lien présenté comme un bouton (navigation interne). */
export function LinkButton({ to, children, variant = 'primary' }: { to: string; children: ReactNode; variant?: 'primary' | 'secondary' }) {
  return (
    <Link to={to} className={[s.btn, s.block, s.linkBtn, variant === 'secondary' ? s.secondary : ''].join(' ')}>
      {children}
    </Link>
  );
}
