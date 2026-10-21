# Reprise du projet dans Codex

État du 21 octobre 2026. Demande de Michaël : transférer le projet dans Codex et garder le développement et ses versions sur GitHub.

## Autorisation et accès aux archives

Michaël a confirmé directement dans la conversation d'origine, le 21 octobre 2026, son accord de publication des 44 archives originales manquantes, dont le ZIP 3.5.12, dans le dépôt GitHub public, après avoir été informé du risque de données internes. Le refus automatique précédent est résolu par cet accord direct. Les cinq autres ZIP du lot sont déjà identiques dans le dépôt public.

L'environnement Codex est publié. Son clone a confirmé le code, les 53 scripts et les 12 suites du noyau. Il n'expose pas les outils Library et son montage `/workspace/library-files` est vide : pour lui transmettre les archives, un dossier provisoire `.migration/2026-10-21-original-archives/` contient les 49 ZIP originaux regroupés sans modification, comprimés et encodés en parties ordonnées. Lire son README, vérifier la taille, le SHA256 et le manifeste avant toute importation. L'accès ne dépend plus de Library.

Après l'importation et la vérification des originaux sous `downloads/`, retirer le dossier provisoire dans un commit séparé et actualiser ce document avec les liens de publication. L'historique doit rester conservé. Les imports et la publication ne sont annoncés terminés qu'après vérification effective de GitHub.

## Point de départ

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

## Vérifications et limites

Les 53 scripts de production ont passé le contrôle de syntaxe et les 12 suites du noyau passent. Le test SUBREGION attend maintenant la version réelle 1.2.1 du lecteur, au lieu de l'ancienne 1.2.0. Le ZIP 3.5.12 est inchangé et correspond octet pour octet aux 75 fichiers de production.

Les tests du lecteur utilisent des fixtures. La manipulation du véritable ascenseur personnalisé Power BI et les notes réellement affichées chez l'utilisateur restent à essayer dans une session connectée. Ne pas annoncer une validation live ou un accès à sa session Power BI sans observation.

## Contenu du dossier de transfert

Le dossier joint à la tâche contient `repository/` (sources et processus préparés), `archives/` (49 ZIP originaux retrouvés), `archives.json` (tailles et empreintes), `SHA256SUMS.txt` et `START_HERE.md`.

Le dépôt distant contenait déjà neuf archives originales et deux checkpoints avant ce transfert. Cinq de ces archives se retrouvent parmi les 49 ZIP joints. Il reste donc 44 ZIP à ajouter, dont la 3.5.12. Les autres archives et toutes les branches existantes doivent être conservées. Une archive récupérée doit être présentée comme une importation, sans inventer une date de commit d'origine.

## Première tâche dans Codex

1. Cloner le dépôt et lire son état actuel. Ne pas supposer que les fichiers joints constituent un clone complet : `repository/` est une copie partielle destinée à compléter le dépôt existant.
2. Importer les ZIP absents depuis `archives/`, en vérifiant leurs empreintes. Ne jamais remplacer un ZIP différent portant le même nom. Garder un commit d'importation par version récupérée et classer les versions par édition.
3. Ajouter le ZIP original 3.5.12 et son fichier `.release/equipe.json` préparé. Faire évoluer l'inventaire et le vérificateur historique : le script actuel compare encore `main` à la 3.5.11, ce qui devient obsolète après cette mise à jour. Conserver la vérification des anciennes références.
4. Valider `python3 scripts/check.py`, `python3 scripts/verify-version-archives.py --archives-only` et `python3 scripts/release.py --edition equipe --check`. Vérifier les workflows et publier la version existante 3.5.12 avec son tag, sans fabriquer un nouvel export.
5. Confirmer les commits, les archives et la publication réellement présents sur GitHub. Un fichier préparé ou une tâche lancée ne prouve pas que la publication a réussi.

Le fichier `.release/equipe.json` se trouve aussi dans le dossier de transport, sous `release/equipe.json`. L'envoyer à `main` uniquement avec son ZIP original afin de déclencher une publication vérifiable.

## Préférences durables

- Travailler sur l'édition équipe. L'édition personnelle et le guide séparé se modifient seulement sur demande.
- Un ZIP et un nouveau numéro installable uniquement sur demande « export ». Les changements intermédiaires sont des commits.
- Vérifier, committer et pousser chaque ensemble de changements terminé pendant la même séance; signaler tout échec d'envoi.
- Préserver les archives, tags et commits. Aucun push forcé.
- Répondre en français clair et donner des liens concrets vers les résultats.

Ce document transfère le contexte technique utile. Il ne prétend pas importer l'intégralité de l'historique des conversations ou des captures qui ne sont plus disponibles.
