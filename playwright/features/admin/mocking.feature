# language: en
Feature: Simulation de l'API clients administrateur
  @J07 @regression
  Scenario: afficher les clients renvoyés par une API simulée
    Then le parcours mock clients affiche le client simulé

  @J07 @regression
  Scenario: afficher un état vide si l’API clients répond 400
    Then le parcours mock clients affiche un état vide pour le statut 400

  @J07 @regression
  Scenario: rediriger vers la connexion si le token est refusé et son refresh échoue
    Then le parcours mock clients redirige après échec du refresh 401

  @J07 @regression
  Scenario: afficher un état vide si l’API clients répond 500
    Then le parcours mock clients affiche un état vide pour le statut 500

  @J07 @regression
  Scenario: afficher un état vide si la requête clients expire
    Then le parcours mock clients affiche un état vide après expiration

  @J09 @regression
  Scenario: J09 attendre les clients malgré une latence variable
    Given l'API mock clients répond avec une latence variable
    When j'ouvre la liste des clients pour le mock avec latence
    Then le client du mock avec latence est affiché

  @J10 @regression
  Scenario: J10 diagnostiquer l’affichage d’un client
    Then le parcours de diagnostic mock clients joint et vérifie la réponse