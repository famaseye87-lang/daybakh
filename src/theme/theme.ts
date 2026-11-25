/**
 * Apparence de l'appli : clair (par défaut), sombre, ou comme le téléphone.
 * Choix gardé sur ce téléphone (localStorage) ; il n'est pas dans la sauvegarde.
 */
export type ThemeChoice = 'light' | 'dark' | 'auto';

const KEY = 'daybakh-theme';
const THEME_COLOR = { light: '#22358C', dark: '#14132A' } as const;

export function getThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'auto') return v;
  } catch {
    /* stockage indisponible : thème clair */
  }
  return 'light';
}

function phonePrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function applyTheme(choice: ThemeChoice = getThemeChoice()): void {
  const theme = choice === 'auto' ? (phonePrefersDark() ? 'dark' : 'light') : choice;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

export function setThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* le choix vaut pour cette ouverture seulement */
  }
  applyTheme(choice);
}

/** À appeler au démarrage : applique le choix et suit le téléphone en mode « auto ». */
export function initTheme(): void {
  applyTheme();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (getThemeChoice() === 'auto') applyTheme('auto');
  });
}
