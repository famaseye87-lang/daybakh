import type { Draft } from './draft';
import type { FixedActivity, Weekday } from '../../types';
import { Card, Choice, MultiChoice, NumberField, TextField, Checkbox, Button, Stat } from '../../components/ui';
import { healthyRange, firstMilestone, bmiCategory } from '../../domain/calc/body';
import { currentBmi } from './draft';
import { WEEKDAYS, formatDateFR, formatMonthFR } from '../../domain/dates';
import type { Summary } from '../../domain/summary';
import msg from '../../content/messages.json';
import { FIELDS } from '../measures/fields';
import s from './onboarding.module.css';

export interface StepProps {
  d: Draft;
  set: (patch: Partial<Draft>) => void;
  errors: Record<string, string>;
  /** 'edit' : modification du profil (le poids de départ n'est plus modifiable) */
  mode?: 'create' | 'edit';
}

const fmt = (v: number, digits = 1) => v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const kcal = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} kcal`;
const dayOptions = WEEKDAYS.map((w) => ({ value: w.value, label: w.short }));

/* ---------- 1. Toi ---------- */
export function StepToi({ d, set, errors, mode }: StepProps) {
  return (
    <>
      <TextField label="Ton prénom (facultatif)" value={d.firstName} onChange={(v) => set({ firstName: v })} />
      <Choice label="Tu es" value={d.sex} onChange={(v) => set({ sex: v })}
        options={[{ value: 'F', label: 'Une femme' }, { value: 'M', label: 'Un homme' }]} />
      {errors.sex && <p className={s.err}>{errors.sex}</p>}
      <TextField type="date" label="Date de naissance" value={d.birthDate} onChange={(v) => set({ birthDate: v })} error={errors.birthDate} />
      <NumberField label="Taille" unit="cm" value={d.heightCm} onChange={(v) => set({ heightCm: v })} min={120} max={230} error={errors.heightCm} />
      {mode === 'edit' ? (
        <p className={s.muted}>Ton poids se met à jour avec tes mesures (onglet Progrès).</p>
      ) : (
        <NumberField label="Poids actuel" unit="kg" step={0.1} value={d.startWeightKg} onChange={(v) => set({ startWeightKg: v })}
          hint="Idéalement le matin, à jeun." error={errors.startWeightKg} />
      )}
    </>
  );
}

/* ---------- 2. Santé ---------- */
export function StepSante({ d, set, errors }: StepProps) {
  if (d.sex !== 'F') {
    return (
      <Card tone="info">
        <p>Rien de particulier à renseigner ici. Pense simplement à prendre l'avis de ton médecin avant de reprendre le sport.</p>
      </Card>
    );
  }
  return (
    <>
      <Choice label="Es-tu enceinte actuellement ?" value={d.pregnant ? 'oui' : 'non'}
        onChange={(v) => set({ pregnant: v === 'oui' })}
        options={[{ value: 'non', label: 'Non' }, { value: 'oui', label: 'Oui' }]} />
      {d.pregnant && <Card tone="info"><p>{msg.blocked.pregnant}</p></Card>}
      <Choice label="Allaites-tu ?" value={d.breastfeeding} onChange={(v) => set({ breastfeeding: v })}
        options={[{ value: 'no', label: 'Non' }, { value: 'partial', label: 'En partie' }, { value: 'exclusive', label: 'Exclusivement' }]} />
      {d.breastfeeding && d.breastfeeding !== 'no' && (
        <>
          <TextField type="date" label="Date de naissance du bébé" value={d.babyBirthDate}
            onChange={(v) => set({ babyBirthDate: v })} error={errors.babyBirthDate} />
          <Card tone="info"><p>{msg.blocked.breastfeeding}</p></Card>
          <NumberField label="Cible fixée par ton professionnel de santé (facultatif)" unit="kcal"
            value={d.proTargetKcal} onChange={(v) => set({ proTargetKcal: v })}
            hint="À remplir uniquement si ta sage-femme, ton médecin ou ton/ta diététicien·ne t'a donné une cible." />
        </>
      )}
      <TextField type="date" label="Date de ton dernier accouchement (facultatif)" value={d.lastDeliveryDate}
        onChange={(v) => set({ lastDeliveryDate: v })} hint="Pour adapter les exercices de ventre." />
      {d.lastDeliveryDate && (
        <>
          <Choice label="As-tu fait un bilan du périnée et des abdominaux (diastasis) ?"
            value={d.perinealCheckDone === 'yes' ? 'yes' : 'no'}
            onChange={(v) => set({ perinealCheckDone: v })}
            options={[{ value: 'yes', label: 'Oui' }, { value: 'no', label: 'Pas encore' }]} />
          {d.perinealCheckDone !== 'yes' && (
            <Card tone="info"><p>{msg.perinealAdvice} En attendant, Daybakh te proposera des exercices de ventre doux.</p></Card>
          )}
        </>
      )}
    </>
  );
}

/* ---------- 3. Objectif ---------- */
export function StepObjectif({ d, set, errors, mode }: StepProps) {
  const b = currentBmi(d);
  const range = d.heightCm ? healthyRange(d.heightCm) : undefined;
  const ms = d.startWeightKg ? firstMilestone(d.startWeightKg) : undefined;
  const lowBmi = b !== undefined && b < 18.5;
  return (
    <>
      {b !== undefined && (
        <Card>
          <Stat label={mode === 'edit' ? 'Ton IMC de départ' : "Ton IMC aujourd'hui"} value={fmt(b)}>
            <p>IMC = poids ÷ taille². {fmt(d.startWeightKg!)} ÷ ({fmt(d.heightCm! / 100, 2)})² = {fmt(b)}.</p>
            <p>Catégorie OMS : {bmiCategory(b).label}. L'IMC est un repère : il ne distingue pas muscle et graisse, d'où l'intérêt des mensurations.</p>
          </Stat>
        </Card>
      )}
      <Choice label="Ce que tu veux" value={d.goal} onChange={(v) => set({ goal: v })}
        options={[
          { value: 'lose', label: 'Perdre du poids' },
          { value: 'maintain', label: 'Me maintenir' },
          { value: 'fitness', label: 'Me remettre en forme' }
        ]} />
      {lowBmi && d.goal === 'lose' && <Card tone="info"><p>{msg.blocked.lowBmi}</p></Card>}
      {d.goal === 'lose' && !lowBmi && range && (
        <>
          <NumberField label="Ton poids cible" unit="kg" step={0.5} value={d.targetWeightKg}
            onChange={(v) => set({ targetWeightKg: v })}
            hint={`Plage santé pour ta taille : ${fmt(range.min)} à ${fmt(range.max)} kg (IMC 18,5 à 24,9, OMS).`}
            error={errors.targetWeightKg} />
          {ms && (
            <Card tone="success">
              <p><strong>Premier palier conseillé :</strong> entre {fmt(ms.from)} et {fmt(ms.to)} kg (−5 à −10 %). On le fêtera !</p>
            </Card>
          )}
          <Choice label="Ton rythme" value={d.deficitLevel} onChange={(v) => set({ deficitLevel: v })}
            options={[{ value: 'soft', label: 'Doux (−15 %)' }, { value: 'normal', label: 'Normal (−20 %)' }]}
            hint="Les 4 premières semaines sont toujours en doux, pour s'habituer. Modifiable à tout moment." />
        </>
      )}
    </>
  );
}

/* ---------- 4. Sport ---------- */
const KIND_LABEL: Record<FixedActivity['kind'], string> = { swim: 'Natation', walk: 'Marche', other: 'Autre' };

export function StepSport({ d, set, errors }: StepProps) {
  const fixed = d.fixedActivities ?? [];
  const updateFixed = (i: number, patch: Partial<FixedActivity>) =>
    set({ fixedActivities: fixed.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  return (
    <>
      <MultiChoice label="Jours de renforcement à la maison" values={d.homeWorkoutDays ?? []}
        onChange={(v) => set({ homeWorkoutDays: [...v].sort() as Weekday[] })} options={dayOptions} />
      <Choice label="Durée d'une séance" value={d.sessionMinutes} onChange={(v) => set({ sessionMinutes: v })}
        options={[20, 30, 35, 40].map((m) => ({ value: m, label: `${m} min` }))} />
      <MultiChoice label="Ton matériel" values={d.equipment ?? []} onChange={(v) => set({ equipment: v })}
        options={[{ value: 'mat', label: 'Tapis de sol' }, { value: 'treadmill', label: 'Tapis de course' }, { value: 'chair', label: 'Chaise solide' }]} />

      <h3 className={s.h3}>Activités fixes</h3>
      <p className={s.muted}>Natation, marche, cours… une ligne par activité.</p>
      {fixed.map((a, i) => (
        <Card key={i}>
          <Choice label="Activité" value={a.kind} onChange={(v) => updateFixed(i, { kind: v, label: KIND_LABEL[v] })}
            options={[{ value: 'swim', label: 'Natation' }, { value: 'walk', label: 'Marche' }, { value: 'other', label: 'Autre' }]} />
          <Choice label="Jour" value={a.day} onChange={(v) => updateFixed(i, { day: v })} options={dayOptions} />
          <NumberField label="Durée" unit="min" value={a.minutes} onChange={(v) => updateFixed(i, { minutes: v ?? 0 })} />
          <Button variant="ghost" onClick={() => set({ fixedActivities: fixed.filter((_, j) => j !== i) })}>Retirer</Button>
        </Card>
      ))}
      {errors.fixedActivities && <p className={s.err}>{errors.fixedActivities}</p>}
      <Button variant="secondary" onClick={() => set({ fixedActivities: [...fixed, { kind: 'walk', day: 7, minutes: 45, label: 'Marche' }] })}>
        + Ajouter une activité
      </Button>
    </>
  );
}

/* ---------- 5. Repas et famille ---------- */
const CONSTRAINTS = ['Sans porc', 'Végétarien', 'Sans lactose', 'Sans gluten', 'Sans poisson', 'Sans fruits à coque'];

export function StepRepas({ d, set, errors }: StepProps) {
  const people = d.household ?? [];
  const mt = d.mealTimes!;
  const upd = (i: number, patch: Partial<{ label: string; age: number }>) =>
    set({ household: people.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <>
      <h3 className={s.h3}>Qui mange à table ?</h3>
      <p className={s.muted}>Sert à calculer les portions et la liste de courses.</p>
      {people.map((p, i) => (
        <div key={i} className={s.row}>
          <TextField label="Nom" value={p.label} onChange={(v) => upd(i, { label: v })} />
          <NumberField label="Âge" value={p.age} onChange={(v) => upd(i, { age: v ?? 0 })} />
          {people.length > 1 ? (
            <button type="button" className={s.remove} aria-label={`Retirer ${p.label}`} onClick={() => set({ household: people.filter((_, j) => j !== i) })}>✕</button>
          ) : <span />}
        </div>
      ))}
      {errors.household && <p className={s.err}>{errors.household}</p>}
      <Button variant="secondary" onClick={() => set({ household: [...people, { label: `Personne ${people.length + 1}`, age: 30 }] })}>
        + Ajouter une personne
      </Button>

      <div style={{ height: 16 }} />
      <MultiChoice label="Contraintes alimentaires" values={d.foodConstraints ?? []} onChange={(v) => set({ foodConstraints: v })}
        options={CONSTRAINTS.map((c) => ({ value: c, label: c }))} hint="Laisse vide si tu manges de tout." />

      <h3 className={s.h3}>Tes horaires</h3>
      <div className={s.grid2}>
        <TextField label="Petit-déjeuner" value={mt.breakfast} onChange={(v) => set({ mealTimes: { ...mt, breakfast: v } })} />
        <TextField label="Déjeuner" value={mt.lunch} onChange={(v) => set({ mealTimes: { ...mt, lunch: v } })} />
        <TextField label="Collation" value={mt.snack} onChange={(v) => set({ mealTimes: { ...mt, snack: v } })} />
        <TextField label="Dîner" value={mt.dinner} onChange={(v) => set({ mealTimes: { ...mt, dinner: v } })} placeholder="19:30-20:00" />
      </div>
      <Choice label="Au petit-déjeuner, tu préfères" value={d.breakfastPref} onChange={(v) => set({ breakfastPref: v })}
        options={[{ value: 'sweet', label: 'Sucré' }, { value: 'savory', label: 'Salé' }, { value: 'both', label: 'Les deux' }]} />
      <Choice label="Café ou thé ?" value={d.caffeine?.drinks ? 'oui' : 'non'}
        onChange={(v) => set({ caffeine: { drinks: v === 'oui', cupsPerDay: v === 'oui' ? Math.max(1, d.caffeine?.cupsPerDay ?? 1) : 0 } })}
        options={[{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }]} />
      {d.caffeine?.drinks && (
        <NumberField label="Tasses par jour" value={d.caffeine.cupsPerDay} min={1} max={10}
          onChange={(v) => set({ caffeine: { drinks: true, cupsPerDay: v ?? 1 } })} />
      )}
      <Choice label="Jour de cuisine en avance (batch cooking)" value={d.batchCooking?.day}
        onChange={(v) => set({ batchCooking: { slot: d.batchCooking?.slot ?? 'morning', day: v } })} options={dayOptions} />
      <Choice label="Moment" value={d.batchCooking?.slot}
        onChange={(v) => set({ batchCooking: { day: d.batchCooking?.day ?? 7, slot: v } })}
        options={[{ value: 'morning', label: 'Matin' }, { value: 'afternoon', label: 'Après-midi' }]} />
    </>
  );
}

/* ---------- 6. Sommeil ---------- */
export function StepSommeil({ d, set, errors }: StepProps) {
  return (
    <>
      <p className={s.muted}>Indique ta durée réelle, pas celle que tu voudrais : Daybakh s'adapte à ta vie, pas l'inverse.</p>
      <NumberField label="Sommeil moyen par nuit" unit="h" step={0.5} min={2} max={14}
        value={d.sleepHours} onChange={(v) => set({ sleepHours: v })} error={errors.sleepHours} />
      <Choice label="Tes nuits sont-elles souvent interrompues ?" value={d.sleepInterrupted ? 'oui' : 'non'}
        onChange={(v) => set({ sleepInterrupted: v === 'oui' })}
        options={[{ value: 'non', label: 'Non' }, { value: 'oui', label: 'Oui' }]} />
      {d.sleepHours !== undefined && d.sleepHours < 6 && <Card tone="info"><p>{msg.sleepNotice}</p></Card>}
    </>
  );
}

/* ---------- 7. Premières mesures ---------- */
export function StepMesures({ d, set }: StepProps) {
  const fm = d.firstMeasures;
  return (
    <>
      <Card tone="info">
        <p>Toutes facultatives. Mètre ruban souple, posé à plat sans serrer, le matin à jeun. Tu pourras les ajouter plus tard.</p>
      </Card>
      {FIELDS.filter((m) => m.key !== 'weightKg').map((m) => (
        <NumberField key={m.key} label={m.label} unit="cm" step={0.5} hint={m.how}
          value={fm[m.key as keyof Draft['firstMeasures']] as number | undefined}
          onChange={(v) => set({ firstMeasures: { ...fm, [m.key]: v } })} />
      ))}
    </>
  );
}

/* ---------- 8. Résumé ---------- */
export function StepResume({ d, summary, programStart }: { d: Draft; summary: Summary; programStart: string }) {
  const sm = summary;
  const it = sm.intake;
  const blockedMsgs = sm.eligibility.blocked.filter((b) => b !== 'minor').map((b) => msg.blocked[b]);
  return (
    <>
      <Card tone="success">
        <p><strong>{d.firstName ? `${d.firstName}, ton` : 'Ton'} programme démarre le {formatDateFR(programStart)}.</strong></p>
        <p>Semaines 1 à 4 : démarrage en douceur. On installe les habitudes, sans pression.</p>
      </Card>

      {blockedMsgs.map((m) => <Card key={m} tone="info"><p>{m}</p></Card>)}
      {sm.eligibility.breastfeedingMode && <Card tone="info"><p>{msg.blocked.breastfeeding}</p></Card>}

      <Card>
        <h2>Tes repères</h2>
        <Stat label="IMC" value={fmt(sm.bmi)}>
          <p>Poids ÷ taille² = {fmt(sm.weightKg)} ÷ ({fmt(d.heightCm! / 100, 2)})². Catégorie OMS : {sm.bmiCategory.label}.</p>
        </Stat>
        <Stat label="Plage de poids santé" value={`${fmt(sm.healthyRange.min)}–${fmt(sm.healthyRange.max)} kg`}>
          <p>18,5 × taille² à 24,9 × taille² (OMS).</p>
        </Stat>
        {sm.whtr && (
          <Stat label="Tour de taille / taille" value={fmt(sm.whtr.value, 2)}>
            <p>Repère : moins de 0,5 (NICE, 2022). {sm.whtr.status === 'healthy' ? 'Dans le repère 👍' : sm.whtr.status === 'watch' ? 'À surveiller tranquillement.' : 'À évoquer avec un professionnel de santé.'}</p>
          </Stat>
        )}
        <Stat label="Métabolisme de base" value={kcal(sm.bmr)}>
          <p>Mifflin-St Jeor (1990) : 10 × poids + 6,25 × taille − 5 × âge {d.sex === 'F' ? '− 161' : '+ 5'}.</p>
        </Stat>
        <Stat label="Niveau d'activité" value={fmt(sm.nap)}>
          <p>{sm.activityMinutes} min d'activité prévues par semaine. Valeurs EFSA (2013) : 1,4 peu actif · 1,6 modérément actif · 1,8 actif · 2,0 très actif. Moins de 2 h → 1,4 ; 2 à 5 h → 1,6 ; 5 à 8 h → 1,8 ; au-delà → 2,0 (convention Daybakh, modifiable).</p>
        </Stat>
        <Stat label="Dépense journalière" value={kcal(sm.tdee)}>
          <p>Métabolisme de base × niveau d'activité.</p>
        </Stat>
      </Card>

      <Card>
        <h2>Ton assiette</h2>
        <Stat label="Repère calorique" value={kcal(it.kcal)}>
          <p>{it.explanation}</p>
          <p>Minimum de sécurité : jamais sous {d.sex === 'F' ? '1 200' : '1 500'} kcal (NHLBI, 1998). C'est un repère, pas un compteur : la méthode de l'assiette fait le travail.</p>
        </Stat>
        <Stat label="Protéines par jour" value={`${sm.protein.min}–${sm.protein.max} g`}>
          <p>1,2 à 1,6 g par kg (Leidy et al., 2015), calculé sur {fmt(sm.protein.refWeight)} kg{sm.bmi > 30 ? ' (poids à IMC 25, car IMC > 30)' : ''}. En pratique : une portion de la taille de ta paume à chaque repas.</p>
        </Stat>
        <Stat label="Boissons" value={`${fmt(sm.water.min)}–${fmt(sm.water.max)} L`} />
      </Card>

      {sm.eta && (
        <Card>
          <h2>Ton rythme</h2>
          {sm.milestoneEta && (
            <Stat label="Premier palier (−5 %)" value={`vers ${formatMonthFR(sm.milestoneEta.toDate)}`}>
              <p>{fmt(sm.milestone.from)} kg, soit −5 % de ton poids de départ. Un vrai bénéfice pour la santé, à fêter !</p>
            </Stat>
          )}
          <Stat label="Objectif estimé" value={sm.eta.minWeeks === sm.eta.maxWeeks ? formatMonthFR(sm.eta.toDate) : `${formatMonthFR(sm.eta.fromDate)} – ${formatMonthFR(sm.eta.toDate)}`}>
            <p>Rythme visé : {sm.shortSleep ? '0,5 % du poids par semaine (nuits courtes : on vise le bas de la fourchette)' : '0,5 à 1 % du poids par semaine'} (Helms et al., 2014). Semaines = ln(cible ÷ poids) ÷ ln(1 − rythme). Une estimation, pas une promesse : ton corps a son propre rythme.</p>
          </Stat>
        </Card>
      )}

      {sm.shortSleep && d.goal === 'lose' && d.deficitLevel === 'normal' && (
        <Card tone="info"><p>{msg.softDeficitSuggestion}</p></Card>
      )}
    </>
  );
}

export { Checkbox };
