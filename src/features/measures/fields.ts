import guide from '../../content/measureGuide.json';
import type { MeasureKey } from '../../domain/calc/progress';

export interface FieldDef {
  key: MeasureKey;
  label: string;
  unit: string;
  how: string;
}

export const FIELDS = guide.fields as FieldDef[];
export const GENERAL_TIPS: string[] = guide.general;
export const fieldLabel = (k: MeasureKey) => FIELDS.find((f) => f.key === k)?.label ?? k;
export const fieldUnit = (k: MeasureKey) => FIELDS.find((f) => f.key === k)?.unit ?? '';

export const fmt1 = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
export const signed = (v: number) => (v > 0 ? `+${fmt1(v)}` : v < 0 ? `−${fmt1(Math.abs(v))}` : '±0');
