# Étude visuelle inspirée de Teenage Engineering

Branche expérimentale `preview/teenage-engineering`, issue de `af368ba` (navigation sans texte sous les icônes). Demandée par Michaël pour comparer une autre philosophie de design avant de décider de l’adopter.

Cette branche ajoute uniquement trois fichiers d’aperçu dans `checks/redesign-preview/`. Les fichiers de l’extension dans `project/`, les exports, les tags et la branche `main` conservent leur état. Aucun nouvel export installable n’est créé et cette étude n’est pas intégrée à `main`.

La proposition utilise des gris mats, des accents orange, des cellules rectangulaires, des légendes techniques et des chiffres façon afficheur d’instrument. Elle présente quatre vues du Toolbox réel : inventaire usagé, commandes prêtes, calculateur et accueil. Les icônes de navigation restent seules, avec leur titre au survol. Les modes clair et sombre sont consultables.

Générer l’aperçu :

```sh
python3 checks/redesign-preview/teenage.py
```

Résultat : `/workspace/toolbox-teenage-engineering-preview.html`, autonome et interactif. Le générateur réutilise les adaptateurs de démonstration existants et injecte une feuille de style **uniquement dans l’aperçu**, y compris son module HS. Il ne modifie aucun fichier de production. Le générateur de base actualise aussi ses fichiers d’aperçu habituels; l’aperçu Liquid Glass dédié conserve son propre fichier.

Captures de revue en 16:9 : `/workspace/toolbox-teenage-engineering-light.png` et `/workspace/toolbox-teenage-engineering-dark.png`.

Vérification locale Chromium : quatre vues rendues dans les deux modes, filtres fonctionnels sur les données fictives, icônes sans libellés visibles, noms accessibles, héritage du thème dans HS, aucune erreur JavaScript ni requête externe. Les actions Salesforce/D365/Power BI sont simulées; cette étude visuelle ne valide aucun service connecté.
