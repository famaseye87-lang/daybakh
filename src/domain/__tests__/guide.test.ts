import { describe, it, expect } from 'vitest';
import appSource from '../../App.tsx?raw';
import guide from '../../content/guide.json';

/** Routes déclarées dans App.tsx (path="…"), pour vérifier les liens du Mode d'emploi. */
function appRoutes(): string[] {
  return [...appSource.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
}

describe("Mode d'emploi (content/guide.json)", () => {
  it('a un titre, une intro, des rubriques et un pied de page', () => {
    expect(guide.title.length).toBeGreaterThan(0);
    expect(guide.intro.length).toBeGreaterThan(0);
    expect(guide.sections.length).toBeGreaterThan(0);
    expect(guide.footer.length).toBeGreaterThan(0);
  });

  it('chaque rubrique a un id unique, un titre et au moins un point', () => {
    const ids = guide.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of guide.sections) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.items.length).toBeGreaterThan(0);
    }
  });

  it('le gras ** … ** est toujours fermé', () => {
    const texts = [guide.intro, ...guide.footer, ...guide.sections.flatMap((s) => [
      ...s.items, ...('callout' in s && s.callout ? [s.callout] : []), ...('outro' in s && s.outro ? [s.outro] : []),
    ])];
    for (const t of texts) expect(t.split('**').length % 2).toBe(1);
  });

  it('chaque lien mène à un écran qui existe', () => {
    const routes = appRoutes();
    for (const s of guide.sections) {
      for (const l of ('links' in s && s.links) || []) expect(routes).toContain(l.to);
    }
  });
});
