import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, TextField } from '../../components/ui';
import { db } from '../../data/db';
import { buildShoppingList, mergeShoppingLists, shoppingText, AISLE_LABEL, AISLE_ORDER, type ShoppingItem } from '../../domain/nutrition/shopping';
import { setMeta } from '../../data/repositories';
import { formatDateFR } from '../../domain/dates';
import type { AppData } from '../../hooks/useAppData';
import { nutritionContext } from './useNutrition';
import s from './nutrition.module.css';

export function ShoppingPage({ data }: { data: AppData }) {
  const n = nutritionContext(data);
  const stored = useLiveQuery(() => db.shoppingLists.get(n.weekStart), [n.weekStart]);
  const [custom, setCustom] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [copied, setCopied] = useState(false);
  const items: ShoppingItem[] = stored?.items ?? buildShoppingList(n.menu, n.family, n.prefs.breakfastScope);
  const save = (next: ShoppingItem[]) => db.shoppingLists.put({ weekStart: n.weekStart, items: next });
  const toggle = (id: string) => save(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  const add = () => {
    const label = custom.trim();
    if (!label) return;
    save([...items, { id: `custom-${Date.now()}`, label, qty: customQty.trim() || undefined, aisle: 'epicerie', checked: false, custom: true }]);
    setCustom('');
    setCustomQty('');
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
  const setServings = async (v: number) => {
    const servings = Math.max(1, Math.round(v * 2) / 2);
    await setMeta('nutritionPrefs', { ...data.nutritionPrefs, servings: servings === n.computedFamily ? undefined : servings });
    const fresh = buildShoppingList(n.menu, servings, n.prefs.breakfastScope);
    await save(mergeShoppingLists(items, fresh));
  };

  return (
    <>
      <p><Link to="/assiette">← Assiette</Link></p>
      <h1>Liste de courses</h1>
      <p className={s.muted}>Semaine du {formatDateFR(n.weekStart)} · {n.family.toLocaleString('fr-FR')} parts pour les repas en famille · {left} article{left > 1 ? 's' : ''} restant{left > 1 ? 's' : ''}.</p>
      <Card>
        <div className={s.dayHead}>
          <div>
            <strong>Nombre de parts</strong>
            <div className={s.small}>pour les repas en famille{data.nutritionPrefs.servings !== undefined ? ` (calculé : ${n.computedFamily.toLocaleString('fr-FR')})` : ''}</div>
          </div>
          <div className={s.stepper}>
            <button type="button" aria-label="Une demi-part de moins" onClick={() => setServings(n.family - 0.5)} disabled={n.family <= 1}>−</button>
            <span><strong>{n.family.toLocaleString('fr-FR')}</strong></span>
            <button type="button" aria-label="Une demi-part de plus" onClick={() => setServings(n.family + 0.5)}>+</button>
          </div>
        </div>
        <p className={s.small}>Un enfant compte pour une demi-part (1-6 ans) ou trois quarts (7-11 ans). Ajoute des parts pour des invités ou de gros appétits : la liste se recalcule, tes cases cochées sont gardées.</p>
        {data.nutritionPrefs.servings !== undefined && <Button variant="ghost" onClick={() => setServings(n.computedFamily)}>Revenir au calcul automatique</Button>}
      </Card>
      <div className={s.links}>
        <Button variant="secondary" onClick={share}>{copied ? 'Copiée ✓' : 'Partager'}</Button>
        <Button variant="ghost" onClick={() => save(mergeShoppingLists(items, buildShoppingList(n.menu, n.family, n.prefs.breakfastScope)))}>Régénérer</Button>
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
        <h2>Ajouter un article</h2>
        <TextField label="Article" value={custom} onChange={setCustom} placeholder="ex. lessive, pain de mie…" />
        <div className={s.addRow}>
          <TextField label="Quantité (facultatif)" value={customQty} onChange={setCustomQty} placeholder="ex. 2, 1 kg, 6 parts" />
          <Button onClick={add} style={{ marginBottom: 16 }}>Ajouter</Button>
        </div>
      </Card>
    </>
  );
}
