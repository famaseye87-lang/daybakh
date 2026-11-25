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

## Où sont mes données ?

Chaque adresse a sa propre mémoire : le site en ligne, `localhost:5173` (npm run dev) et `localhost:4173` (npm run preview) ne partagent pas leurs données. Sur iPhone, l'onglet Safari et l'icône de l'écran d'accueil non plus. La navigation privée et les navigateurs intégrés aux applis (WhatsApp, Instagram…) effacent tout à la fermeture. Pour un usage réel : installer l'appli depuis le site en ligne et toujours l'ouvrir par l'icône.

## Sauvegarder ses données

Moi → **Mes données** → « Exporter ma sauvegarde (JSON) ». Pour changer de téléphone : installer Daybakh sur le nouveau téléphone, puis Moi → Mes données → « Restaurer une sauvegarde ». Les photos s'exportent à part (Assiette → Journal photo → Exporter, ZIP).

## Installer sur le téléphone

- **iPhone** : ouvrir le lien dans **Safari** → bouton Partager → **« Sur l'écran d'accueil »**.
- **Android** : ouvrir le lien dans **Chrome** → menu ⋮ → **« Installer l'application »**.

## Organisation du code

| Dossier | Rôle |
|---|---|
| `src/content/` | **Contenus modifiables sans toucher au code** : seuils, messages, profil d'exemple, guide de mesure, exercices (`exercises.json`), séances et progression (`workouts.json`), natation (`swim.json`), marche (`walk.json`), recettes (`recipes.json`), badges (`badges.json`), mode d'emploi (`guide.json`) |
| `src/domain/` | Calculs purs (formules sourcées) + tests dans `__tests__/` |
| `src/data/` | Base locale (Dexie / IndexedDB) |
| `src/features/` | Écrans, un dossier par module |
| `src/components/` | Composants d'interface réutilisables (dont `charts/` : graphiques SVG) |
| `src/theme/` | Couleurs (palette « Soleil de Dakar »), typographie, mode sombre |

## Avancement

- [x] Livraison 1 — socle, moteur de calcul testé, premier lancement (accueil, avertissement santé, profil, premières mesures, résumé), écran À propos
- [x] Livraison 2 — mesures hebdomadaires + guide illustré, écarts, progression vers l'objectif, recalcul toutes les 4 semaines, passage en maintien, modification du profil (« ce qui a changé »), effacement des données
- [x] Livraison 3 — tableau de bord : courbes (poids, mensurations, IMC, tour de taille ÷ taille) sur 4 sem. / 12 sem. / tout, alertes perte rapide et stagnation, graphiques alignés sommeil · énergie · séances · repas · poids ; graphiques SVG maison, accessibles (survol, clavier, tableau des valeurs)
- [x] Livraison 4 — sport : semaine type modifiable, 17 exercices avec fiches (muscles, étapes, erreurs, 3 versions, dessin), séances A/B/C, progression sur 24 semaines + entretien, semaines allégées, HIIT léger après une nuit ≥ 6 h, verrou post-partum, natation 2 h, marche (durée → allure → pente), mode séance avec minuteur (bip, vibration, écran allumé, « J'ai mal », version plus facile)
- [x] Livraison 5 — nutrition : 26 recettes ≤ 30 min (moitié sénégalaises allégées, moitié françaises), menus de la semaine calés sur les jours de sport (assiette sport / légère, schéma), restes du dîner au déjeuner, 3 variantes, repas libre, smoothie vert optionnel, portions selon la famille, batch cooking du samedi + mini-batch du mercredi, liste de courses par rayon (cochable, ajout, partage)
- [x] Livraison 6 — suivi du jour (eau en verres, sommeil + qualité, énergie, marche), message sommeil unique + conseils nuit courte, journal photo (1 photo par repas, compression 1280 px WebP/JPEG, conformité en 1 clic, galerie, espace utilisé, suppression proposée après 8 semaines, export ZIP), score de la semaine, 9 badges
- [x] Livraison 7 — sauvegarde JSON + import vérifié (aperçu avant remplacement), CSV pour Excel (mesures, suivi), rappel mensuel de sauvegarde, guide d'installation iPhone/Android + bandeau, rappels dans l'agenda (.ics), protection contre l'effacement, menu Moi
- [x] Étape 5 (v0.8) — vérification de la spécification, corrections : niveau d'activité modifiable, import CSV des mesures, option marche après renforcement
- [x] v0.9 — retours de test : avertissement quand les données ne peuvent pas être gardées (navigateur intégré, navigation privée), restauration dès l'accueil, bips plus forts et compatibles avec le mode silencieux de l'iPhone + bouton « Tester le son », nombre de parts dans la liste de courses
- [x] v1.0 — tests sur téléphone validés (installation, données gardées, hors ligne, photos, bips, agenda, sauvegarde, mise à jour, nombre de parts)
- [x] v1.1 — design wax (palette, police Fredoka, motifs, logo et icônes), page Mode d'emploi (Moi → Mode d'emploi, lien sur Aujourd'hui jusqu'à la première ouverture), textes du guide dans `src/content/guide.json`
- [x] v1.2 — fond clair par défaut et choix de l'apparence (Moi → Apparence : clair, sombre ou comme le téléphone), boutons et barre d'onglets sur fond uni pour mieux les lire

## Sources des calculs

OMS (IMC) · Mifflin-St Jeor 1990 (métabolisme de base) · EFSA 2013 (énergie, niveaux d'activité, allaitement) · EFSA 2010 (eau) · NICE NG246 2022 (tour de taille / taille) · NHLBI 1998 (apports minimaux) · Leidy et al. 2015 (protéines) · Helms et al. 2014 (rythme de perte).

L'application ne remplace pas un avis médical.
