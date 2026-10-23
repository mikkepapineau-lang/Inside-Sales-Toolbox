# Changements

## Non publié

Les changements en cours restent suivis par des commits jusqu'à la prochaine demande d'export.

## Équipe 3.5.15 — Teenage Engineering, essai de branche (2026-10-23)

- Sessions indépendantes par fenêtre du navigateur, avec continuité entre les onglets d’une même fenêtre.
- Liaison facultative entre fenêtres, séparation avec copie de l’état courant et reprise d’une session précédente.
- « Préparer ma journée » utilise une fenêtre de travail distincte et réutilisable; les étapes du parcours CRM restent synchronisées entre les fenêtres liées.
- Design Solotech × Teenage Engineering adouci : orange conservé, Segoe UI, contours plus souples et en-tête simplifié.
- Préversion installable depuis la branche d’essai. Contrôles locaux du code et du ZIP; essais Power BI/D365 connectés toujours à faire.

## Équipe 3.5.14 — Teenage Engineering, essai de branche (2026-10-23)

- Export installable de `preview/teenage-engineering`, sur demande explicite : surfaces mates gris/orange, commandes rectangulaires, légendes techniques et afficheurs numériques, avec modes clair et sombre.
- Icônes seules dans la navigation, noms au survol et libellés accessibles FR/EN.
- Comprend les changements de développement depuis 3.5.13 : catalogue Non réservé, sessions indépendantes, périmètre Sales Responsible et interface compacte.
- Publication en préversion depuis la branche d’essai; le design de `main` reste séparé. Tests locaux et comparaison du ZIP; essais Power BI/D365 connectés toujours à faire.

## Équipe 3.5.13 (2026-10-22)

- Usagé : actualisation principale par trois exports Excel natifs successifs Canada, UK et USA, importés ensemble avec conservation du relevé précédent en cas d’échec ou d’annulation.
- Produits regroupés dans les mêmes fiches que Neuf / Stock D365 : prix de vente commun en évidence, quantités et NBV distincts par pays, détails sources conservés.
- Actualisation du catalogue sous les filtres, dans un groupe replié par défaut. La date du dernier export utilisé reste visible; rappel de la cadence quotidienne et dates détaillées par pays.
- Préparation du menu natif avec reprise automatique, prise en charge des menus visibles au survol et récupération du XLSX avant l’invite de téléchargement Edge. Lecture du tableau avec défilement horizontal/vertical conservée en secours.
- Contrôles locaux du noyau, de l’import groupé et de l’interface réussis. Le parcours complet des trois pays dans la session Power BI connectée et le sens de InternalReference restent à confirmer.

## Équipe 3.5.12 (2026-10-20)

- Calculateur : titres des champs plus grands et plus contrastés; actions Effacer, Actualiser et Inverser affichées comme boutons.
- Symbole $ dans les champs monétaires et les totaux, avec CAD / USD pour distinguer les devises.
- Commandes prêtes : déplacement de la barre horizontale personnalisée Power BI, association des notes à la SO et restauration de la position de lecture.
- Reconnaissance des liens Open Orders direct, intégré et court pour réutiliser l'onglet du rapport.
- Vérifications locales réussies. Le déplacement de la barre dans la session Power BI connectée et le sens du champ InternalReference restent à confirmer.

L'historique antérieur est conservé dans [HISTORIQUE.md](docs/HISTORIQUE.md) et l'[inventaire](docs/version-inventory.json).
