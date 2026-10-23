# Reprise du projet dans Codex

État du 23 octobre 2026. Demande de Michaël : transférer le projet dans Codex et garder le développement et ses versions sur GitHub.

## Export 3.5.15 : fenêtres indépendantes et design adouci

La demande est précisée : indépendance **par fenêtre du navigateur**, avec continuité entre ses onglets et liaison facultative entre fenêtres. Le panneau global remplace les panneaux par onglet. Le bouton de chaîne permet de lier, séparer en copiant les données ou reprendre le travail précédent. « Préparer ma journée » utilise une fenêtre de travail distincte, en arrière-plan, accessible depuis ce menu; les fenêtres liées la partagent. Les réservations de rapports et les données Non réservé restent séparées entre sessions indépendantes.

Le style d’essai mélange les repères Solotech et Teenage Engineering, conserve l’orange et reprend Segoe UI, avec des contours plus doux. L’image wordmark intermédiaire est retirée de l’en-tête. Les détails, la portée de conservation, les contrôles et les limites sont dans [le compte rendu](diagnostics/window-sessions-soft-industrial.md). Sur demande explicite d’export, ce travail devient la préversion équipe 3.5.15 de la branche d’essai. Le ZIP et le tag 3.5.14 restent inchangés. Voir [les notes 3.5.15](releases/equipe-3.5.15.md).

Archive préparée : `downloads/Inside-Sales-Toolbox-Equipe-v3.5.15.zip`, 1 252 644 octets, 93 fichiers, SHA256 `72f6de12a2f2ab7980e8175e36a93abbfccf8f96b6680da2cfc003d9c4996450`. Les 66 scripts et 25 suites du noyau passent localement; le ZIP passe son CRC et correspond exactement aux sources. La publication utilise le nouveau tag `equipe-v3.5.15` sur la branche `preview/teenage-engineering`; les résultats distants doivent être vérifiés après l’envoi.

Le premier lot [`be07b6e523137fc3faaedffc4702d4b003af9436`](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/commit/be07b6e523137fc3faaedffc4702d4b003af9436) est envoyé sur `fix/window-sessions`, puis intégré en avance rapide sur `preview/teenage-engineering`. Vérifications GitHub : [39968576984](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/actions/runs/39968576984) sur la branche de travail et [39968684958](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/actions/runs/39968684958) sur la branche d’essai, toutes deux **Success**. La création de PR par `gh pr create` reste refusée par l’API GraphQL (`Forbidden`); les envois Git autorisés fonctionnent. Les contrôles complémentaires couvrent aussi la saisie/effacement du lead et ses étapes entre fenêtres liées, et des identités de fenêtres qui ne dépendent jamais du numéro d’un onglet.

## Essai Teenage Engineering — export 3.5.14 sur branche

Michaël demande explicitement un ZIP installable de `preview/teenage-engineering`, après l’aperçu `e6f4250`. Le matériau industriel de la maquette est chargé dans l’extension réelle, avec clair/sombre et icônes sans texte. Le manifest et les mentions embarquées portent 3.5.14 et TE (test). Le workflow de publication est adapté sur cette branche pour publier uniquement une préversion équipe; aucune intégration de ce style sur `main` n’est demandée. Voir [les notes et l’installation](releases/equipe-3.5.14.md).

Archive préparée : downloads/Inside-Sales-Toolbox-Equipe-v3.5.14.zip, 1244951 octets, 89 fichiers, SHA256 `0c61512edb79ee27134795e5820367bdc1bb2d1ce254ca40e9829f9f0d6bfdc5`. Les 64 scripts, 24 suites, douze vues Chromium et tests d’instances sont vérifiés localement; les essais connectés restent distincts. Le ZIP est contrôlé par CRC et comparaison exacte aux sources. Le tag `equipe-v3.5.14` est vérifié sur le commit [`0b9b4b526bb3862c1f0bee30e90f0da2080f2d45`](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/commit/0b9b4b526bb3862c1f0bee30e90f0da2080f2d45).

Résultats distants vérifiés pour cet export :

- [Vérifications GitHub 39961251990](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/actions/runs/39961251990), **Success**.
- [Publication GitHub 39961252047](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/actions/runs/39961252047), **Success**, depuis la branche `preview/teenage-engineering`.
- [Prépublication équipe 3.5.14](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/releases/tag/equipe-v3.5.14) : le badge Pre-release est confirmé. Le [ZIP effectivement publié](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/releases/download/equipe-v3.5.14/Inside-Sales-Toolbox-Equipe-v3.5.14.zip) a été retéléchargé : 1 244 951 octets, 89 fichiers, CRC valide, égalité octet pour octet avec le ZIP local et manifeste TE (test) 3.5.14. Son [fichier SHA256](https://github.com/mikkepapineau-lang/Inside-Sales-Toolbox/releases/download/equipe-v3.5.14/Inside-Sales-Toolbox-Equipe-v3.5.14.zip.sha256) publié est également vérifié.
- `main` reste sur `af368ba0eba8fdb3ba8170aa920fa62750255a9e` avec sa direction Liquid Glass et les icônes sans texte. L’essai installable Teenage Engineering demeure sur sa branche et son tag. Les archives et tags précédents sont conservés.

## Développement après 3.5.13

La direction visuelle est reprise à la demande de Michaël dans un style inspiré du Liquid Glass : navigation en capsule, surfaces translucides et reflets doux. Un bouton lune/soleil propose **clair et sombre**, avec préférence de l’appareil par défaut et choix mémorisé par instance. Le module HS suit son Toolbox, les autres onglets restent indépendants. La navigation affiche uniquement les icônes; les noms restent dans les infobulles au survol et les libellés accessibles FR/EN. Les douze vues et la densité des listes sont conservées. Vérifications : 64 scripts, 24 suites, parcours Chromium dans les deux modes et persistance/isolation du stockage réel. Voir [le fonctionnement, l’aperçu et les limites](diagnostics/liquid-glass-modes.md). Aucun nouvel export installable n’est créé.

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
