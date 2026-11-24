# Tests Gherkin avec Playwright

Les parcours exécutables sont décrits en français dans `features/`, puis reliés aux actions et assertions Playwright dans `steps/`. Le paquet `playwright-bdd` génère des tests natifs dans `.features-gen/` à partir de ces scénarios ; ce dossier est généré et ignoré par Git.

Les projets `admin`, `user` et `chromium` conservent leurs sessions respectives et le projet `setup` prépare les états d'authentification nécessaires. Les tags de journée et de stratégie restent utilisables. Les fichiers `tests/*.spec.ts` précédents restent comme références historiques ; la configuration exécute les scénarios BDD générés, pas ces anciens tests. `tests/auth.setup.ts` reste une préparation technique Playwright, pas un scénario métier.

Depuis `playwright/` :

```bash
npm ci
npx playwright install chromium
npm test
npm run test:j01
npm run test:j08
npm run test:perf
npm run test:report
npm run report:allure
npm run report:allure:open
```

Les commandes de test npm génèrent automatiquement les fichiers BDD. Pour appeler directement `npx playwright test`, exécuter d'abord `npm run generate:bdd`. La CI utilise `npm test` afin de générer les tests avant leur exécution. Le rapport Playwright HTML, JSON et JUnit est conservé.

Le reporter `allure-playwright` alimente `test-results/allure-results/` à chaque exécution. Allure Report 3.22.1 génère ensuite `allure-report/` avec `npm run report:allure` ; `npm run report:allure:open` ouvre le rapport existant. Les résultats correspondent au dernier run Playwright, y compris si celui-ci a échoué. En CI, le rapport et les résultats bruts sont conservés comme artefacts même en cas d'échec. Les traces, captures et pièces jointes peuvent contenir des données sensibles : limiter l'accès aux artefacts GitLab selon la politique du projet.

Le scénario J08 utilise une table `Exemples` dans la feature. Elle reprend les dix lignes de `datas/clients.json` : lors d'un changement du jeu de données, maintenir les deux sources cohérentes. Les scénarios qui accèdent à l'application demandent une configuration `.env` valide et des comptes de test appropriés.