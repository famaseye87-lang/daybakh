import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Choice } from '../../components/ui';
import { saveProfile } from '../../data/repositories';
import { runChecks } from '../../data/recalcService';
import { currentSummary, summaryChanges, type ChangeLine } from '../../domain/summary';
import { validateStep, profileToDraft, draftToProfile, type Draft, type StepKey } from '../onboarding/draft';
import { StepToi, StepSante, StepObjectif, StepSport, StepRepas, StepSommeil } from '../onboarding/steps';
import type { AppData } from '../../hooks/useAppData';
import s from '../measures/measures.module.css';

const SECTIONS: { key: StepKey; label: string }[] = [
  { key: 'toi', label: 'Toi' },
  { key: 'sante', label: 'Santé' },
  { key: 'objectif', label: 'Objectif' },
  { key: 'sport', label: 'Sport' },
  { key: 'repas', label: 'Repas' },
  { key: 'sommeil', label: 'Sommeil' }
];

export function EditProfile({ data }: { data: AppData }) {
  const p = data.profile;
  const [d, setD] = useState<Draft>(() => profileToDraft(p));
  const [section, setSection] = useState<StepKey>('toi');
  const [showErrors, setShowErrors] = useState(false);
  const [result, setResult] = useState<ChangeLine[] | null>(null);
  const set = (patch: Partial<Draft>) => {
    setResult(null);
    setD((prev) => ({ ...prev, ...patch }));
  };

  const allErrors = useMemo(() => {
    const out: Partial<Record<StepKey, Record<string, string>>> = {};
    for (const sec of SECTIONS) {
      const e = validateStep(sec.key, d, data.today);
      if (Object.keys(e).length) out[sec.key] = e;
    }
    return out;
  }, [d, data.today]);

  const save = async () => {
    const firstBad = SECTIONS.find((sec) => allErrors[sec.key]);
    if (firstBad) {
      setSection(firstBad.key);
      setShowErrors(true);
      return;
    }
    const next = { ...draftToProfile(d, p.updatedAt, p.programStartDate, p.healthDisclaimerAcceptedAt), createdAt: p.createdAt };
    const last = data.snapshots[data.snapshots.length - 1];
    const opts = { lastSnapshotWeight: last?.refWeightKg, goalReached: !!data.goalReachedAt };
    const before = currentSummary(p, data.today, opts);
    const after = currentSummary(next, data.today, opts);
    await saveProfile(next);
    await runChecks(data.today);
    setShowErrors(false);
    setResult(summaryChanges(before, after));
    window.scrollTo(0, 0);
  };

  const props = { d, set, errors: showErrors ? allErrors[section] ?? {} : {}, mode: 'edit' as const };

  return (
    <>
      <p><Link to="/moi">← Moi</Link></p>
      <h1>Mon profil</h1>

      {result && (
        <Card tone="success">
          <h2>C'est enregistré</h2>
          {result.length === 0 ? (
            <p>Tes repères ne changent pas.</p>
          ) : (
            <>
              <p>Ce qui a changé dans tes repères :</p>
              <ul>
                {result.map((l) => (
                  <li key={l.label}>{l.label} : {l.before} → <strong>{l.after}</strong></li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      <Choice label="Rubrique" value={section} onChange={setSection}
        options={SECTIONS.map((x) => ({ value: x.key, label: allErrors[x.key] && showErrors ? `${x.label} ⚠️` : x.label }))} />

      {section === 'toi' && <StepToi {...props} />}
      {section === 'sante' && <StepSante {...props} />}
      {section === 'objectif' && <StepObjectif {...props} />}
      {section === 'sport' && <StepSport {...props} />}
      {section === 'repas' && <StepRepas {...props} />}
      {section === 'sommeil' && <StepSommeil {...props} />}

      {showErrors && Object.keys(allErrors).length > 0 && (
        <p className={s.err} role="alert">Il manque une ou deux infos dans cette rubrique 🙂</p>
      )}

      <div className={s.spacer} />
      <div className={s.footer}>
        <Button onClick={save}>Enregistrer</Button>
      </div>
    </>
  );
}
