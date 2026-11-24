# language: en
@J04 @smoke @regression
Feature: Accès administrateur
  Scenario: Accéder au tableau de bord et au module Clients
    Given l'administrateur ouvre son tableau de bord
    Then le tableau de bord et le lien Clients administrateur sont visibles
    When l'administrateur ouvre le module Clients
    Then la gestion des clients administrateur est visible