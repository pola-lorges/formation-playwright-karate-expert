# language: en
Feature: Parcours clients et tableau de bord
  @J02 @smoke @regression @e2e
  Scenario: Créer un client et vérifier sa présence
    Given je suis connecté pour le parcours UI
    When j'accède aux clients depuis le tableau de bord
    And je crée un client unique
    Then le client créé est visible dans la liste

  @J03 @smoke @regression
  Scenario: Accéder au tableau de bord avec une session authentifiée
    Given je dispose d'une page authentifiée par la fixture
    When j'ouvre le tableau de bord du parcours
    Then le tableau de bord du parcours est visible

  @J25 @perf
  Scenario: Mesurer les temps de chargement de Clients
    Given je suis connecté pour le parcours UI
    When je mesure le chargement de la page Clients
    Then les mesures de performance sont enregistrées