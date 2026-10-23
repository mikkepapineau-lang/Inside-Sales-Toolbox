# Inside Sales Toolbox Équipe 3.5.15 — Teenage Engineering (essai)

Export installable demandé par Michaël depuis la branche `preview/teenage-engineering`. Cette préversion conserve l’orange et le caractère industriel de l’essai, avec la police Segoe UI, des contours plus doux et un en-tête Solotech simplifié. Les modes clair et sombre demeurent disponibles. La navigation affiche seulement les icônes; le nom de chaque outil apparaît au survol et reste accessible aux lecteurs d’écran.

Le Toolbox fonctionne maintenant par fenêtre du navigateur. Les onglets d’une même fenêtre partagent la session et conservent l’outil ouvert. Deux fenêtres Edge ou Chrome restent indépendantes par défaut. Le bouton de chaîne permet de les lier, de les séparer en copiant leur état courant ou de reprendre une session précédente. Les fenêtres liées partagent aussi les étapes du parcours CRM, le lead et leur fenêtre de travail.

« Préparer ma journée » ouvre les rapports dans une fenêtre distincte, réutilisable et accessible depuis le Toolbox. Les réservations de rapports et les données Non réservé restent propres aux sessions indépendantes.

Les données de démonstration et les générateurs d’aperçu restent hors du ZIP. L’édition personnelle, les archives et les tags précédents sont conservés. Le design de `main` reste séparé de cet essai.

## Installation

Extraire le ZIP dans un dossier dédié. Dans `edge://extensions` ou `chrome://extensions`, activer le mode développeur puis utiliser **Charger l’extension décompressée** avec le dossier contenant `manifest.json`. Le navigateur affiche **Solotech · Inside Sales Toolbox · TE (test)**, version **3.5.15**. Pour remplacer l’essai 3.5.14 chargé depuis le même dossier, extraire 3.5.15 à sa place puis cliquer sur **Recharger** dans la page des extensions.

## Vérifications et limites

Les contrôles locaux couvrent les scripts de production, les suites du noyau, les identités de fenêtres, la liaison et la séparation des sessions, les étapes CRM, l’affichage étroit et les modes clair et sombre. Le ZIP est vérifié par CRC, SHA256 et comparaison octet pour octet avec les sources de cette branche.

La publication utilise le nouveau tag `equipe-v3.5.15` et demeure une préversion. Les validations dans une session Power BI/D365 connectée, notamment le défilement réel, les exports Excel natifs et le sens de `InternalReference`, restent à faire.
