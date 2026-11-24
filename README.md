# Daybakh — ta forme, ton rythme, ta victoire

Application web installable (PWA) de suivi forme et rééquilibrage alimentaire.
« Daybakh » veut dire « ça va aller » en wolof.

- Un profil par téléphone, **aucun compte, aucun serveur** : les données restent sur le téléphone (IndexedDB).
- Fonctionne **hors ligne** une fois installée.

## Prérequis (une seule fois)

- **Node.js 20 ou plus** : https://nodejs.org (version LTS). Vérifier : `node -v`
- **Git** et un compte **GitHub** (pour la mise en ligne).

## Lancer l'application sur ton ordinateur

Dans un terminal (PowerShell, Invite de commandes ou le terminal de VS Code), dans ce dossier :

```bash
npm install        # installe les dépendances (une seule fois, ~1 min)
npm run dev        # lance l'appli : ouvre http://localhost:5173
```

Astuce : `http://localhost:5173/?exemple=1` pré-remplit le profil d'exemple (première utilisatrice).
Pour recommencer la création du profil : outils de développement du navigateur (F12) → Application → IndexedDB → supprimer `daybakh`.

### Voir l'appli sur ton téléphone (même Wi-Fi)

```bash
npm run dev -- --host
```
puis ouvre sur le téléphone l'adresse « Network » affichée (ex. `http://192.168.1.20:5173`).
(L'installation sur l'écran d'accueil et le hors-ligne nécessitent la version en ligne, en HTTPS.)

## Tester

```bash
npm test           # tests unitaires des calculs (IMC, métabolisme, apports, garde-fous…)
npm run build      # vérification TypeScript + construction de la version en ligne (dossier dist/)
npm run preview    # aperçu local de la version construite
```

## Mettre en ligne (GitHub Pages, gratuit)

**Première fois**
1. Sur github.com : *New repository* → nom **`daybakh`** → *Public* → *Create*.
   (Si tu choisis un autre nom, modifie `REPO_NAME` dans `vite.config.ts`.)
2. Dans ce dossier :
   ```bash
   git init
   git add .
   git commit -m "Daybakh v0.1"
   git branch -M main
   git remote add origin https://github.com/<ton-compte>/daybakh.git
   git push -u origin main
   ```
3. Sur GitHub : *Settings → Pages → Build and deployment → Source : **GitHub Actions***.
4. Onglet *Actions* : attendre la coche verte (1-2 min).
5. Lien à partager : **`https://<ton-compte>.github.io/daybakh/`**

**Mises à jour**
```bash
git add .
git commit -m "Ce qui a changé"
git push
```
Le workflow relance les tests, reconstruit et publie. Sur les téléphones, un bandeau « Une nouvelle version de Daybakh est prête » apparaît.

> Le dépôt contient uniquement le code et les contenus. Les données des utilisatrices ne quittent jamais leur téléphone.

## Installer sur le téléphone

- **iPhone** : ouvrir le lien dans **Safari** → bouton Partager → **« Sur l'écran d'accueil »**.
- **Android** : ouvrir le lien dans **Chrome** → menu ⋮ → **« Installer l'application »**.

## Organisation du code

| Dossier | Rôle |
|---|---|
| `src/content/` | **Contenus modifiables sans toucher au code** (seuils, messages, profil d'exemple ; exercices, menus et recettes dans les prochaines livraisons) |
| `src/domain/` | Calculs purs (formules sourcées) + tests dans `__tests__/` |
| `src/data/` | Base locale (Dexie / IndexedDB) |
| `src/features/` | Écrans, un dossier par module |
| `src/components/` | Composants d'interface réutilisables (dont `charts/` : graphiques SVG) |
| `src/theme/` | Couleurs (palette « Soleil de Dakar »), typographie, mode sombre |

## Avancement

- [x] Livraison 1 — socle, moteur de calcul testé, premier lancement (accueil, avertissement santé, profil, premières mesures, résumé), écran À propos
- [x] Livraison 2 — mesures hebdomadaires + guide illustré, écarts, progression vers l'objectif, recalcul toutes les 4 semaines, passage en maintien, modification du profil (« ce qui a changé »), effacement des données
- [x] Livraison 3 — tableau de bord : courbes (poids, mensurations, IMC, tour de taille ÷ taille) sur 4 sem. / 12 sem. / tout, alertes perte rapide et stagnation, graphiques alignés sommeil · énergie · séances · repas · poids ; graphiques SVG maison, accessibles (survol, clavier, tableau des valeurs)
- [ ] Sport (séances, minuteur, natation, marche)
- [ ] Nutrition (menus, recettes, courses)
- [ ] Suivi quotidien, sommeil, journal photo
- [ ] Export/import, guide d'installation, rappels .ics

## Sources des calculs

OMS (IMC) · Mifflin-St Jeor 1990 (métabolisme de base) · EFSA 2013 (énergie, niveaux d'activité, allaitement) · EFSA 2010 (eau) · NICE NG246 2022 (tour de taille / taille) · NHLBI 1998 (apports minimaux) · Leidy et al. 2015 (protéines) · Helms et al. 2014 (rythme de perte).

L'application ne remplace pas un avis médical.
