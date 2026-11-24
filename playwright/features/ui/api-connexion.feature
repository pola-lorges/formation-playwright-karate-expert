# language: fr
@J06 @smoke @regression
Fonctionnalité: Connexion administrateur par API
  Scénario: Vérifier son identité et ouvrir Clients après une connexion API
    Étant donné que la page de connexion API administrateur est initialisée
    Quand je crée une session administrateur par API et vérifie son identité
    Alors le module Clients est visible après la connexion API administrateur