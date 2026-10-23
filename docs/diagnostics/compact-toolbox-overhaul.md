# Refonte compacte de l’interface équipe

Travail du 23 octobre 2026, après le commit `4fceeb8`. Cette refonte couvre l’accueil, Salesforce vers D365, les coordonnées, les trois inventaires, Commandes prêtes, le calculateur et le vérificateur HS. Elle reste du développement après l’export 3.5.13.

## Organisation de l’interface

Le bandeau de l’outil donne son nom et ses actions immédiates une seule fois. Les titres et sous-titres répétés ne prennent plus de rangée; les titres sémantiques restent accessibles. La navigation montre uniquement les icônes : le nom de chaque outil apparaît dans une infobulle au survol et reste accessible aux lecteurs d’écran. Les formulaires, boutons et listes partagent une grille compacte, des couleurs plus contrastées et une échelle de contrôles commune.

- **Produits** : recherche en premier, disponibilité et filtres sur une rangée, puis résultats. Le chevron dans l’en-tête de chaque fiche ouvre toutes les lignes sources. La description complète apparaît aussi lorsque les détails sont ouverts. Les quantités restent propres à chaque entrepôt ou pays, avec prix de vente commun et NBV distincts pour l’usagé. Les coûts Non-Reserved restent des coûts. Le groupe Actualisation et ses messages restent tout en bas.
- **Commandes prêtes** : choix explicite du périmètre et nom Sales Rep Name sur une rangée lorsque la largeur le permet; recherche juste dessous. Livraison, paiement et tri sont repliés, avec un compteur de filtres actifs. Le vendeur n’est plus répété dans chaque résumé; sa colonne reste dans les détails. Un changement de périmètre masque toujours les anciens résultats jusqu’à une nouvelle lecture confirmée.
- **Salesforce vers D365** : étapes courtes, champs rapprochés et paramètres D365 repliables. Le bouton de prochaine étape reste au bas du panneau. L’import affiche directement les valeurs enregistrées, sans les effacer ni les désactiver pour une animation successive.
- **Coordonnées** : nom, téléphone, courriel et aperçu complet des notes sont directement accessibles. Coller une signature est une action repliable; Contact du lead se trouve dans le bandeau. Les conseils et diagnostics se déplient au besoin.
- **Calculateur et HS** : champs et résultats rapprochés, mêmes couleurs et contrôles. Origine et code HS partagent une rangée. Les avertissements, l’origine des taux et les sources restent consultables.

Les transitions durent généralement 120 à 220 ms. Une recherche ne fait plus bouger la liste pendant la saisie. La préférence de réduction des animations est respectée, y compris lorsqu’elle change pendant une animation. Les cibles tactiles et les champs restent plus grands sur écran tactile.

## Évolution Liquid Glass

La nouvelle direction demandée par Michaël remplace la signature colorée ci-dessous par des surfaces de verre, une navigation en capsule et deux apparences clair/sombre. La densité de cette refonte reste conservée. Voir [les préférences, les tests et les aperçus](liquid-glass-modes.md).

## Signature visuelle précédente

À la demande de Michaël, la présentation reçoit davantage de caractère après `a16d239` : bandeau violet profond avec lumière et trame diagonale, onglets actifs pleins, accents de couleur par outil et fiches blanches avec un repère latéral et un angle teinté. L’accueil utilise le symbole Solotech et un fond plus expressif. Les boutons et icônes réagissent au survol avec des transitions courtes.

Le CRM utilise le turquoise, les contacts le framboise, les commandes l’indigo, les calculs le violet et les codes HS l’ambre. Dans les produits, le neuf est vert émeraude, l’usagé violet et le non réservé bleu. Les quantités disponibles, les avertissements et les erreurs conservent leurs couleurs fonctionnelles et leurs libellés.

Les résultats gardent leur densité : le parcours Chromium sur douze vues affiche toujours sept commandes complètes et quatre produits Non-Reserved complets dans les panneaux de démonstration. Les contrastes du texte blanc sur les fonds d’onglets actifs dépassent 4,5:1, y compris aux extrémités des dégradés. Les contrôles de largeur, de clavier, de tactile et de réduction des animations passent avec cette signature visuelle.

## Mesure de densité

Comparaison locale Chromium avec les mêmes huit commandes fictives, le même périmètre « filtres actuels du rapport » et un panneau de **390 × 820 px**. Référence précédente : `4fceeb8`.

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Début de la première commande depuis le haut du panneau | 590 px | 273 px |
| Commandes entièrement visibles sans défilement | 2 | 7 |
| Hauteur du premier résumé de commande | 90 px | 66 px |

Ces chiffres mesurent la présentation sur ces données, pas la vitesse ou l’exhaustivité d’un rapport Power BI connecté. Des notes ou noms plus longs peuvent prendre davantage de hauteur.

## Aperçu et vérifications

`python3 checks/redesign-preview/build.py --overhaul` produit `/workspace/toolbox-overhaul-preview.html`. Il contient douze vues interactives du véritable code d’interface : quatre inventaires/commandes, quatre étapes CRM/coordonnées et quatre outils quotidiens. Chaque panneau peut être agrandi. Les données sont fictives, les actions externes sont simulées et l’aperçu fonctionne sans accès aux comptes ni à IndexedDB. Le générateur, la maquette de présentation et les fixtures restent dans `checks/`, hors du paquet de l’extension.

Vérifications exécutées :

- `python3 scripts/check.py` : 63 scripts et 23 suites du noyau.
- `python3 scripts/verify-version-archives.py --archives-only` : 11 snapshots historiques, 44 imports originaux et l’export 3.5.13 conservés.
- `node checks/overhaul-browser.test.cjs` : douze vues, sept commandes complètes et quatre produits Non-Reserved complets au premier affichage dans les panneaux de démonstration, détails souris/clavier, changement réel du périmètre simulé avant nouvelle lecture, coûts et finances par pays, contacts, import du lead, HS, marge et conversion; largeurs 320/390/520/900 px, popup 520 × 600, tactile, FR/EN, réduction des animations, aucun appel externe ni erreur navigateur.
- `node checks/instances-browser.test.cjs` : bootstrap et workers réels, sessions et onglets de travail indépendants, redémarrage et rechargement.
- `node checks/nonreserved-browser.test.cjs` : contrôles natifs d’export simulés, fichier XLSX et CRC, quantités nulles/fractionnaires et coûts par emplacement, filtres et persistance IndexedDB.
- `node checks/used-export-panel-browser.test.cjs`, `node checks/used-export-browser.test.cjs`, `node checks/ready-seller-browser.test.cjs` : parcours d’export, import et choix exact du vendeur dans des rapports fictifs.
- Après `python3 checks/redesign-preview/build.py --document-only` : `node checks/redesign-preview/runtime.cjs` et `node checks/used-prices-panel.test.cjs` pour les scripts réels, filtres, états, FR/EN et actions.
- `node checks/compact-preview-browser.test.cjs` reconstruit aussi l’ancien aperçu à deux panneaux avec la nouvelle interface.

Les générateurs écrivent le même document local ignoré par Git; exécuter les tests qui le reconstruisent successivement. Les captures 16:9 sont produites par le test de refonte dans `/workspace/toolbox-overhaul-preview.png`, `/workspace/toolbox-overhaul-crm.png` et `/workspace/toolbox-overhaul-tools.png`.

La validation dans les véritables sessions Power BI et D365 reste à faire, notamment pour le défilement et les contrôles natifs des rapports. Le sens de `InternalReference` reste à confirmer. Cette refonte ne constitue pas un nouvel export installable.
