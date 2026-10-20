# Historique du Inside Sales Toolbox

Inventaire établi le 20 octobre 2026. Le projet débute le 21 septembre 2026 sous le nom **Solotech Lead vers D365**, puis devient **Inside Sales Toolbox**. Les éditions personnelle et équipe sont distinguées.

## Ce qui est récupéré

**9 archives installables originales et 2 checkpoints complets** sont conservés dans Git. Chaque état dispose d’un commit et d’une branche. Les archives originales sont conservées sans modification et les sources extraites sont comparables fichier par fichier.

| Édition / état | Référence Git | Source conservée | Observation du fichier |
| --- | --- | --- | --- |
| Précurseur 1.7.2 | `versions/lead-v1.7.2` | `downloads/Solotech-Lead-vers-D365-Edge-v1.7.2.zip` | 29 septembre, UTC |
| Michaël 1.7.4 | `versions/michael-v1.7.4` | `downloads/Solotech-Lead-D365-Michael-v1.7.4.zip` | 2 octobre |
| Équipe 1.7.5 | `versions/equipe-v1.7.5` | `downloads/Solotech-Lead-D365-Equipe-v1.7.5.zip` | 2 octobre |
| Michaël 1.8.18 | `versions/michael-v1.8.18` | `downloads/Inside-Sales-Toolbox-Michael-v1.8.18.zip` | 14 octobre |
| Travail basé sur 3.5.6 | `checkpoints/equipe-base3.5.6-20261017` | `archives/Inside-Sales-Toolbox-Working-Source.json` | Checkpoint du 17 octobre, 124 fichiers |
| Équipe 3.5.7 | `versions/equipe-v3.5.7` | `downloads/Inside-Sales-Toolbox-Equipe-v3.5.7.zip` | 17 octobre |
| Équipe 3.5.8 de test | `versions/equipe-v3.5.8-test` | `downloads/Inside-Sales-Toolbox-Equipe-v3.5.8-test.zip` | 19 octobre; déjà présent dans Git |
| Équipe 3.5.9 | `versions/equipe-v3.5.9` | `downloads/Inside-Sales-Toolbox-Equipe-v3.5.9.zip` | 19 octobre |
| Équipe 3.5.10 | `versions/equipe-v3.5.10` | `downloads/Inside-Sales-Toolbox-Equipe-v3.5.10.zip` | 19 octobre |
| Équipe 3.5.11 | `versions/equipe-v3.5.11` | `downloads/Inside-Sales-Toolbox-Equipe-v3.5.11.zip` | 19 octobre |
| Travail après 3.5.11 | `work/after-v3.5.11` | `archives/Inside-Sales-Toolbox-Working-Source-2026-10-19.json.gz` | Checkpoint du 19 octobre à 18:44 UTC, 133 fichiers |

Les dates d’observation sont celles des fichiers conservés ou des métadonnées du checkpoint, pas une preuve indépendante de date de publication. Le JSON du 19 octobre est compressé sans perte; sa décompression redonne exactement les octets du fichier source. Son manifest reste en 3.5.11, mais trois fichiers de production diffèrent du ZIP 3.5.11. Cet état n’est pas une nouvelle publication.

## Premières versions documentées, sans source complète retrouvée

Ces numéros proviennent des conversations de développement retrouvées et, pour certains, des notices incluses dans les archives. Ils sont recensés comme traces documentaires. Ils n’ont ni faux ZIP ni commit prétendant restaurer leur code.

