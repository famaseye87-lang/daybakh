import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, TextField } from '../../components/ui';
import { db } from '../../data/db';
import { buildShoppingList, shoppingText, AISLE_LABEL, AISLE_ORDER, type ShoppingItem } from '../../domain/nutrition/shopping';
import { formatDateFR } from '../../domain/dates';
import type { AppData } from '../../hooks/useAppData';
import { nutritionContext } from './useNutrition';
import s from './nutrition.module.css';

export function ShoppingPage({ data }: { data: AppData }) {
  const n = nutritionContext(data);
  const stored = useLiveQuery(() => db.shoppingLists.get(n.weekStart), [n.weekStart]);
  const [custom, setCustom] = useState('');
  const [copied, setCopied] = useState(false);
  const items: ShoppingItem[] = stored?.items ?? buildShoppingList(n.menu, n.family, n.prefs.breakfastScope);
  const save = (next: ShoppingItem[]) => db.shoppingLists.put({ weekStart: n.weekStart, items: next });
  const toggle = (id: string) => save(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  const add = () => {
    const label = custom.trim();
    if (!label) return;
    save([...items, { id: `custom-${Date.now()}`, label, aisle: 'epicerie', checked: false, custom: true }]);
    setCustom('');
  };
  const share = async () => {
    const text = shoppingText(items, `Courses Daybakh — semaine du ${formatDateFR(n.weekStart)}`);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* partage annulé */
    }
  };
  const left = items.filter((i) => !i.checked).length;

  return (
    <>
      <p><Link to="/assiette">← Assiette</Link></p>
      <h1>Liste de courses</h1>
      <p className={s.muted}>Semaine du {formatDateFR(n.weekStart)} · {n.family.toLocaleString('fr-FR')} portions adulte pour les repas en famille · {left} article{left > 1 ? 's' : ''} restant{left > 1 ? 's' : ''}.</p>
      <div className={s.links}>
        <Button variant="secondary" onClick={share}>{copied ? 'Copiée ✓' : 'Partager'}</Button>
        <Button variant="ghost" onClick={() => save(buildShoppingList(n.menu, n.family, n.prefs.breakfastScope))}>Régénérer</Button>
      </div>
      {AISLE_ORDER.map((a) => {
        const xs = items.filter((i) => i.aisle === a);
        if (!xs.length) return null;
        return (
          <Card key={a}>
            <h2>{AISLE_LABEL[a]}</h2>
            {a === 'placard' && <p className={s.small}>Petites quantités (cuillères, épices) : vérifie juste qu'il en reste.</p>}
            {xs.map((i) => (
              <div key={i.id} className={s.item}>
                <input id={i.id} type="checkbox" checked={i.checked} onChange={() => toggle(i.id)} />
                <label htmlFor={i.id} className={i.checked ? s.checked : ''}>
                  <span>{i.label}</span>
                  {i.qty && <strong>{i.qty}</strong>}
                </label>
              </div>
            ))}
          </Card>
        );
      })}
      <Card>
        <div className={s.addRow}>
          <TextField label="Ajouter un article" value={custom} onChange={setCustom} placeholder="ex. lessive, pain de mie…" />
          <Button onClick={add} style={{ marginBottom: 16 }}>Ajouter</Button>
        </div>
      </Card>
    </>
  );
}
