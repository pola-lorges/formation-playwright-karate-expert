# Workflow de triage des échecs

## Workflow

1. **Test rouge** : conserver le rapport JUnit, le rapport JSON, la trace, la capture et la vidéo produits par Playwright.
2. **Collecte** : retrouver le test, le projet, l’étape en échec, les requêtes réseau et les erreurs console dans le rapport/Trace Viewer.
3. **Classification initiale** : lancer `npm run report:failures`; lire `test-results/failure-triage.md` et `test-results/failure-triage.json`.
4. **Confirmation** : vérifier si le test passe en relance, si l’échec est limité à un environnement, si l’API répond et si les données attendues existent.
5. **Action et suivi** : assigner le propriétaire suggéré, créer ou mettre à jour un ticket, ajouter la cause confirmée et suivre la correction. Délai cible initial : moins de 30 minutes après une pipeline rouge.

## Arbre de décision

```text
Test en échec
├─ Échec puis réussite sur retry ? -> Flaky (QA)
├─ Erreur de connexion/DNS/socket ? -> Network (Ops/Réseau)
├─ Service indisponible, 5xx, navigateur/worker en panne ? -> Environment (Ops)
├─ Fixture, seed ou donnée attendue absente/dupliquée ? -> Data (QA/Data)
├─ Locator absent ou synchronisation invalide ? -> Automation (QA)
├─ Réponse ou comportement différent du contrat attendu ? -> Application (Développement)
└─ Sinon -> Application, confiance faible; analyse manuelle obligatoire
```

Les règles automatiques fournissent une hypothèse et ne remplacent pas la lecture des preuves. Les timeouts sont ambigus et doivent être confirmés dans la trace et le réseau.

## Catégories, propriétaires et exemples

| Catégorie | Exemple | Propriétaire | Première action |
| --- | --- | --- | --- |
| Automation | Locator introuvable après changement de libellé UI | QA | Examiner locator, DOM et trace; corriger le test ou le contrat de sélection. |
| Application | Assertion métier différente du résultat attendu alors que les données et le service sont valides | Développement | Reproduire et comparer résultat observé au critère métier. |
| Environment | Service QA renvoie 503 ou navigateur du runner plante | Ops | Vérifier santé des services, runner, configuration et ressources. |
| Data | Enregistrement partagé absent, modifié ou dupliqué par un autre test | QA / Data | Vérifier le seed et isoler les données par test/worker. |
| Network | `ECONNREFUSED`, échec DNS ou socket interrompue | Ops / Réseau | Vérifier connectivité, DNS, proxy et accès depuis le runner. |
| Flaky | Le test échoue puis réussit lors d’une nouvelle tentative sans changement de code | QA | Comparer les tentatives/trace et corriger la synchronisation ou la dépendance instable. |

## Usage

Après une exécution Playwright, lancer :

```bash
npm run report:failures
```

Le classificateur est heuristique : les messages ambigus sont marqués avec une confiance faible. Vérifier la trace et les données avant d’assigner définitivement la cause.