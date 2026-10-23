# Inside Sales Toolbox Équipe 3.5.14 — Teenage Engineering (essai)

Export installable demandé par Michaël depuis la branche `preview/teenage-engineering`. Cette préversion applique au Toolbox réel le style exploré dans la maquette : gris mats, accents orange, commandes rectangulaires et chiffres façon instrument. Les modes clair et sombre et les préférences par onglet sont conservés. La navigation garde uniquement les icônes, avec le nom de chaque outil au survol et dans son nom accessible.

Cette version regroupe aussi les changements du code depuis 3.5.13 : catalogue Non-Reserved séparé de l’usagé, choix explicite Sales Responsible dans Commandes prêtes, sessions et onglets de travail indépendants, fiches de produits compactes, filtres secondaires repliés et actualisation du catalogue en dernier.

Les données de démonstration et les générateurs d’aperçu restent hors du ZIP. L’édition personnelle, les anciennes archives et les tags publiés sont conservés. Le design de la branche principale n’est pas remplacé par cet essai.

## Installation

Extraire le ZIP dans un dossier dédié. Dans `edge://extensions` ou `chrome://extensions`, activer le mode développeur puis utiliser **Charger l’extension décompressée** avec le dossier contenant `manifest.json`. Le navigateur affiche **Solotech · Inside Sales Toolbox · TE (test)**, version **3.5.14**. Le fichier LIRE-MOI.html embarqué détaille le fonctionnement des outils.

## Vérifications et limites

Contrôles locaux : 64 scripts, 24 suites du noyau, parcours Chromium des outils en clair/sombre, navigation sans texte sous les icônes, héritage HS, affichage étroit et indépendance des sessions. Le ZIP est vérifié par CRC, SHA256 et comparaison octet pour octet de tous ses fichiers avec les sources. La publication utilise un tag inédit `equipe-v3.5.14` et demeure une préversion.

Le workflow habituel est adapté **sur la branche d’essai uniquement** pour publier l’édition équipe en préversion depuis cette branche. Les validations dans une session Power BI/D365 connectée, notamment le défilement réel et le sens de InternalReference, restent à faire. Les tests locaux ne les remplacent pas.
