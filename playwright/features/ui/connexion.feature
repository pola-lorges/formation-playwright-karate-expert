# language: fr
@J01 @J02 @smoke @regression @e2e
Fonctionnalité: Authentification et déconnexion
  Scénario: Se connecter puis se déconnecter
    Étant donné que la page de connexion est ouverte
    Quand je me connecte avec le compte de test
    Alors le tableau de bord est affiché
    Quand je me déconnecte
    Alors je suis redirigé vers la connexion