# language: en
@J06 @smoke @regression
Feature: Connexion administrateur par API
  Scenario: Vérifier son identité et ouvrir Clients après une connexion API
    Given la page de connexion API administrateur est initialisée
    When je crée une session administrateur par API et vérifie son identité
    Then le module Clients est visible après la connexion API administrateur