# Cahier d'exercices Senior QA : Playwright + Karate

Workspace d'entraînement organisé en deux sous-projets indépendants : Playwright/TypeScript pour l'UI et Karate/Maven pour l'API. Les tests J01 sont des exemples à adapter à l'application que tu souhaites tester; aucune application cible n'est incluse.

## Prérequis

- Node.js 20 ou plus récent et npm
- Java 17 ou plus récent
- Apache Maven 3.9 ou plus récent

## Configuration

Depuis la racine du workspace :

```bash
cp .env.example .env
```

Modifie `.env` avec l'URL de ton application, les identifiants d'un compte de test et l'URL de l'API. N'utilise jamais de vrais identifiants personnels et ne versionne pas `.env`.

Les routes et libellés de l'exemple Playwright (`/login`, `/dashboard`, `Email`, `Mot de passe`, `Se connecter`, `Déconnexion`) sont des placeholders à remplacer selon l'application.

## Playwright : UI

```bash
cd playwright
npm install
npx playwright install chromium
npx playwright test
```

Commandes utiles depuis `playwright/` : `npm test`, `npm run test:headed`, `npm run test:ui`, `npm run test:report`.

Le test de connexion est dans `tests/ui/login.spec.ts`; les sélecteurs et actions sont centralisés dans `pages/login.page.ts`. L'application doit déjà tourner à `BASE_URL`.

## Karate : API

Karate lit `API_BASE_URL` depuis l'environnement ou utilise `http://localhost:3000/api` par défaut. `.env` n'est pas chargé automatiquement par Java/Maven; passe l'URL explicitement :

```bash
cd karate
API_BASE_URL=http://localhost:3000/api mvn test
```

Ou avec une propriété système :

```bash
mvn test -Dapi.baseUrl=http://localhost:3000/api
```

Le scénario d'exemple dans `src/test/resources/features/users.feature` attend que `GET /users` renvoie un tableau non vide avec un statut 200.

## Exercices

Le parcours et les objectifs J02-J30 sont regroupés par semaine dans [exercises/README.md](exercises/README.md). Les solutions sont à construire progressivement dans les sous-projets, en fonction de l'application cible.
