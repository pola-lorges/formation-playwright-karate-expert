# language: fr
Fonctionnalité: Parcours clients et tableau de bord
  @J02 @smoke @regression @e2e
  Scénario: Créer un client et vérifier sa présence
    Étant donné que je suis connecté pour le parcours UI
    Quand j'accède aux clients depuis le tableau de bord
    Et je crée un client unique
    Alors le client créé est visible dans la liste

  @J03 @smoke @regression
  Scénario: Accéder au tableau de bord avec une session authentifiée
    Étant donné que je dispose d'une page authentifiée par la fixture
    Quand j'ouvre le tableau de bord du parcours
    Alors le tableau de bord du parcours est visible

  @J25 @perf
  Scénario: Mesurer les temps de chargement de Clients
    Étant donné que je suis connecté pour le parcours UI
    Quand je mesure le chargement de la page Clients
    Alors les mesures de performance sont enregistrées