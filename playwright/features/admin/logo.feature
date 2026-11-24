# language: en
@J05 @regression
Feature: Prévisualisation du logo client
  Scenario: Prévisualiser le logo sans créer de client
    Given l'administrateur ouvre le formulaire d'ajout de client
    When l'administrateur charge un logo PNG
    Then le logo PNG est prévisualisé et l'ajout est annulé après 4 secondes