# language: fr
Fonctionnalité: Accès USER au module Clients
  @J04 @regression
  Scénario: USER ne voit pas le module Clients dans sa navigation
    Quand USER ouvre les présences
    Alors USER voit les présences mais pas le lien Clients

  @J04 @regression
  Scénario: USER ne peut pas ouvrir directement le module Clients
    Quand USER ouvre directement les clients
    Alors l'accès aux clients est refusé à USER