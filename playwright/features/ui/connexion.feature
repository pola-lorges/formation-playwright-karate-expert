# language: en
@J01 @J02 @smoke @regression @e2e
Feature: Authentification et déconnexion
  Scenario: Se connecter puis se déconnecter
    Given la page de connexion est ouverte
    When je me connecte avec le compte de test
    Then le tableau de bord est affiché
    When je me déconnecte
    Then je suis redirigé vers la connexion