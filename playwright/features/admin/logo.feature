# language: fr
@J05 @regression
Fonctionnalité: Prévisualisation du logo client
  Scénario: Prévisualiser le logo sans créer de client
    Étant donné que l'administrateur ouvre le formulaire d'ajout de client
    Quand l'administrateur charge un logo PNG
    Alors le logo PNG est prévisualisé et l'ajout est annulé après 4 secondes