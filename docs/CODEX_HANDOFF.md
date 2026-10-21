# Reprise du projet dans Codex

État du 21 octobre 2026. Demande de Michaël : transférer le projet dans Codex et garder le développement et ses versions sur GitHub.

## Transfert des archives originales

Michaël a donné son accord explicite de divulgation publique des 44 archives, dont le ZIP 3.5.12. Le transport du commit `c82dfd3a41c38821c192fabeed87a91f8548570d` a été vérifié : tar.xz de 3 543 924 octets, SHA256 `c2f9b7ab4f1e6cab3dfa1dc1ce41cf229402be5d435bd4c517a43ac1ee535c1d`. Les 49 ZIP passent les contrôles SHA256, taille, CRC, chemins et versions des manifests; cinq étaient déjà identiques, 44 sont importés dans des commits individuels sans antidatation. Aucun ZIP n’a été régénéré.

Le catalogue `docs/ARCHIVES.md`, les empreintes et l’inventaire distinguent les 44 archives importées des 11 snapshots reconstruits. Le vérificateur conserve les anciennes références (745 fichiers comparés) et compare les 75 fichiers actuels au ZIP original 3.5.12. Les 53 scripts et les 12 suites du noyau passent, ainsi que `release.py --edition equipe --check`. Les autres éditions, le laboratoire, les neuf archives antérieures et les deux checkpoints sont préservés.

Le transport provisoire a été supprimé dans un commit séparé; son historique reste accessible. `.release/equipe.json` est copié du transport original et accompagne le ZIP 3.5.12 dans le même envoi. La création de PR via l’API GitHub est bloquée par une réponse `Forbidden`; l’intégration sur main est explicitement autorisée par Michaël. Le résultat effectif des workflows et de la publication sera confirmé après cet envoi.

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
