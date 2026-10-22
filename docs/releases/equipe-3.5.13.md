# Inside Sales Toolbox Équipe 3.5.13

L’actualisation du catalogue Usagé passe par trois exports Excel automatiques successifs : Canada, UK et USA. Le Toolbox importe les trois fichiers ensemble, regroupe les produits et conserve leurs quantités et NBV par pays. Une erreur ou une annulation laisse les relevés précédents intacts.

Les produits usagés utilisent les mêmes fiches que Neuf / Stock D365. Le prix de vente commun apparaît une seule fois, en évidence, au-dessus des blocs pays. Les NBV et quantités restent distincts. Les valeurs à zéro, les absences et les informations sources sont conservées; des prix contradictoires sont signalés par « Plusieurs valeurs ».

Sous les filtres de recherche, **Actualisation du catalogue** se déplie pour accéder au bouton principal **Actualiser par Excel** et aux lectures de secours. Le groupe est replié par défaut. La date du dernier export utilisé reste visible même lorsqu’il est fermé; les trois dates détaillées figurent dans Options du catalogue. Une mention rappelle qu’une actualisation quotidienne suffit généralement.

La préparation du menu natif peut reprendre automatiquement, sans doubler la confirmation d’export. Le lecteur tient compte des commandes visibles au survol et récupère le fichier natif avant l’invite Ouvrir / Enregistrer d’Edge. L’export avec disposition actuelle est privilégié; Données résumées peut servir si la première option est indisponible. Les autres filtres et les limites d’export Power BI restent applicables. La lecture avec défilement horizontal/vertical et l’import manuel restent disponibles en secours.

Vérifications : 54 scripts et 19 suites du noyau, tests d’interface dans Chromium, trois XLSX distincts lus par le parseur de production, contrôle des empreintes et CRC, import groupé, dates, zéro NBV, conservation après échec, prix commun et fermeture du groupe. Le ZIP est contrôlé octet pour octet contre les sources de cette livraison.

Limites : le nouvel enchaînement complet Canada/UK/USA et les interactions réelles avec Power BI/D365 restent à essayer dans la session connectée. InternalReference n’est pas assimilé à Internal Notes sans confirmation. Cette publication reste une version de test.

Installation : décompresser le ZIP dans un dossier permanent contenant directement manifest.json. Dans Edge ou Chrome, activer le mode développeur puis charger ce dossier. Pour une mise à jour, remplacer les fichiers dans le même dossier et recharger l’extension depuis edge://extensions ou chrome://extensions; actualiser ensuite les onglets Power BI/D365 et rouvrir le panneau. Les données du profil sont conservées. Le fichier LIRE-MOI.html du ZIP contient les instructions.
