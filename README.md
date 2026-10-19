# Inside Sales Toolbox Équipe

Extension locale Microsoft Edge pour les ventes internes. Les utilisateurs conservent leurs propres sessions Salesforce, Dynamics 365 et Power BI.

## Versions disponibles

| Référence | Ce qui est réellement disponible |
| --- | --- |
| Premières versions à 3.5.6 | Archives sources absentes de cette session. Aucun historique reconstruit artificiellement. |
| Guide 2.0.1 | Documentation historique seulement, dans `docs/`. |
| Checkpoint basé sur 3.5.6 | Source et tests originaux dans `archives/Inside-Sales-Toolbox-Working-Source.json`. Ce checkpoint ne constitue pas le ZIP de publication 3.5.6. |
| 3.5.7 | ZIP original et sources correspondantes, référence Git `v3.5.7`. |
| 3.5.8 de test | ZIP de test disponible. Le correctif Power BI reste à valider dans la session de l'utilisateur. |

## Téléchargements

- [Équipe 3.5.7 originale](downloads/Inside-Sales-Toolbox-Equipe-v3.5.7.zip)
- [Équipe 3.5.8 de test](downloads/Inside-Sales-Toolbox-Equipe-v3.5.8-test.zip)
- [Price List Finder LAB 0.7 indépendant](downloads/price-list-finder-lab-v07.zip)

Sur la page d'un ZIP dans GitHub, utiliser **Download raw file** pour le télécharger. Remplacer les fichiers du dossier d'installation existant, actualiser l'extension dans `edge://extensions`, actualiser les onglets concernés puis rouvrir le panneau. Ne pas désinstaller l'extension pour une simple mise à jour.

## Organisation

- `project/inside-sales-toolbox-team/` : extension Équipe, avec son `manifest.json`.
- `checks/` : tests et fixtures issus du checkpoint original.
- `labs/price-list-finder-lab-v07/` : prototype indépendant, sans intégration à l'extension principale.
- `docs/` : prompt de passation et ancien guide.
- `archives/` : checkpoint original, conservé sans modification.
- `downloads/` : archives installables disponibles.

## Validation et limites

Les tests Node.js utilisent des simulations locales. Ils ne prouvent pas le fonctionnement dans une session authentifiée Edge, Salesforce, D365 ou Power BI.

Le checkpoint contient 45 scripts `checks/*.test.cjs`. Son audit en mémoire a donné 43 réussites et deux blocages dus à des fichiers absents : `checks/ui-preview/mock.js` et `upload/data (11).xlsx`.

Pour préparer les tests d'interface, exécuter depuis la racine :

```sh
python3 -B checks/redesign-preview/build.py --document-only
```

Le fichier de prévisualisation généré est local. Exécuter ensuite les tests concernés avec `node checks/<nom>.test.cjs`. Les tests Excel utilisent aussi le module Node `sax`. Aucun gestionnaire de dépendances ni lockfile n'était fourni.

Le simulateur `checks/redesign-preview/demo.js` annonce encore la version 3.5.6. Avec le manifest 3.5.7, `work-area.test.cjs` échoue sur cette différence de version : 42 scripts réussissent, deux sont bloqués et un échoue sur ce point de simulation. Les fichiers originaux ont été préservés.

La comparaison complète montre 69 fichiers d'extension identiques entre le checkpoint et le ZIP 3.5.7. Les quatre différences concernent le numéro de version et la documentation. Le lecteur Power BI 1.2.0 est présent dans les deux sources malgré la mention « non exporté » du checkpoint.