| Période | Édition | Numéros explicitement retrouvés | Trace et portée |
| --- | --- | --- | --- |
| 21 au 29 septembre | Précurseur | 1, 1.1, 1.1.2, 1.2.1, 1.3.1, 1.5, 1.6, 1.6.1, 1.6.2, 1.7, 1.7.1 | Premier ZIP nommé `Solotech-Lead-vers-D365-Edge-v1.zip`. Lead Salesforce, vérification, remplissage D365; pas de sauvegarde automatique dans la toute première livraison. |
| 13 et 14 octobre | Michaël | 1.8.0, 1.8.2, 1.8.3, 1.8.4, 1.8.5, 1.8.6, 1.8.7, 1.8.8, 1.8.9, 1.8.10, 1.8.11, 1.8.12, 1.8.13, 1.8.14, 1.8.15, 1.8.16, 1.8.17 | Passage au Toolbox, coordonnées et HS, persistance, clic droit, panneau latéral, produits et refonte visuelle. Le détail n’est pas connu pour chaque numéro. |
| 14 octobre | Équipe | 2.0.0, 2.0.1, 2.1.0, 2.1.1, 2.1.2, 2.1.4, 2.2.0 | Refonte équipe, FR/EN, Commandes prêtes, Ready to PIK, onglets et inventaire usagé. Le guide 2.0.1 est conservé. |
| 15 octobre | Équipe | 3.0.0 | Export mentionné dans les échanges; source complète non retrouvée. |
| 16 octobre | Équipe | 3.4.1, 3.5.0, 3.5.1, 3.5.2, 3.5.3, 3.5.4, 3.5.5 | Exports mentionnés dans les échanges. Les notices conservées documentent notamment les évolutions du parcours lead/prospect/soumission en 3.5.4 et 3.5.5. |
| 17 octobre | Équipe | 3.5.6 | Base mentionnée dans le checkpoint; le ZIP original 3.5.6 n’est pas récupéré. |

La présence de numéros supérieurs ne permet pas de confirmer tous les numéros intermédiaires. **1.8.1, 2.1.3 et les éventuelles autres versions intermédiaires restent non confirmés** avec les éléments retrouvés. Le nombre de révisions d’un fichier remplacé ne constitue pas une liste de publications. L’inventaire ne prétend donc pas être exhaustif au niveau des sources.

## Changements vérifiables entre les dernières archives

| Comparaison | Différences de fichiers de production |
| --- | --- |
| 3.5.7 vers 3.5.8-test | 5 fichiers modifiés, dont `used-powerbi-reader.js`; aucun ajout ni retrait. |
| 3.5.8-test vers 3.5.9 | 11 fichiers modifiés; ajout de `order-notes-reader.js` et `order-notes-worker.js`. |
| 3.5.9 vers 3.5.10 | 5 fichiers modifiés, dont `powerbi-reader.js`. |
| 3.5.10 vers 3.5.11 | 8 fichiers modifiés, dont le lecteur, le worker et le panneau Power BI. |
| ZIP 3.5.11 vers checkpoint suivant | `powerbi-reader.js`, `powerbi-worker.js` et `workspace-worker.js` modifiés; aucun fichier de production ajouté ou retiré. |

Le checkpoint suivant contient notamment le lecteur 2.2.0 pour la barre de défilement horizontale personnalisée et la reconnaissance de plusieurs URL du même rapport Open Orders. Il indique lui-même que le fonctionnement dans Power BI authentifié reste à vérifier et que l’équivalence entre `InternalReference` et `Internal Notes` n’est pas confirmée.

## Méthode Git et vérification

- L’historique déjà présent et les tags `v3.5.7` / `v3.5.8-test` sont conservés.
- La branche `history/recovered-versions` classe les états retrouvés. Ses parents représentent cet ordre d’archivage, pas une filiation originale prouvée entre éditions.
- Les commits de récupération sont datés de leur importation. Les dates historiques connues figurent dans cet inventaire; aucune date de développement n’est fabriquée.
- `main` contient les sources exactes du ZIP Équipe 3.5.11. L’état non exporté reste accessible sur `work/after-v3.5.11` et dans son archive.
- Les fichiers communs, personnels et d’équipe ont leurs propres dossiers. Les guides anciens sont conservés dans `docs/`.
- Les copies identiques du guide, du checkpoint ancien et de l’archive 3.5.7 sont dédupliquées.
- Certaines notices sont restées à un numéro plus ancien que leur manifest. Elles sont conservées telles quelles. Le nom de version du manifest et les empreintes contrôlent l’identité de l’archive.

`docs/version-inventory.json` donne les références, empreintes SHA-256 et comptes de fichiers. Depuis la racine du dépôt, exécuter `python3 scripts/verify-version-archives.py`. Ce contrôle compare les archives, les empreintes internes des checkpoints et chaque fichier à la référence Git correspondante. Il vérifie aussi que les sources d’équipe de `main` correspondent au ZIP 3.5.11.

Cette vérification établit la fidélité de la récupération. Elle ne remplace pas les essais dans Edge, Salesforce, Dynamics ou Power BI.
