# Interface Liquid Glass et modes clair/sombre

Édition équipe, développement du 23 octobre 2026 après la livraison 3.5.13. Michaël demande une nouvelle direction inspirée du Liquid Glass d’Apple, avec un choix clair ou sombre.

Les bandeaux fortement colorés par outil sont remplacés par des matières translucides cohérentes, un fond lumineux diffus, des reflets fins et une navigation en capsule. Les formulaires, les produits Neuf/Usagé/Non réservé, les commandes, les contacts, le parcours CRM, le calculateur et le module HS suivent cette matière. Les résultats conservent leur densité et leurs informations : les fiches n’ont pas de flou individuel. Le flou est réservé aux surfaces communes et aux menus ouverts pour limiter le coût de rendu.

La navigation garde uniquement les icônes, sans texte dessous. Le nom de l’outil est disponible au survol dans l’infobulle native du navigateur et dans son nom accessible, en français ou en anglais. Le titre de l’outil actif reste dans le bandeau.

## Choisir l’apparence

Le bouton lune/soleil de l’en-tête bascule immédiatement entre clair et sombre. Sans choix enregistré, le Toolbox suit la préférence de l’appareil et ses changements. Après un choix explicite, cette préférence reste prioritaire.

Le choix est enregistré dans le stockage privé de l’instance, comme la navigation et les autres préférences. Il résiste au rechargement de la vue et au redémarrage du worker; il ne change pas l’apparence d’un autre onglet. Une nouvelle session de navigateur ou un nouvel onglet sans préférence suit de nouveau l’appareil. Le module HS embarqué suit le Toolbox qui le contient, sans préférence concurrente. Le bouton indique l’action suivante, avec un libellé accessible en français ou en anglais.

Une restauration lente n’annule pas un clic récent. Les écritures de clics rapides restent ordonnées. Une erreur de stockage laisse le bouton utilisable; la mémorisation ne peut alors pas être garantie. Aucune nouvelle permission navigateur n’est demandée.

## Lisibilité et accessibilité

Chaque apparence définit ses propres couleurs de texte, surfaces, séparateurs, disponibilité et avertissements. Les prix, NBV, quantités et valeurs zéro gardent leur sens. Les contrôles natifs utilisent le bon `color-scheme`. Les animations brèves existantes respectent la réduction des animations. Un repli plus opaque est prévu sans prise en charge du flou; les préférences de réduction de transparence et le mode couleurs forcées disposent de règles spécifiques.

## Vérifications

- `python3 scripts/check.py` : 64 scripts et 24 suites du noyau, dont une nouvelle suite couvrant le suivi de l’appareil, la restauration, les clics rapides, le stockage défaillant, les libellés FR/EN et l’héritage HS.
- `node checks/overhaul-browser.test.cjs` : douze vues réelles sur données fictives; clair/sombre, héritage HS, absence de débordement à 320/390/520/900 px, popup 520 × 600, clavier, tactile, langue et réduction des animations. Le contraste calculé des textes client/SO/montant sur les fiches de commandes dépasse 4,5:1 dans les deux modes. Ce contrôle ciblé ne constitue pas un audit d’accessibilité complet.
- Même galerie de démonstration : sept commandes complètes et quatre produits Non-Reserved complets restent visibles dans des panneaux de 375 × 756 px.
- `node checks/instances-browser.test.cjs` : bootstrap réel et stockage IndexedDB; thèmes indépendants entre deux instances, rechargement de vue, redémarrage du worker et transmission au module HS. Les services distants sont remplacés par des données fictives.
- `python3 scripts/verify-version-archives.py --archives-only` : archives stockées préservées. Aucun numéro, ZIP, tag ni fichier `.release` n’est modifié.

## Aperçu

`python3 checks/redesign-preview/build.py --overhaul` produit `/workspace/toolbox-overhaul-preview.html`, avec le code réel et douze vues de démonstration. Le bouton de la galerie bascule toutes les vues; le bouton propre à chaque Toolbox reste indépendant. Les captures et une copie dédiée sont enregistrées sous `/workspace/toolbox-liquid-glass-*` pour la revue. Les données sont entièrement fictives, sans appel externe ni export réel.

Les essais Power BI/D365 connectés et l’installation dans le navigateur de Michaël restent distincts de ces vérifications locales.
