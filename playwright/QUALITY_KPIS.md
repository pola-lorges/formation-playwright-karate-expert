# Playwright Quality KPIs

Les indicateurs sont calculés depuis `test-results/playwright-results.json` après chaque exécution.
Le résumé JSON est écrit dans `test-results/quality-kpis.json` et conservé comme artefact GitLab.

| KPI | Formule | Seuil vert | Seuil orange | Seuil rouge |
| --- | --- | --- | --- | --- |
| Taux de réussite propre | `expected / (expected + unexpected + flaky) * 100` | `>= 98 %` | `>= 95 % et < 98 %` | `< 95 %` |
| Taux flaky | `flaky / (expected + unexpected + flaky) * 100` | `0 %` | `> 0 % et <= 2 %` | `> 2 %` |
| Durée Playwright | Durée totale du run en minutes | `<= 5 min` | `> 5 et <= 10 min` | `> 10 min` |
| Tests ignorés | Compteur `skipped` du rapport JSON | Suivi informatif, à expliquer par changement | | |

Les seuils sont des valeurs initiales à recalibrer selon la durée de référence et les objectifs de l'équipe.
Un test flaky est compté séparément, même s'il réussit après retry, afin que les retries ne masquent pas l'instabilité.

Le rapport JUnit est aussi publié par GitLab pour afficher les résultats du job. Ces KPI ne couvrent que Playwright : le pipeline actuel n'exécute pas Karate. La couverture des exigences critiques, les défauts détectés et le temps moyen de correction nécessitent des sources de données complémentaires.

Le dashboard HTML est généré dans `public/index.html`. Le job GitLab Pages le publie depuis la branche par défaut, y compris si le job de tests est en échec, afin que le dernier résultat reste consultable.