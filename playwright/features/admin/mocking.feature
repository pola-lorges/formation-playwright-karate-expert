# language: fr
Fonctionnalité: Simulation de l'API clients administrateur
  @J07 @regression
  Scénario: afficher les clients renvoyés par une API simulée
    Alors le parcours mock clients affiche le client simulé

  @J07 @regression
  Scénario: afficher un état vide si l’API clients répond 400
    Alors le parcours mock clients affiche un état vide pour le statut 400

  @J07 @regression
  Scénario: rediriger vers la connexion si le token est refusé et son refresh échoue
    Alors le parcours mock clients redirige après échec du refresh 401

  @J07 @regression
  Scénario: afficher un état vide si l’API clients répond 500
    Alors le parcours mock clients affiche un état vide pour le statut 500

  @J07 @regression
  Scénario: afficher un état vide si la requête clients expire
    Alors le parcours mock clients affiche un état vide après expiration

  @J09 @regression
  Scénario: J09 attendre les clients malgré une latence variable
    Étant donné que l'API mock clients répond avec une latence variable
    Quand j'ouvre la liste des clients pour le mock avec latence
    Alors le client du mock avec latence est affiché

  @J10 @regression
  Scénario: J10 diagnostiquer l’affichage d’un client
    Alors le parcours de diagnostic mock clients joint et vérifie la réponse