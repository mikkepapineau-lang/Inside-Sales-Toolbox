# Reprise du projet dans Codex

État du 23 octobre 2026. Demande de Michaël : transférer le projet dans Codex et garder le développement et ses versions sur GitHub.

## Développement après 3.5.13

La signature visuelle est renforcée à la demande de Michaël : bandeau violet texturé, couleurs par outil, onglets actifs plus marqués et fiches compactes avec accents graphiques. L’aperçu interactif couvre toujours douze vues; sept commandes complètes et quatre produits Non-Reserved restent visibles dans les panneaux de démonstration. Voir [la signature et ses vérifications](diagnostics/compact-toolbox-overhaul.md#signature-visuelle).

La refonte complète de l’interface équipe condense tous les outils : un seul titre, actions dans le bandeau, filtres secondaires repliés, fiches de stock sur des lignes courtes, formulaires rapprochés et animations brèves. Sur les mêmes huit commandes fictives dans un panneau 390 × 820, sept commandes complètes sont visibles contre deux au commit `4fceeb8`. Voir [les changements, la mesure et les douze vues de l’aperçu](diagnostics/compact-toolbox-overhaul.md). Les 63 scripts, 23 suites et parcours Chromium sont vérifiés localement; Power BI/D365 connectés restent à essayer. Aucun nouvel export installable n’est créé.

La vue de produits est compactée, avec filtres repliés et inventaire sur des lignes courtes. Commandes prêtes demande **Sales Responsible**, champ confirmé par Michaël, et contrôle le périmètre du relevé. Les vues du Toolbox disposent de sessions, de résultats et d’onglets de travail indépendants. Voir [le fonctionnement, les tests et l’aperçu](diagnostics/compact-sessions-ready.md). Vérification courante : 63 scripts et 23 suites, plus les parcours Chromium; essais connectés toujours à faire.

L’actualisation Usagé, ses messages et son bouton d’arrêt sont placés tout en bas, après les produits, la pagination et Options du catalogue (commit `ba0a620`).

Le troisième onglet Recherche de produits, **Non réservé**, utilise le rapport Non-Reserved Item List et la page Non-Reserved List to Sell fournis par Michaël. Il automatise les trois points du tableau, l’export XLSX et l’import d’un catalogue indépendant en IndexedDB. Quantités non réservées et coûts unitaires moyens restent propres aux lignes société/site/entrepôt; ils ne sont pas assimilés aux prix ou NBV de l’usagé. Voir [le parcours, les tests et les limites](diagnostics/nonreserved-excel.md). Les 59 scripts et 21 suites passent avec les essais Chromium sur données fictives. La validation Power BI connectée reste à faire.

Ces changements sont des commits de développement. La publication 3.5.13 ci-dessous, son ZIP original et son tag restent conservés. Un nouvel export installable attend une demande explicite.

## Export équipe 3.5.13

Sur demande explicite d’export du 22 octobre 2026, les changements vérifiés de la branche `fix/subregion-visual-diagnostic` sont regroupés dans la livraison **3.5.13**. Le manifest, les mentions embarquées et LIRE-MOI sont actualisés; l’édition personnelle et le guide séparé sont conservés.

Le ZIP `downloads/Inside-Sales-Toolbox-Equipe-v3.5.13.zip` contient 76 fichiers, pèse 1215516 octets et porte le SHA256 `325b9238aca937fa3c6d8edf2ebd6d7be2dc60945217d8c2c7a573c732f568bf`. `.release/equipe.json` déclenche sa publication avec le tag `equipe-v3.5.13`. Ce nouvel export est inventorié dans `exported_archives`, distinct des archives originales importées.

Fonctionnalités et limites : [notes 3.5.13](releases/equipe-3.5.13.md). Vérifications locales : 54 scripts, 19 suites du noyau, interface et fichiers XLSX dans Chromium, CRC et égalité exacte du ZIP avec les sources. Le parcours complet des trois pays dans la session Power BI connectée et le sens de InternalReference restent à confirmer. Résultats distants vérifiés :

- Intégration sur `main`, sans squash ni push forcé : [`9aa968191d50d91419e04a621396a0d86312326a`](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/commit/9aa968191d50d91419e04a621396a0d86312326a). Les commits de développement sont conservés.
- Vérifications du commit d’export sur sa branche : [run 39786915472](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/actions/runs/39786915472), **Success**. Le contrôle sur main est [39786936098](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/actions/runs/39786936098).
- Publication automatique : [run 39786936314](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/actions/runs/39786936314), **Success**.
- [Publication équipe 3.5.13](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/releases/tag/equipe-v3.5.13) : tag vérifié sur le commit de livraison ci-dessus, sans modification du tag 3.5.12.
- Le [ZIP publié](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/releases/download/equipe-v3.5.13/Inside-Sales-Toolbox-Equipe-v3.5.13.zip) a été téléchargé puis comparé octet pour octet à l’export local : 1 215 516 octets, 76 fichiers, CRC valide, SHA256 `325b9238aca937fa3c6d8edf2ebd6d7be2dc60945217d8c2c7a573c732f568bf`. Le [fichier SHA256 publié](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/releases/download/equipe-v3.5.13/Inside-Sales-Toolbox-Equipe-v3.5.13.zip.sha256) a été téléchargé et vérifié.
- Le vérificateur complet passe après récupération du tag : 11 snapshots historiques, 44 archives originales importées, 1 nouvel export, 821 fichiers sources comparés et 76 fichiers courants identiques au ZIP. `--archives-only` passe aussi dans une copie sans Git avec des sources de travail non exportées; il ne compare aucune source courante.

La création de PR par l’API reste indisponible dans cet environnement; l’intégration autorisée a utilisé un push Git en avance rapide. Aucune validation Power BI/D365 connectée n’est incluse dans ces résultats.

## Transfert des archives originales

Michaël a donné son accord explicite de divulgation publique des 44 archives, dont le ZIP 3.5.12. Le transport du commit `c82dfd3a41c38821c192fabeed87a91f8548570d` a été vérifié : tar.xz de 3 543 924 octets, SHA256 `c2f9b7ab4f1e6cab3dfa1dc1ce41cf229402be5d435bd4c517a43ac1ee535c1d`. Les 49 ZIP passent les contrôles SHA256, taille, CRC, chemins et versions des manifests; cinq étaient déjà identiques, 44 sont importés dans des commits individuels sans antidatation. Aucun ZIP n’a été régénéré.

Le catalogue `docs/ARCHIVES.md`, les empreintes et l’inventaire distinguent les 44 archives importées des 11 snapshots reconstruits. Le vérificateur conserve les anciennes références (745 fichiers comparés) et compare les 75 fichiers actuels au ZIP original 3.5.12. Les 53 scripts et les 12 suites du noyau passent, ainsi que `release.py --edition equipe --check`. Les autres éditions, le laboratoire, les neuf archives antérieures et les deux checkpoints sont préservés.

Le transport provisoire a été supprimé dans un commit séparé; son historique reste accessible. `.release/equipe.json` est copié du transport original et accompagne le ZIP 3.5.12 dans le même envoi. La création de PR via l’API GitHub est bloquée par une réponse `Forbidden`; l’intégration sur main est explicitement autorisée par Michaël. Les résultats distants sont confirmés ci-dessous.

## Point de départ du transfert (3.5.12)

- Dépôt officiel : https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES, branche `main`.
- Édition active : `project/inside-sales-toolbox-team/`, export **3.5.12**.
- ZIP original : `downloads/Inside-Sales-Toolbox-Equipe-v3.5.12.zip`, 1 174 696 octets.
- SHA256 : `ee2d548238ada10b90c0569b1cd3d22bb91142a331fb3d3ad3cbd09186408cf6`.
- Les règles de travail permanentes sont dans `AGENTS.md`. Lire aussi `docs/DEVELOPPEMENT.md`, le CHANGELOG et les notes 3.5.12.

## Changements livrés en 3.5.12

- Extraction Power BI des Internal Notes à droite du tableau, avec parcours horizontal et vertical, association par SO, contrôles contre les lignes recyclées et restauration du défilement.
- Notes et renseignements de contact sous la SO. Une valeur vide confirmée est distinguée d'une colonne non chargée. `InternalReference` n'est pas un alias de `Internal Notes` : son sens reste à confirmer.
- Reconnaissance des liens Open Orders directs, intégrés et courts; réutilisation des onglets.
- Liens présentés comme boutons; titres des champs du calculateur plus visibles.
- Signe `$` près des champs monétaires et conversions, en conservant CAD/USD et le format local.

## Vérifications du transfert 3.5.12 et limites initiales

Les 53 scripts de production ont passé le contrôle de syntaxe et les 12 suites du noyau passent. Le test SUBREGION attend maintenant la version réelle 1.2.1 du lecteur, au lieu de l'ancienne 1.2.0. Le ZIP 3.5.12 est inchangé et correspond octet pour octet aux 75 fichiers de production.

Les tests du lecteur utilisent des fixtures. La manipulation du véritable ascenseur personnalisé Power BI et les notes réellement affichées chez l'utilisateur restent à essayer dans une session connectée. Ne pas annoncer une validation live ou un accès à sa session Power BI sans observation.

## Transfert terminé et résultats distants

- Intégration sur main : [`cf50f340562772b133468b856230f16ce6f1b59f`](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/commit/cf50f340562772b133468b856230f16ce6f1b59f). Les 44 commits d’import sont conservés dans son historique, sans squash ni push forcé.
- Catalogue et vérificateur : [`8ba2605`](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/commit/8ba2605).
- Suppression du transport dans un commit séparé : [`6488d7b`](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/commit/6488d7b).
- Vérifications GitHub : [run 39605240067](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/actions/runs/39605240067), **Success**.
- Publication GitHub : [run 39605240132](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/actions/runs/39605240132), **Success**.
- Export existant publié comme préversion : [équipe 3.5.12](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/releases/tag/equipe-v3.5.12), tag `equipe-v3.5.12` vérifié sur le commit d’intégration ci-dessus.
- Le [ZIP publié](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/releases/download/equipe-v3.5.12/Inside-Sales-Toolbox-Equipe-v3.5.12.zip) a été téléchargé puis comparé octet pour octet au ZIP original : 1 174 696 octets, CRC valide et SHA256 `ee2d548238ada10b90c0569b1cd3d22bb91142a331fb3d3ad3cbd09186408cf6`. Le [fichier d’empreinte publié](https://github.com/mikkepapineau-lang/TOOLBOX-INSIDE-SALES/releases/download/equipe-v3.5.12/Inside-Sales-Toolbox-Equipe-v3.5.12.zip.sha256) a également été téléchargé et vérifié.

La publication et le tag ont été créés par le workflow préparé, sans nouveau numéro ni génération de ZIP. L’API GitHub étant bloquée dans cette session, les résultats ont été constatés sur les pages publiques des runs, le tag via Git, et les fichiers par téléchargement HTTPS. Aucune vérification Power BI/D365 connectée n’est incluse.

Le transport reste consultable dans l’historique du commit `c82dfd3`; le dossier complet de reprise reste aussi sauvegardé dans la Bibliothèque. La copie partielle `repository/` n’a pas remplacé le clone ni les autres éditions. Le contexte technique utile est transmis; les anciennes conversations et captures disparues ne sont pas intégralement importées.

## Préférences durables

- Travailler sur l'édition équipe. L'édition personnelle et le guide séparé se modifient seulement sur demande.
- Un ZIP et un nouveau numéro installable uniquement sur demande « export ». Les changements intermédiaires sont des commits.
- Vérifier, committer et pousser chaque ensemble de changements terminé pendant la même séance; signaler tout échec d'envoi.
- Préserver les archives, tags et commits. Aucun push forcé.
- Répondre en français clair et donner des liens concrets vers les résultats.

Ce document transfère le contexte technique utile. Il ne prétend pas importer l'intégralité de l'historique des conversations ou des captures qui ne sont plus disponibles.
