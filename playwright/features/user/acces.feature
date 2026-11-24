# language: en
Feature: Accès USER au module Clients
  @J04 @regression
  Scenario: USER ne voit pas le module Clients dans sa navigation
    When USER ouvre les présences
    Then USER voit les présences mais pas le lien Clients

  @J04 @regression
  Scenario: USER ne peut pas ouvrir directement le module Clients
    When USER ouvre directement les clients
    Then l'accès aux clients est refusé à USER